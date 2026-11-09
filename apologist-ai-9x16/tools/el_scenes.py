"""Narration as continuous ElevenLabs takes, one per scene, with no digital silence anywhere.

    python tools/el_scenes.py [--only night,proof,give] [--dry-run]

Why: the first Hale narration was 11 separate requests butted together with exact-zero gaps. The ear heard the
room switch off ten times, and every sentence restarted as its own ad read. Here each scene is one request, so the
voice phrases sentences together, and every gap (lead-in, scene joins, tail, codec padding) is filled with room
tone taken from the takes' own pauses.

Reads tools/script.json (lines with "scene", plus "spoken_elevenlabs" respellings). Writes el-scenes/<scene>.mp3
(the raw takes), el-scenes/roomtone.wav and el-scenes/take.wav (the joined narration for `vo.py take`).
Re-running reuses existing takes unless --only names the scenes to re-roll (each roll spends credits).
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
# Direction per scene (defaults chosen in the review plan): hushed night, warming into the hand-off,
# steady for the statistic, warm for the ask. Tags are Eleven v4 performance cues; they are not spoken.
# Apologist AI promo: Max, plain and warm, one continuous take per scene (adapted from zogreo-intro-9x16).
# Lessons kept from Zogreo: never slow or "theme" the voice (it read as creepy); takes per scene, not per line, so
# sentences phrase together and no dead silence sits between them.
_S = {"stability": 0.5, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": True}
SCENES = {
    "open": {"settings": _S, "build": lambda T: "[warm, natural, conversational] " + T["L1"]},
    "verse": {"settings": _S, "build": lambda T: "[warm, sincere, unhurried] " + T["L2"]},
    "need": {"settings": _S, "build": lambda T: "[warm, natural, conversational] " + T["L3"] + " " + T["L4"]},
    "product": {"settings": _S, "build": lambda T: "[warm, clear, conversational] " + T["L5"] + " " + T["L6"]},
    # the hand-off is its own take: inside the product take it came out the fastest line (3.85 words/s), as in Zogreo
    "handoff": {"settings": _S, "build": lambda T: "[warm, sincere] " + T["L7"]},
    "proof": {"settings": _S, "build": lambda T: "[warm, clear, quietly confident] " + T["L8"] + " " + T["L9"]},
    "ask": {"settings": _S, "build": lambda T: "[warmly] " + T["L10"] + " " + T["L11"] + " " + T["L12"]},
}
LEAD_IN, TAIL = 0.45, 0.7
GAP_AFTER = {"open": 0.6, "verse": 0.75, "need": 0.55, "product": 0.45, "handoff": 1.0, "proof": 0.9}  # breaths at the turns; longer before the two cuts


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
    hop = int(SR * 0.01)
    db = frames_db(a, hop)
    on = np.where(db > db.max() - 40)[0]
    s0 = max(0, (on[0] * hop) - int(keep * SR))
    s1 = min(len(a), (on[-1] + 1) * hop + int(keep * SR))
    return a[s0:s1]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="comma-separated scenes to (re)generate; others reuse existing takes")
    ap.add_argument("--dry-run", action="store_true", help="print the request texts and stop")
    a = ap.parse_args()
    s = json.load(open("script.json", encoding="utf-8"))
    sp = s["spoken_elevenlabs"]

    def spoken(t):
        for k in sorted(sp, key=len, reverse=True):
            t = t.replace(k, sp[k])
        return t

    T = {l["id"]: spoken(l["text"]) for l in s["lines"]}
    os.makedirs(OUT, exist_ok=True)
    only = set(a.only.split(",")) if a.only else None
    texts = {name: cfg["build"](T) for name, cfg in SCENES.items()}
    if a.dry_run:
        for name, text in texts.items():
            print(f"[{name}] {len(text)} chars: {text}")
        return
    spent = 0
    for name, cfg in SCENES.items():
        path = f"{OUT}/{name}.mp3"
        have = os.path.exists(path) or os.path.exists(f"{OUT}/{name}.wav")
        if have and (only is None or name not in only):
            continue
        if os.path.exists(f"{OUT}/{name}.wav"):
            os.remove(f"{OUT}/{name}.wav")  # a fresh roll replaces any edited cut of the old take
        ok, err = el.tts(texts[name], path, settings=cfg["settings"])
        if not ok:
            raise SystemExit(f"{name}: {err}")
        spent += len(texts[name])
        print(f"generated {name}: {len(texts[name])} characters")
    takes = {name: decode(f"{OUT}/{name}.wav" if os.path.exists(f"{OUT}/{name}.wav") else f"{OUT}/{name}.mp3")
             for name in SCENES}
    bed = room_tone(list(takes.values()))
    # Match the joins to the voice's own pauses: the bed is built from the louder pause frames (breath tails),
    # which sit ~25 dB above a typical pause. Scale it to the median pause level so a join sounds like any pause.
    hop = int(SR * 0.01)
    pause_db = np.concatenate([d[30:-30][d[30:-30] < d.max() - 45] for d in (frames_db(x, hop) for x in takes.values())])
    target = float(np.median(pause_db))
    bed = bed * np.float32(10 ** ((target - 20 * np.log10(np.sqrt((bed ** 2).mean()) + 1e-12)) / 20))
    floor = 20 * np.log10(np.sqrt((bed ** 2).mean()) + 1e-12)
    sf.write(f"{OUT}/roomtone.wav", bed, SR, subtype="FLOAT")
    parts, report = [tone(bed, LEAD_IN)], []
    for k, name in enumerate(SCENES):
        x, filled = fill_zeros(trim(takes[name]), bed)
        report.append(f"{name}: {len(x) / SR:.2f}s, {filled * 1000:.0f} ms of exact zeros replaced")
        parts.append(x)
        parts.append(tone(bed, GAP_AFTER.get(name, TAIL)))
    take = np.concatenate(parts).astype(np.float32)
    sf.write(f"{OUT}/take.wav", take, SR, subtype="FLOAT")
    z = np.abs(take) < 1e-6
    longest, run = 0, 0
    for v in z:
        run = run + 1 if v else 0
        longest = max(longest, run)
    print(f"room tone bed {len(bed) / SR:.2f}s at {floor:.1f} dBFS (from the takes' own pauses)")
    print("\n".join(report))
    print(f"take.wav {len(take) / SR:.2f}s; longest exact-zero run {longest / SR * 1000:.1f} ms; spent {spent} characters this run")


if __name__ == "__main__":
    main()
