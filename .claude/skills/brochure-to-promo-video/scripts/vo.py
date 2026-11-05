"""Make the narration, time every word, and write what the film builds from.

  render: voice each script line, join with the script's pauses
      vo.py render --via voicestudio --api http://127.0.0.1:8765 [--speed 1.0] [--effect-preset raw]
      vo.py render --via direct --model-dir <piper or kokoro dir> [--kokoro-sid 16] [--speed 1.0]
  take:   align a narration somebody else recorded (a human, or VoiceStudio run on another machine)
      vo.py take --audio take.wav

Common: --script script.json (default) --project . --voice-label "<what to say it was>"
Writes  assets/vo/vo.wav      48 kHz mono, loudness-normalised to -16 LUFS / -1.5 dBTP
        build/timing.json     per line and per word start/end seconds (what build.mjs reads)
        build/vo_report.json  what an ASR heard per line, word error rate vs the script, flags

script.json: {"lines": [{"id": "L1", "text": "...", "pause": 0.45, "cap": "phrase / phrase"}...],
              "pronunciation": {"Name": "Respelling", ...}}
A line's "pause" is the silence after it (render mode). Pronunciation respellings go to VoiceStudio's own
dictionary (--via voicestudio) or are applied here (--via direct). Numbers are left to each engine's
text normalisation; check the ASR transcript in vo_report.json to confirm they were said right.

Timing comes from Parakeet ASR (sherpa-onnx) run on the audio itself, so captions and cues land on words
the voice really said. ASR failures are flagged, never hidden: a line whose transcript drifts from the
script (WER > 0.25) is listed in the report.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request
from pathlib import Path

import numpy as np
import scipy.signal as sps
import sherpa_onnx
import soundfile as sf

OUT_SR = 48000
NUMBER_KEY = re.compile(r"^[\d.,%$€£+\-]+$")


# ── audio helpers ───────────────────────────────────────────────────────────
def speech_bounds(a, sr, floor_db=-42.0):
    hop = int(sr * 0.01)
    n = len(a) // hop
    rms = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
    db = 20 * np.log10(rms / (np.abs(a).max() + 1e-9))
    on = np.where(db > floor_db)[0]
    return (on[0] * hop / sr, (on[-1] + 1) * hop / sr) if len(on) else (0.0, len(a) / sr)


def silences(a, sr, floor_db=-42.0, min_len=0.3):
    """(start, end) seconds of every silence at least min_len long."""
    hop = int(sr * 0.02)
    n = len(a) // hop
    db = 20 * np.log10(np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12) / (np.abs(a).max() + 1e-9))
    quiet, out, start = db < floor_db, [], None
    for i, q in enumerate(quiet):
        if q and start is None:
            start = i
        if (not q or i == n - 1) and start is not None:
            if (i - start) * hop / sr >= min_len:
                out.append((start * hop / sr, i * hop / sr))
            start = None
    return out


def loudnorm(src, dst, target=-16.0, tp=-1.5, lra=11.0):
    """Two-pass ffmpeg loudnorm: social delivery is about -16 LUFS with headroom for the sound effects."""
    f = f"loudnorm=I={target}:TP={tp}:LRA={lra}"
    probe = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(src), "-af", f + ":print_format=json", "-f", "null", "-"],
                           capture_output=True, text=True).stderr
    m = json.loads(probe[probe.rindex("{"): probe.rindex("}") + 1])
    f2 = (f + f":measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", f2, "-ar", str(OUT_SR), "-ac", "1",
                    "-c:a", "pcm_s16le", str(dst)], check=True)
    print(f"loudness {m['input_i']} LUFS / {m['input_tp']} dBTP -> {target} LUFS / {tp} dBTP")


# ── ASR timing ──────────────────────────────────────────────────────────────
def make_asr(asr_dir):
    d = Path(asr_dir)
    return sherpa_onnx.OfflineRecognizer.from_transducer(
        encoder=str(d / "encoder.int8.onnx"), decoder=str(d / "decoder.int8.onnx"), joiner=str(d / "joiner.int8.onnx"),
        tokens=str(d / "tokens.txt"), model_type="nemo_transducer", num_threads=4)


def asr_words(rec, a, sr, max_chunk=28.0):
    """[{w, start}] for audio of any length: long audio is cut at silences so the recogniser stays reliable."""
    cuts, t = [0.0], 0.0
    if len(a) / sr > max_chunk:
        for s0, s1 in silences(a, sr, min_len=0.25):
            mid = (s0 + s1) / 2
            if mid - cuts[-1] >= max_chunk * 0.6 and mid - cuts[-1] <= max_chunk * 1.2:
                cuts.append(mid)
            elif mid - cuts[-1] > max_chunk * 1.2:
                cuts.append(mid)
    cuts.append(len(a) / sr)
    words, texts = [], []
    for c0, c1 in zip(cuts[:-1], cuts[1:]):
        seg = sps.resample_poly(a[int(c0 * sr):int(c1 * sr)], 16000, sr).astype(np.float32)
        s = rec.create_stream()
        s.accept_waveform(16000, seg)
        rec.decode_stream(s)
        r = s.result
        texts.append(r.text)
        for tok, ts in zip(r.tokens, r.timestamps):
            if tok.startswith((" ", "▁")) or not words or words[-1].get("chunk") != c0:
                words.append({"w": tok.strip(" ▁"), "start": c0 + float(ts), "chunk": c0})
            else:
                words[-1]["w"] += tok
    return [w for w in words if w["w"]], " ".join(texts)


def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower().replace("ü", "u").replace("é", "e"))


def align(script_words, asr):
    """Levenshtein alignment of script words to ASR words -> a start time (or None) per script word."""
    a, b = [norm(w) for w in script_words], [norm(w["w"]) for w in asr]
    n, m = len(a), len(b)

    def sub(i, j):
        x, y = a[i], b[j]
        if x == y:
            return 0.0
        if x and y and (x.startswith(y) or y.startswith(x) or x[:3] == y[:3]):
            return 0.4
        return 1.0

    D = np.zeros((n + 1, m + 1))
    D[:, 0], D[0, :] = np.arange(n + 1), np.arange(m + 1) * 0.8
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            D[i, j] = min(D[i - 1, j - 1] + sub(i - 1, j - 1), D[i - 1, j] + 1.0, D[i, j - 1] + 0.8)
    out, i, j, matched = [None] * n, n, m, 0
    while i > 0 and j > 0:
        if D[i, j] == D[i - 1, j - 1] + sub(i - 1, j - 1):
            out[i - 1] = asr[j - 1]["start"]
            matched += sub(i - 1, j - 1) < 1.0
            i, j = i - 1, j - 1
        elif D[i, j] == D[i - 1, j] + 1.0:
            i -= 1
        else:
            j -= 1
    return out, matched / max(1, n)


def fill(times, t0, t1):
    """Interpolate missing word starts by index between known neighbours; keep them increasing."""
    t, n = list(times), len(times)
    known = [k for k in range(n) if t[k] is not None]
    if not known:
        return list(np.linspace(t0, t1, n, endpoint=False))
    for k in range(n):
        if t[k] is None:
            lo = max([i for i in known if i < k], default=None)
            hi = min([i for i in known if i > k], default=None)
            lk, lt = (lo, t[lo]) if lo is not None else (-1, t0)
            hk, ht = (hi, t[hi]) if hi is not None else (n, t1)
            t[k] = lt + (ht - lt) * (k - lk) / (hk - lk)
    for k in range(1, n):
        t[k] = max(t[k], t[k - 1] + 0.05)
    return t


def name_checks(text, heard, terms):
    """How each product term in this line was heard. A line can score a low word error rate while its
    most important word (the name) is mangled, so check the names separately."""
    import difflib
    heard_toks = [x for x in re.split(r"[\s.]+", re.sub(r"\s+dot\s+", ".", heard, flags=re.I)) if x]
    out, work = [], text
    for term in sorted(terms, key=len, reverse=True):  # a longer term ("zogreo.org") claims its text before a shorter one ("Zogreo")
        pat = rf"(?<!\w){re.escape(term)}(?!\w)"
        if NUMBER_KEY.match(term) or not re.search(pat, work, re.I):
            continue
        work = re.sub(pat, " ", work, flags=re.I)
        t = norm(term)
        best = max(heard_toks, key=lambda h: difflib.SequenceMatcher(None, t, norm(h)).ratio(), default="")
        r = difflib.SequenceMatcher(None, t, norm(best)).ratio()
        out.append({"term": term, "heard_as": best.strip(".,!?"), "similarity": round(r, 2), "flag": r < 0.85})
    return out


def toks(s):
    """Comparable word list: a spoken 'dot' and a written '.' are the same, so 'acme dot com' == 'acme.com'."""
    s = re.sub(r"\s+dot\s+", ".", s, flags=re.I)
    return [t for t in (norm(x) for x in re.split(r"[\s.]+", s)) if t]


def wer(ref, hyp):
    r, h = toks(ref), toks(hyp)
    d = np.arange(len(h) + 1)
    for i, rw in enumerate(r, 1):
        prev, d[0] = d.copy(), i
        for j, hw in enumerate(h, 1):
            d[j] = min(prev[j] + 1, d[j - 1] + 1, prev[j - 1] + (rw != hw))
    return float(d[len(h)] / max(1, len(r)))


# ── engines ─────────────────────────────────────────────────────────────────
def http(method, url, body=None, form=None, timeout=600):
    data, headers = None, {}
    if body is not None:
        data, headers = json.dumps(body).encode(), {"Content-Type": "application/json"}
    if form is not None:
        data, headers = urllib.parse.urlencode(form).encode(), {"Content-Type": "application/x-www-form-urlencoded"}
    with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=headers, method=method), timeout=timeout) as r:
        return r.read(), dict(r.headers)


def sync_pronunciations(api, entries):
    """Register respellings in VoiceStudio's own pronunciation dictionary (idempotent)."""
    have = {r["term"].lower(): r for r in json.loads(http("GET", f"{api}/pronunciation")[0])}
    for term, rep in entries.items():
        row = have.get(term.lower())
        if row is None:
            http("POST", f"{api}/pronunciation", {"term": term, "replacement": rep, "type": "respelling", "language": "*"})
        elif row["replacement"] != rep or not row["enabled"]:
            http("PUT", f"{api}/pronunciation/{row['id']}", {"replacement": rep, "enabled": True})


