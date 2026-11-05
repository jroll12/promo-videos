"""Make the narration with VoiceStudio and time every word.

1. registers the script's pronunciations in VoiceStudio's own dictionary (POST /pronunciation)
2. renders each line through VoiceStudio's POST /generate (engine sherpa-onnx, "broadcast" mastering)
3. joins the lines with the script's pauses into assets/vo/vo.wav (48 kHz mono)
4. transcribes each line with Parakeet (sherpa-onnx, token timestamps), maps the words onto the
   script by alignment, and writes build/timing.json for tools/build.mjs

Usage: python tools/vo.py --api http://127.0.0.1:8765 --speed 0.92 [--voice-label NAME]
"""
import argparse
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

import numpy as np
import scipy.signal as sps
import sherpa_onnx
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
ASR_DIR = Path("/home/user/vs-models/sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8")
OUT_SR = 48000
LEAD_IN = 0.35


def http(method, url, body=None, form=None):
    data, headers = None, {}
    if body is not None:
        data, headers = json.dumps(body).encode(), {"Content-Type": "application/json"}
    if form is not None:
        data, headers = urllib.parse.urlencode(form).encode(), {"Content-Type": "application/x-www-form-urlencoded"}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=600) as r:
        return r.read(), dict(r.headers)


def sync_pronunciations(api, wanted):
    rows = json.loads(http("GET", f"{api}/pronunciation")[0])
    have = {r["term"].lower(): r for r in rows}
    for term, rep in wanted.items():
        row = have.get(term.lower())
        if row is None:
            http("POST", f"{api}/pronunciation", {"term": term, "replacement": rep, "type": "respelling", "language": "*"})
        elif row["replacement"] != rep or not row["enabled"]:
            http("PUT", f"{api}/pronunciation/{row['id']}", {"replacement": rep, "enabled": True})


def speech_bounds(a, sr, floor_db=-42.0):
    hop = int(sr * 0.01)
    n = len(a) // hop
    rms = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
    db = 20 * np.log10(rms / (np.abs(a).max() + 1e-9))
    on = np.where(db > floor_db)[0]
    return (on[0] * hop / sr, (on[-1] + 1) * hop / sr) if len(on) else (0.0, len(a) / sr)


def asr_words(rec, a, sr):
    a16 = sps.resample_poly(a, 16000, sr).astype(np.float32)
    s = rec.create_stream()
    s.accept_waveform(16000, a16)
    rec.decode_stream(s)
    r = s.result
    words = []
    for tok, t in zip(r.tokens, r.timestamps):
        if tok.startswith(" ") or tok.startswith("▁") or not words:
            words.append({"w": tok.strip(" ▁"), "start": float(t)})
        else:
            words[-1]["w"] += tok
    return [w for w in words if w["w"]], r.text


def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower().replace("ü", "u"))


def align(script_words, asr):
    """Levenshtein alignment of script words to ASR words; returns a start time per script word or None."""
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
    out, i, j = [None] * n, n, m
    while i > 0 and j > 0:
        if D[i, j] == D[i - 1, j - 1] + sub(i - 1, j - 1):
            out[i - 1] = asr[j - 1]["start"]  # positional match, exact or substituted
            i, j = i - 1, j - 1
        elif D[i, j] == D[i - 1, j] + 1.0:
            i -= 1
        else:
            j -= 1
    return out


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


