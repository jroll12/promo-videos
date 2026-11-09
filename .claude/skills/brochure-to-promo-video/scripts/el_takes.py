"""Narration from ElevenLabs as continuous takes (one request per scene), with no digital silence anywhere.

    python el_takes.py [--script script.json] [--only sceneA,sceneB] [--dry-run]
    then: vo.py take --script script.json --audio el-takes/take.wav

Why: the first ElevenLabs narration of the Zogreo film was one request per sentence, butted together with
exact-zero gaps. Every sentence restarted as its own ad read, and the ear heard the room switch off between
sentences ("good, but not great... something's off"). One request per scene lets the voice phrase sentences
together; every gap is filled with tone taken from the voice's own pauses, at their level.

script.json needs:
  lines[].scene        which take a line belongs to (a scene's lines are read in one request, in order)
  lines[].before       optional Eleven v4 tag placed before the line inside its take, e.g. "[pause]", "[warmly]"
  elevenlabs.voice_id  the voice the user chose (ask; never pick one unheard)
  elevenlabs.model     default "eleven_v4"
  elevenlabs.spoken    respellings applied before sending, e.g. {"Zogreo": "Zo-GRAY-oh", "3.73": "three point seven three"}
  elevenlabs.scenes.<scene>.direction  tags that open the take, e.g. "[warm, natural, conversational]". Keep it plain: never
                                       "hushed", "whispering" or "late at night" (see references/voice.md, "Do not direct the voice to fit the theme")
  elevenlabs.scenes.<scene>.settings   voice_settings: stability, similarity_boost, style, use_speaker_boost, speed
  elevenlabs.scenes.<scene>.gap_after  seconds of room tone after the take (default 0.9; use ~0.6 inside a scene)
The key comes from ELEVENLABS_API_KEY in the environment, never from a file in the project. Takes are kept in
el-takes/<scene>.mp3 and reused; --only re-rolls the named scenes (each roll spends credits: about one per character).
Measured on Zogreo: v4's speed setting barely moves the pace (floor about 2.8 words/s); direction tags change the pitch
range a lot. Render a 20 s test of the opening in two directions and let the user choose before the full take.
"""
import argparse
import json
import os
import subprocess
import urllib.error
import urllib.request

import numpy as np
import soundfile as sf

SR = 44100
OUT = "el-takes"
LEAD_IN, TAIL = 0.45, 0.7


def tts(text, path, voice, model, settings):
    body = {"text": text, "model_id": model}
    if settings:
        body["voice_settings"] = settings
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128",
                                 data=json.dumps(body).encode(), method="POST",
                                 headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            open(path, "wb").write(r.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"ElevenLabs refused ({e.code}): {e.read().decode()[:300]}")


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def frames_db(a, hop=int(SR * 0.01)):
    n = len(a) // hop
    return 20 * np.log10(np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-12)


def pause_bed(takes):
    """A loopable bed from the takes' own pauses, scaled to their median pause level (so joins sound like pauses)."""
    hop = int(SR * 0.01)
    pieces, levels = [], []
    for a in takes:
        db = frames_db(a)
        inner = db[30:-30]
        levels.append(inner[inner < db.max() - 45])
        quiet = (db < -50) & (db > -95)
        i = 0
        while i < len(quiet):
            if quiet[i]:
                j = i
                while j < len(quiet) and quiet[j]:
                    j += 1
                if j - i >= 8:
                    pieces.append(a[(i + 2) * hop:(j - 2) * hop])
                i = j
            else:
                i += 1
    bed = np.concatenate(pieces) if pieces else np.zeros(int(SR * 0.5), np.float32) + 1e-5
    target = float(np.median(np.concatenate(levels))) if levels else -80.0
    rms = np.sqrt((bed ** 2).mean()) + 1e-12
    return (bed * np.float32(10 ** ((target - 20 * np.log10(rms)) / 20))).astype(np.float32), target


def tone(bed, seconds):
    n = int(seconds * SR)
    fade = int(SR * 0.05)
    out = bed.copy()
    while len(out) < n:
        w = np.linspace(0, 1, fade, dtype=np.float32)
        out = np.concatenate([out[:-fade], out[-fade:] * (1 - w) + bed[:fade] * w, bed[fade:]])
    return out[:n]


def trim(a, keep=0.12):
    db = frames_db(a)
    on = np.where(db > db.max() - 40)[0]
    hop = int(SR * 0.01)
    return a[max(0, on[0] * hop - int(keep * SR)): min(len(a), (on[-1] + 1) * hop + int(keep * SR))]


def fill_zeros(a, bed, min_ms=10):
    z = np.abs(a) < 1e-6
    i, run = 0, int(SR * min_ms / 1000)
    while i < len(a):
        if z[i]:
            j = i
            while j < len(a) and z[j]:
                j += 1
            if j - i >= run:
                a[i:j] = tone(bed, (j - i) / SR + 0.06)[: j - i]
            i = j
        else:
            i += 1
    return a


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--script", default="script.json")
    ap.add_argument("--only")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    s = json.load(open(a.script, encoding="utf-8"))
    cfg = s.get("elevenlabs") or {}
    if not cfg.get("voice_id") and not a.dry_run:
        raise SystemExit("script.json has no elevenlabs.voice_id: audition voices and let the user choose first")
    spoken = cfg.get("spoken", {})

    def say(t):
        for k in sorted(spoken, key=len, reverse=True):
            t = t.replace(k, spoken[k])
        return t

    order, texts = [], {}
    for ln in s["lines"]:
        sc = ln.get("scene", "all")
        if sc not in texts:
            order.append(sc)
            texts[sc] = ((cfg.get("scenes", {}).get(sc, {}).get("direction", "")) + " ").lstrip()
        texts[sc] += (ln.get("before", "") + " " if ln.get("before") else "") + say(ln["text"]) + " "
    texts = {k: v.strip() for k, v in texts.items()}
    if a.dry_run:
        for sc in order:
            print(f"[{sc}] {len(texts[sc])} characters: {texts[sc]}")
        print(f"total {sum(map(len, texts.values()))} characters")
        return
    os.makedirs(OUT, exist_ok=True)
    only = set(a.only.split(",")) if a.only else None
    spent = 0
    for sc in order:
        path = f"{OUT}/{sc}.mp3"
        if os.path.exists(path) and (only is None or sc not in only):
            continue
        tts(texts[sc], path, cfg["voice_id"], cfg.get("model", "eleven_v4"), cfg.get("scenes", {}).get(sc, {}).get("settings"))
        spent += len(texts[sc])
        print(f"generated {sc}: {len(texts[sc])} characters")
    takes = {sc: decode(f"{OUT}/{sc}.mp3") for sc in order}
    bed, level = pause_bed(list(takes.values()))
    parts = [tone(bed, LEAD_IN)]
    for k, sc in enumerate(order):
        parts.append(fill_zeros(trim(takes[sc]), bed))
        last = k == len(order) - 1
        parts.append(tone(bed, TAIL if last else float(cfg.get("scenes", {}).get(sc, {}).get("gap_after", 0.9))))
    take = np.concatenate(parts).astype(np.float32)
    sf.write(f"{OUT}/take.wav", take, SR, subtype="FLOAT")
    z = np.abs(take) < 1e-6
    longest = run = 0
    for v in z:
        run = run + 1 if v else 0
        longest = max(longest, run)
    print(f"take.wav {len(take) / SR:.2f}s from {len(order)} takes; joins at the voice's pause level ({level:.1f} dBFS); "
          f"longest exact-zero run {longest / SR * 1000:.1f} ms; spent {spent} characters this run")


if __name__ == "__main__":
    main()
