"""Narration as continuous ElevenLabs takes, one per scene, timed word by word.

    python tools/el_scenes.py [--only why,study,how,end] [--dry-run]

Each scene is one request (the voice phrases its sentences together); every gap is filled with room tone taken from
the takes' own pauses. Word times come from ElevenLabs' character alignment (/with-timestamps), mapped back onto the
script's words, so captions and cues follow the real speech.

Reads tools/script.json. Writes el-scenes/<scene>.mp3 (+ .align.json), assets/vo/vo.wav (-16 LUFS, 48 kHz) and
build/timing.json for tools/build.mjs. Re-running reuses existing takes unless --only names scenes to re-roll.
"""
import argparse
import json
import os
import subprocess
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(__file__))
import el  # noqa: E402

SR = 44100
OUT = "el-scenes"
DIRECTION = "[warm, natural, conversational] "  # plain direction, per CLAUDE.md; do not direct the voice to "fit the theme"
SETTINGS = {"stability": 0.5, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": True}
SCENES = ["why", "study", "how", "end"]


LEAD_IN, TAIL = 0.45, 0.7
GAP_AFTER = {"why": 0.6, "study": 0.75, "how": 0.75}


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def frames_db(a, hop):
    n = len(a) // hop
    return 20 * np.log10(np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-12)


def room_tone(takes, seconds=3.0):
    """Collect the quiet stretches inside the takes' own pauses (noise floor, no breaths) into a loopable bed."""
    hop = int(SR * 0.01)
    pieces = []
    for a in takes:
        db = frames_db(a, hop)
        quiet = (db < -50) & (db > -85)
        i = 0
        while i < len(quiet):
            if quiet[i]:
                j = i
                while j < len(quiet) and quiet[j]:
                    j += 1
                if j - i >= 8:  # >= 80 ms; drop 20 ms at each edge to stay clear of speech tails
                    pieces.append(a[(i + 2) * hop:(j - 2) * hop])
                i = j
            else:
                i += 1
    if not pieces:
        raise SystemExit("no room tone found in the takes")
    fade = int(SR * 0.02)
    bed = pieces[0]
    for p in pieces[1:]:
        if len(p) <= 2 * fade:
            continue
        w = np.linspace(0, 1, fade, dtype=np.float32)
        bed = np.concatenate([bed[:-fade], bed[-fade:] * (1 - w) + p[:fade] * w, p[fade:]])
        if len(bed) > seconds * SR:
            break
    return bed


def tone(bed, seconds):
    """Room tone of any length: crossfaded loops of the bed."""
    n = int(seconds * SR)
    fade = int(SR * 0.05)
    out = bed.copy()
    while len(out) < n:
        w = np.linspace(0, 1, fade, dtype=np.float32)
        out = np.concatenate([out[:-fade], out[-fade:] * (1 - w) + bed[:fade] * w, bed[fade:]])
    return out[:n]


def fill_zeros(a, bed, min_ms=10):
    """Replace any exact-zero run (codec padding, generator silence) with room tone."""
    z = np.abs(a) < 1e-6
    i, n, filled = 0, len(a), 0
    run = int(SR * min_ms / 1000)
    while i < n:
        if z[i]:
            j = i
            while j < n and z[j]:
                j += 1
            if j - i >= run:
                a[i:j] = tone(bed, (j - i) / SR + 0.06)[: j - i]
                filled += j - i
            i = j
        else:
            i += 1
    return a, filled / SR


def trim(a, keep=0.12):
    """Cut leading and trailing silence; returns the cut and its start offset in samples."""
    hop = int(SR * 0.01)
    db = frames_db(a, hop)
    on = np.where(db > db.max() - 40)[0]
    s0 = max(0, (on[0] * hop) - int(keep * SR))
    s1 = min(len(a), (on[-1] + 1) * hop + int(keep * SR))
    return a[s0:s1], s0


def build_request(lines, sp):
    """The request text for one scene, plus each script word's character span in it."""
    text, spans = DIRECTION, []
    for line in lines:
        for w in line["text"].split():
            sw = w
            for k in sorted(sp, key=len, reverse=True):
                sw = sw.replace(k, sp[k])
            if not text.endswith(" "):
                text += " "
            spans.append((line["id"], w, len(text), len(text) + len(sw)))
            text += sw
    return text, spans


def word_times(align_path, text, spans):
    """Map script words onto the take's character times."""
    a = json.load(open(align_path))["alignment"]
    chars = "".join(a["characters"])
    off = 0
    if chars != text:  # the tag may be dropped from the alignment: locate the spoken body instead
        body = text[len(DIRECTION):]
        k = chars.find(body)
        if k < 0:
            raise SystemExit(f"{align_path}: alignment text does not match the request")
        off = k - len(DIRECTION)
    st, en = a["character_start_times_seconds"], a["character_end_times_seconds"]
    out = []
    for lid, w, c0, c1 in spans:
        idx = [c + off for c in range(c0, c1) if not text[c].isspace()]
        out.append((lid, w, st[idx[0]], en[idx[-1]]))
    return out


def loudnorm(src, dst, target=-16.0, tp=-1.5, lra=11.0):
    f = f"loudnorm=I={target}:TP={tp}:LRA={lra}"
    probe = subprocess.run(["ffmpeg", "-hide_banner", "-i", src, "-af", f + ":print_format=json", "-f", "null", "-"],
                           capture_output=True, text=True).stderr
    m = json.loads(probe[probe.rindex("{"): probe.rindex("}") + 1])
    f2 = (f + f":measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af", f2, "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", dst], check=True)
    print(f"loudness {m['input_i']} LUFS / {m['input_tp']} dBTP -> {target} LUFS, {tp} dBTP")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="comma-separated scenes to (re)generate; others reuse existing takes")
    ap.add_argument("--dry-run", action="store_true", help="print the request texts and stop")
    a = ap.parse_args()
    s = json.load(open("tools/script.json", encoding="utf-8"))
    sp = s["spoken_elevenlabs"]
    reqs = {name: build_request([l for l in s["lines"] if l["scene"] == name], sp) for name in SCENES}
    if a.dry_run:
        for name, (text, _) in reqs.items():
            print(f"[{name}] {len(text)} chars: {text}")
        print("total", sum(len(t) for t, _ in reqs.values()), "characters")
        return
    os.makedirs(OUT, exist_ok=True)
    only = set(a.only.split(",")) if a.only else None
    spent = 0
    for name in SCENES:
        path = f"{OUT}/{name}.mp3"
        if os.path.exists(path) and (only is None or name not in only):
            continue
        ok, err = el.tts(reqs[name][0], path, settings=SETTINGS)
        if not ok:
            raise SystemExit(f"{name}: {err}")
        spent += len(reqs[name][0])
        print(f"generated {name}: {len(reqs[name][0])} characters")
    takes = {name: decode(f"{OUT}/{name}.mp3") for name in SCENES}
    bed = room_tone(list(takes.values()))
    hop = int(SR * 0.01)
    pause_db = np.concatenate([d[30:-30][d[30:-30] < d.max() - 45] for d in (frames_db(x, hop) for x in takes.values())])
    target = float(np.median(pause_db))
    bed = bed * np.float32(10 ** ((target - 20 * np.log10(np.sqrt((bed ** 2).mean()) + 1e-12)) / 20))
    sf.write(f"{OUT}/roomtone.wav", bed, SR, subtype="FLOAT")
    parts, report, words = [tone(bed, LEAD_IN)], [], []
    cursor = LEAD_IN
    for name in SCENES:
        x, s0 = trim(takes[name])
        x, filled = fill_zeros(x, bed)
        for lid, w, t0, t1 in word_times(f"{OUT}/{name}.mp3.align.json", *reqs[name]):
            words.append((lid, w, round(cursor + t0 - s0 / SR, 3), round(cursor + t1 - s0 / SR, 3)))
        report.append(f"{name}: {len(x) / SR:.2f}s, {filled * 1000:.0f} ms of exact zeros replaced")
        parts.append(x)
        cursor += len(x) / SR
        gap = GAP_AFTER.get(name, TAIL)
        parts.append(tone(bed, gap))
        cursor += gap
    take = np.concatenate(parts).astype(np.float32)
    sf.write(f"{OUT}/take.wav", take, SR, subtype="FLOAT")
    os.makedirs("assets/vo", exist_ok=True)
    os.makedirs("build", exist_ok=True)
    loudnorm(f"{OUT}/take.wav", "assets/vo/vo.wav")
    lines = []
    for l in s["lines"]:
        ws = [{"w": w, "start": t0, "end": t1} for lid, w, t0, t1 in words if lid == l["id"]]
        lines.append({"id": l["id"], "text": l["text"], "start": ws[0]["start"], "end": ws[-1]["end"], "words": ws})
    json.dump({"engine": "ElevenLabs eleven_v4 per-scene takes, /with-timestamps", "voice": "Jason ILP9IN5fT2Jr2fSfmoNh",
               "duration": round(len(take) / SR, 3), "lines": lines}, open("build/timing.json", "w"), indent=1)
    print("\n".join(report))
    for l in lines:
        n = len(l["words"])
        print(f"{l['id']}: {l['start']:.2f}-{l['end']:.2f}s  {n / (l['end'] - l['start']):.2f} words/s")
    print(f"vo.wav {len(take) / SR:.2f}s; spent {spent} characters this run")


if __name__ == "__main__":
    main()