class DirectTTS:
    """sherpa-onnx straight from a model directory: Piper/VITS voices, or Kokoro (needs --kokoro-sid)."""

    def __init__(self, model_dir, sid, speed):
        d = Path(model_dir)
        self.sid, self.speed = sid, speed
        if (d / "voices.bin").exists():
            k = sherpa_onnx.OfflineTtsKokoroModelConfig(model=str(d / "model.onnx"), voices=str(d / "voices.bin"), tokens=str(d / "tokens.txt"),
                                                        data_dir=str(d / "espeak-ng-data"), dict_dir=str(d / "dict"),
                                                        lexicon=f"{d}/lexicon-us-en.txt,{d}/lexicon-zh.txt")
            cfg = sherpa_onnx.OfflineTtsModelConfig(kokoro=k, num_threads=4)
        else:
            v = sherpa_onnx.OfflineTtsVitsModelConfig(model=str(next(d.glob("*.onnx"))), tokens=str(d / "tokens.txt"), data_dir=str(d / "espeak-ng-data"))
            cfg = sherpa_onnx.OfflineTtsModelConfig(vits=v, num_threads=4)
        self.tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=cfg))

    def __call__(self, text):
        g = self.tts.generate(text, sid=self.sid, speed=self.speed)
        return np.array(g.samples, np.float32), g.sample_rate


