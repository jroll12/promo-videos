"""Estimated word times (no audio) so scenes can be built and checked before any voiceover is generated.

    python tools/provisional_timing.py      # writes build/timing.json with "provisional": true

el_scenes.py overwrites it with the real take's times. Pace: 2.92 words/s (measured on the Zogreo Jason take),
a numeral counts as the words it takes to say, plus sentence and comma pauses and the same scene gaps as el_scenes.
"""
import json

WPS = 2.92  # measured on the Zogreo Jason take
LEAD_IN = 0.45
GAP_AFTER = {"why": 0.6, "study": 0.75, "how": 0.75}
WEIGHT = {"33,000": 3, "3:16,": 2, "93": 2, "96.": 2, "apologist.ai.": 4, "AI": 1.4}

s = json.load(open("tools/script.json"))
t, lines, prev_scene = LEAD_IN, [], None
for l in s["lines"]:
    if prev_scene and l["scene"] != prev_scene:
        t += GAP_AFTER[prev_scene]
    prev_scene = l["scene"]
    ws = []
    for w in l["text"].split():
        d = WEIGHT.get(w, 1) / WPS
        ws.append({"w": w, "start": round(t, 3), "end": round(t + d - 0.03, 3)})
        t += d
    t += 0.35  # the pause between sentences of one take (in-line pauses are inside the measured pace)
    lines.append({"id": l["id"], "text": l["text"], "start": ws[0]["start"], "end": ws[-1]["end"], "words": ws})
dur = round(t + 0.7, 3)
json.dump({"provisional": True, "engine": "estimate", "duration": dur, "lines": lines}, open("build/timing.json", "w"), indent=1)
print(f"provisional timing: {dur:.2f}s, {sum(len(l['words']) for l in lines)} words")
