"""Time every word of the narration, scene by scene.

    $TOOLS_PY tools/vo_take.py            # reads el-scenes/take.wav, writes assets/vo/vo.wav, build/timing.json, build/vo_report.json

This is the skill's `scripts/vo.py take` with one thing changed: the recogniser hears each scene's take on its own.
vo.py cuts a long narration into chunks of about 28 s wherever a silence falls. On this film's 63 s take that split
mid-scene, and the recogniser then (a) lost the whole last line ("Book a call, or give, at zogreo.org") and (b) wrote
"three point seven three" instead of "3.73", so those words were placed by interpolation and the number's cue landed a
second late. Heard alone, every take transcribes word for word. So: cut at the gaps tools/el_scenes.py puts between the
takes (the longest silences), and fold a spelled-out number back into the script's own token before aligning.
"""
import json
import os
import sys

import numpy as np
import scipy.signal as sps

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.environ.get("PROMO_SKILL_SCRIPTS", os.path.normpath(os.path.join(HERE, "../../.claude/skills/brochure-to-promo-video/scripts")))
sys.path.insert(0, SKILL)
import vo  # noqa: E402

SCRIPT = os.path.join(HERE, "script.json")
script = json.load(open(SCRIPT, encoding="utf-8"))
N_SCENES = len(dict.fromkeys(l["scene"] for l in script["lines"]))
# "3.73" -> ["three", "point", "seven", "three"]: how a number in the script is spoken
SPOKEN = {k: [vo.norm(w) for w in v.split()] for k, v in script.get("pronunciation", {}).items() if vo.NUMBER_KEY.match(k)}


def fold_numbers(words):
    out, i = [], 0
    while i < len(words):
        for key, seq in SPOKEN.items():
            if [vo.norm(w["w"]) for w in words[i:i + len(seq)]] == seq:
                out.append({**words[i], "w": key})
                i += len(seq)
                break
        else:
            out.append(words[i])
            i += 1
    return out


def asr_words_by_scene(rec, a, sr, max_chunk=28.0):
    total = len(a) / sr
    gaps = [(s1 - s0, (s0 + s1) / 2) for s0, s1 in vo.silences(a, sr, min_len=0.25) if 1.0 < (s0 + s1) / 2 < total - 1.0]
    cuts = [0.0] + sorted(mid for _, mid in sorted(gaps, reverse=True)[: N_SCENES - 1]) + [total]
    print("recognising", len(cuts) - 1, "takes, cut at", [round(c, 2) for c in cuts[1:-1]])
    words, texts = [], []
    for c0, c1 in zip(cuts[:-1], cuts[1:]):
        seg = sps.resample_poly(a[int(c0 * sr):int(c1 * sr)], 16000, sr).astype(np.float32)
        s = rec.create_stream()
        s.accept_waveform(16000, seg)
        rec.decode_stream(s)
        r = s.result
        texts.append(r.text)
        chunk = []
        for tok, ts in zip(r.tokens, r.timestamps):
            if tok.startswith((" ", "▁")) or not chunk:
                chunk.append({"w": tok.strip(" ▁"), "start": c0 + float(ts), "chunk": c0})
            else:
                chunk[-1]["w"] += tok
        words += fold_numbers([w for w in chunk if w["w"]])
    return words, " ".join(texts)


vo.asr_words = asr_words_by_scene
if __name__ == "__main__":
    os.chdir(os.path.join(HERE, ".."))
    sys.argv = [sys.argv[0], "take", "--script", "tools/script.json", "--audio", "el-scenes/take.wav",
                "--voice-label", "ElevenLabs Jason, per-scene takes (Zo-GRAY-oh)"] + sys.argv[1:]
    vo.main()