def apply_respellings(text, entries):
    for term, rep in sorted(entries.items(), key=lambda kv: -len(kv[0])):
        text = re.sub(rf"(?<![\w]){re.escape(term)}(?![\w])", rep, text, flags=re.I)
    return text


# ── main ────────────────────────────────────────────────────────────────────
def line_words(line):
    return line["text"].split()


def timing_from_render(args, script, rec, out_lines):
    pron = script.get("pronunciation", {})
    pieces, lines, report, cursor = [np.zeros(int(args.lead_in * OUT_SR), np.float32)], [], [], args.lead_in
    if args.via == "voicestudio":
        sync_pronunciations(args.api, {k: v for k, v in pron.items() if not NUMBER_KEY.match(k)})
        direct = None
    else:
        direct = DirectTTS(args.model_dir, args.kokoro_sid, args.speed)
    for line in script["lines"]:
        if args.via == "voicestudio":
            wav, _ = http("POST", f"{args.api}/generate", form={
                "text": line["text"], "engine": args.engine, "language": "en", "speed": args.speed,
                "effect_preset": args.effect_preset, "wav_bits": "16", "max_chunk_chars": "0", "pronounce": "true"})
            p = out_lines / f"{line['id']}.wav"
            p.write_bytes(wav)
            a, sr = sf.read(p, dtype="float32", always_2d=True)
            a = a.mean(axis=1)
            sent = json.loads(http("POST", f"{args.api}/pronunciation/test", {"text": line["text"], "language": "en"})[0]).get("substituted")
        else:
            sent = apply_respellings(line["text"], pron)
            a, sr = direct(sent)
            sf.write(out_lines / f"{line['id']}.wav", a, sr)
        s0, s1 = speech_bounds(a, sr)
        a = a[max(0, int((s0 - 0.03) * sr)): int((s1 + 0.06) * sr)]
        a48 = sps.resample_poly(a, OUT_SR, sr).astype(np.float32)
        words, heard = asr_words(rec, a, sr)
        sw = line_words(line)
        dur = len(a48) / OUT_SR
        starts = fill(align(sw, words)[0], 0.03, dur - 0.1)
        ws = []
        for k, w in enumerate(sw):
            end = (starts[k + 1] - 0.02) if k + 1 < len(sw) else dur - 0.06
            ws.append({"w": w, "start": round(cursor + starts[k], 3), "end": round(cursor + max(end, starts[k] + 0.08), 3)})
        lines.append({"id": line["id"], "text": line["text"], "start": round(cursor + 0.03, 3), "end": round(cursor + dur - 0.06, 3), "words": ws})
        report.append({"id": line["id"], "engine_text": sent, "heard": heard, "wer": round(wer(line["text"], heard), 3), "seconds": round(dur, 2),
                       "words_per_second": round(len(sw) / dur, 2), "names": name_checks(line["text"], heard, pron)})
        print(f"{line['id']:>4}  {dur:5.2f}s  {len(sw) / dur:4.2f} w/s  WER {report[-1]['wer']:.2f}  heard: {heard}")
        pieces.append(a48)
        cursor += dur
        if line.get("pause"):
            pieces.append(np.zeros(int(line["pause"] * OUT_SR), np.float32))
            cursor += line["pause"]
    return np.concatenate(pieces), lines, report