def loudnorm(src, dst, target=-16.0, tp=-1.5, lra=11.0):
    """Two-pass ffmpeg loudnorm to about -16 LUFS integrated with a -1.5 dBTP ceiling (social delivery)."""
    import subprocess
    f = f"loudnorm=I={target}:TP={tp}:LRA={lra}"
    probe = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(src), "-af", f + ":print_format=json", "-f", "null", "-"],
                           capture_output=True, text=True).stderr
    m = json.loads(probe[probe.rindex("{"): probe.rindex("}") + 1])
    f2 = (f + f":measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", f2, "-ar", str(OUT_SR), "-ac", "1",
                    "-c:a", "pcm_s16le", str(dst)], check=True)
    print(f"loudness {m['input_i']} LUFS / {m['input_tp']} dBTP -> target {target} LUFS, {tp} dBTP")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--api", default="http://127.0.0.1:8765")
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--voice-label", default="")
    args = ap.parse_args()

    script = json.loads((ROOT / "tools/script.json").read_text())
    sync_pronunciations(args.api, {k: v for k, v in script["pronunciation"].items() if k in ("Zogreo", "Türkiye")})
    lines_dir = ROOT / "assets/vo/lines"
    lines_dir.mkdir(parents=True, exist_ok=True)
    rec = sherpa_onnx.OfflineRecognizer.from_transducer(
        encoder=str(ASR_DIR / "encoder.int8.onnx"), decoder=str(ASR_DIR / "decoder.int8.onnx"),
        joiner=str(ASR_DIR / "joiner.int8.onnx"), tokens=str(ASR_DIR / "tokens.txt"),
        model_type="nemo_transducer", num_threads=4)

    pieces, timing_lines, cursor, report = [np.zeros(int(LEAD_IN * OUT_SR), np.float32)], [], LEAD_IN, []
    for line in script["lines"]:
        sent = json.loads(http("POST", f"{args.api}/pronunciation/test", {"text": line["text"], "language": "en"})[0])
        wav, hdr = http("POST", f"{args.api}/generate", form={
            "text": line["text"], "engine": "sherpa-onnx", "language": "en", "speed": args.speed,
            "effect_preset": "broadcast", "wav_bits": "16", "max_chunk_chars": "0", "pronounce": "true"})
        p = lines_dir / f"{line['id']}.wav"
        p.write_bytes(wav)
        a, sr = sf.read(p, dtype="float32", always_2d=True)
        a = a.mean(axis=1)
        s0, s1 = speech_bounds(a, sr)
        a = a[max(0, int((s0 - 0.03) * sr)) : int((s1 + 0.06) * sr)]
        a48 = sps.resample_poly(a, OUT_SR, sr).astype(np.float32)
        words, heard = asr_words(rec, a, sr)
        script_words = line["text"].split()
        dur = len(a48) / OUT_SR
        starts = fill(align(script_words, words), 0.03, dur - 0.1)
        ws = []
        for k, w in enumerate(script_words):
            end = (starts[k + 1] - 0.02) if k + 1 < len(script_words) else dur - 0.06
            ws.append({"w": w, "start": round(cursor + starts[k], 3), "end": round(cursor + max(end, starts[k] + 0.08), 3)})
        timing_lines.append({"id": line["id"], "text": line["text"], "start": round(cursor + 0.03, 3), "end": round(cursor + dur - 0.06, 3), "words": ws})
        report.append({"id": line["id"], "engine_text": sent, "heard": heard, "seconds": round(dur, 2), "x_audio_duration": hdr.get("X-Audio-Duration")})
        print(json.dumps(report[-1], ensure_ascii=False), flush=True)
        pieces.append(a48)
        cursor += dur
        if line["pause"]:
            pieces.append(np.zeros(int(line["pause"] * OUT_SR), np.float32))
            cursor += line["pause"]
    vo = np.concatenate(pieces)
    raw = ROOT / "build/vo_raw.wav"
    sf.write(raw, vo, OUT_SR, subtype="PCM_24")
    loudnorm(raw, ROOT / "assets/vo/vo.wav")
    (ROOT / "build/timing.json").write_text(json.dumps({
        "provisional": False, "engine": "VoiceStudio sherpa-onnx", "voice": args.voice_label, "speed": args.speed,
        "duration": round(len(vo) / OUT_SR, 3), "lines": timing_lines}, indent=1, ensure_ascii=False))
    (ROOT / "build/vo_report.json").write_text(json.dumps(report, indent=1, ensure_ascii=False))
    print(f"vo.wav {len(vo) / OUT_SR:.2f}s, peak {20 * np.log10(np.abs(vo).max() + 1e-9):.1f} dBFS")


if __name__ == "__main__":
    main()