def timing_from_take(args, script, rec):
    a, sr = sf.read(args.audio, dtype="float32", always_2d=True)
    a = a.mean(axis=1)
    s0, _ = speech_bounds(a, sr)
    if s0 > args.lead_in:
        a = a[int((s0 - args.lead_in) * sr):]
    else:  # pad the head with the take's own quietest material, never with digital silence
        pad = int((args.lead_in - s0) * sr)
        hop = int(sr * 0.01)
        nfr = len(a) // hop
        rms = np.sqrt((a[: nfr * hop].reshape(nfr, hop) ** 2).mean(1))
        quiet = [i for i in np.argsort(rms) if rms[i] > 1e-7][:30]
        bed = np.concatenate([a[i * hop:(i + 1) * hop] for i in sorted(quiet)]) if quiet else np.zeros(hop, np.float32)
        a = np.concatenate([np.resize(bed, pad).astype(np.float32), a])
    words, heard = asr_words(rec, a, sr)
    flat = [(ln["id"], w) for ln in script["lines"] for w in line_words(ln)]
    starts, matched = align([w for _, w in flat], words)
    if matched < 0.85:
        print(f"WARNING: only {matched:.0%} of the script's words were found in the take: it may diverge from script.json", file=sys.stderr)
    total = len(a) / sr
    starts = fill(starts, args.lead_in, total - 0.2)
    # Speech activity is judged against the whole take, not each line's tail on its own. With room tone between
    # sentences (instead of digital silence) a tail-relative threshold counted the tone as speech and ran a line's
    # end through the pause into the next line, which pushed scene cuts on top of the next sentence.
    hop = int(sr * 0.01)
    nfr = len(a) // hop
    fdb = 20 * np.log10(np.sqrt((a[: nfr * hop].reshape(nfr, hop) ** 2).mean(1)) + 1e-12)
    speech = fdb > fdb.max() - 35.0

    def last_speech(t0, t1):
        f0, f1 = max(0, int(t0 / 0.01)), min(nfr, int(t1 / 0.01))
        idx = np.where(speech[f0:f1])[0] if f1 > f0 else []
        return None if len(idx) == 0 else (f0 + idx[-1] + 1) * 0.01

    lines, report, k = [], [], 0
    for ln in script["lines"]:
        n = len(line_words(ln))
        st = starts[k:k + n]
        nxt = starts[k + n] if k + n < len(starts) else total
        # the last word ends where its sound ends: the last speech frame before the next line begins
        e = last_speech(st[-1], min(nxt - 0.03, st[-1] + 1.5))
        if e is None:  # the recogniser stamped the last word inside the pause after it: walk back to its sound
            e = last_speech(max(st[-2] if n > 1 else st[-1] - 1.0, st[-1] - 1.2), st[-1] + 0.01)
            if e is not None:
                st[-1] = min(st[-1], max((st[-2] + 0.08) if n > 1 else e - 0.3, e - 0.35))
        end_last = max((e + 0.04) if e is not None else st[-1] + 0.3, st[-1] + 0.12)
        ws = [{"w": w, "start": round(st[i], 3), "end": round((st[i + 1] - 0.02) if i + 1 < n else end_last, 3)} for i, w in enumerate(line_words(ln))]
        lines.append({"id": ln["id"], "text": ln["text"], "start": ws[0]["start"], "end": ws[-1]["end"], "words": ws})
        seg_heard = " ".join(w["w"] for w in words if st[0] - 0.05 <= w["start"] < (starts[k + n] - 0.08 if k + n < len(starts) else total))
        report.append({"id": ln["id"], "heard": seg_heard, "wer": round(wer(ln["text"], seg_heard), 3), "seconds": round(ws[-1]["end"] - ws[0]["start"], 2),
                       "words_per_second": round(n / max(0.1, ws[-1]["end"] - ws[0]["start"]), 2),
                       "names": name_checks(ln["text"], seg_heard, script.get("pronunciation", {}))})
        print(f"{ln['id']:>4}  {report[-1]['seconds']:5.2f}s  WER {report[-1]['wer']:.2f}  heard: {seg_heard}")
        k += n
    return a, sr, lines, report


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("mode", choices=["render", "take"])
    ap.add_argument("--script", default="script.json")
    ap.add_argument("--project", default=".")
    ap.add_argument("--via", choices=["voicestudio", "direct"], default="voicestudio")
    ap.add_argument("--api", default="http://127.0.0.1:8765")
    ap.add_argument("--engine", default="sherpa-onnx", help="VoiceStudio engine id (sherpa-onnx loads the voice vs_server.sh started with)")
    ap.add_argument("--model-dir")
    ap.add_argument("--kokoro-sid", type=int, default=16)
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--effect-preset", default="raw", help="VoiceStudio mastering preset; raw = none. 'broadcast' brightens and levels (+5 dB, +2 dB treble)")
    ap.add_argument("--audio", help="take mode: the recorded narration")
    ap.add_argument("--asr-dir", default=str(Path(os.environ.get("PROMO_MODELS", Path.home() / "promo-env/models")) / "sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8"))
    ap.add_argument("--lead-in", type=float, default=0.35, help="silence before the first word, seconds")
    ap.add_argument("--voice-label", default="")
    args = ap.parse_args()
    if args.mode == "take" and not args.audio:
        ap.error("take mode needs --audio")
    if args.mode == "render" and args.via == "direct" and not args.model_dir:
        ap.error("--via direct needs --model-dir")

    proj = Path(args.project)
    script = json.loads((proj / args.script).read_text())
    (proj / "assets/vo/lines").mkdir(parents=True, exist_ok=True)
    (proj / "build").mkdir(exist_ok=True)
    rec = make_asr(args.asr_dir)

    if args.mode == "render":
        vo, lines, report = timing_from_render(args, script, rec, proj / "assets/vo/lines")
        engine = f"VoiceStudio {args.engine}" if args.via == "voicestudio" else f"direct sherpa-onnx ({Path(args.model_dir).name})"
        raw = vo
    else:
        raw, sr, lines, report = timing_from_take(args, script, rec)
        raw = sps.resample_poly(raw, OUT_SR, sr).astype(np.float32) if sr != OUT_SR else raw
        engine = "external take"
    tmp = proj / "build/vo_raw.wav"
    sf.write(tmp, raw, OUT_SR, subtype="PCM_24")
    loudnorm(tmp, proj / "assets/vo/vo.wav")
    dur = len(sf.read(proj / "assets/vo/vo.wav")[0]) / OUT_SR
    (proj / "build/timing.json").write_text(json.dumps({
        "provisional": False, "engine": engine, "voice": args.voice_label, "speed": args.speed, "effect_preset": args.effect_preset if args.mode == "render" and args.via == "voicestudio" else None,
        "duration": round(dur, 3), "lines": lines}, indent=1, ensure_ascii=False))
    (proj / "build/vo_report.json").write_text(json.dumps(report, indent=1, ensure_ascii=False))
    bad = [r["id"] for r in report if r["wer"] > 0.25]
    names = [(r["id"], n) for r in report for n in r["names"] if n["flag"]]
    print(f"vo.wav {dur:.2f}s via {engine}")
    print(f"CHECK these lines, the ASR heard something different: {', '.join(bad)}" if bad else "no line's transcript drifts from the script (WER <= 0.25)")
    for lid, n in names:
        print(f"VERIFY BY EAR: {lid} '{n['term']}' was transcribed as '{n['heard_as']}' (similarity {n['similarity']}). "
              "The recogniser's spelling of a rare name is a weak signal either way; listen before shipping.")


if __name__ == "__main__":
    main()
