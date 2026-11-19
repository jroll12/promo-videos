#!/usr/bin/env python3
"""Suno's embedded line timings + vocal onsets -> build/timing.json (sections > lines > words).

  /root/lv/bin/python -I tools/align.py

Lines: start snapped to the strongest vocal-band onset within +-SNAP s of Suno's time (distance
weighted), only when that onset is clearly stronger than the local median. Words: the line's sung
window (capped, so instrumental tails are not spread across words) is split by syllable weight,
then each word start is nudged to an onset within +-WSNAP s. Any manual fix goes in FIX below.
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = lambda p: os.path.join(ROOT, "build", p)
SNAP, WSNAP = 0.12, 0.07
FIX = {}  # line index -> start override (seconds), filled after synccheck if needed

def ts(s):
    h, m, rest = s.split(":"); sec, ms = rest.split(",")
    return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000

blocks = open(B("suno.srt"), encoding="utf-8").read().strip().split("\n\n")
raw = []
for b in blocks:
    ln = b.strip().split("\n")
    a, z = ln[1].split(" --> ")
    raw.append({"start": ts(a), "end": ts(z), "text": " ".join(ln[2:]).strip()})

beats = json.load(open(B("beats.json")))
ons = list(zip(beats["vocalOnsets"], beats["vocalOnsetStrength"]))
dur = beats["duration"]

def snap(t, win, strong=1.0):
    cands = [(o, s) for o, s in ons if abs(o - t) <= win]
    if not cands: return t
    near = sorted(s for o, s in ons if abs(o - t) <= 1.0)
    med = near[len(near) // 2] if near else 0
    best = max(cands, key=lambda c: c[1] * (1 - 0.5 * abs(c[0] - t) / win))
    return best[0] if best[1] >= strong * med else t

def syl(w):
    w = re.sub(r"[^a-z]", "", w.lower())
    if not w: return 1
    n = len(re.findall(r"[aeiouy]+", w))
    if w.endswith("e") and not w.endswith(("le", "ee", "ye")) and n > 1: n -= 1
    if w.endswith("ion") or w.endswith("ious"): pass
    return max(1, n)

sections, cur = [], None
names_seen = {}
for i, r in enumerate(raw):
    m = re.match(r"^\[(.+?)(?:\s*\|\s*(.*))?\]$", r["text"])
    if m:
        name, desc = m.group(1).strip(), (m.group(2) or "").strip()
        if cur and cur["name"] == name and not cur["lines"]: continue
        if cur and cur["name"] == name: continue  # Suno repeats the Outro marker mid-outro
        names_seen[name] = names_seen.get(name, 0) + 1
        sid = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
        if names_seen[name] > 1: sid += f"-{names_seen[name]}"
        cur = {"id": sid, "name": name, "desc": desc, "marker": r["start"], "lines": []}
        sections.append(cur)
        continue
    cur["lines"].append({"i": i, "text": r["text"], "suno": [r["start"], r["end"]]})

all_lines = [l for s in sections for l in s["lines"]]
for li, l in enumerate(all_lines):
    l["start"] = round(FIX.get(li, snap(l["suno"][0], SNAP, 1.3)), 3)
for li, l in enumerate(all_lines):
    nxt = all_lines[li + 1]["start"] if li + 1 < len(all_lines) else dur
    l["end"] = round(min(max(l["suno"][1], l["start"] + 0.3), nxt), 3)
    words = l["text"].split()
    sy = [syl(w) for w in words]
    sing = min(l["end"] - l["start"], sum(sy) * 0.32 + 0.35)
    l["singEnd"] = round(l["start"] + sing, 3)
    tot, acc, out = sum(sy), 0, []
    for w, s in zip(words, sy):
        t = l["start"] + sing * acc / tot
        if acc: t = snap(t, WSNAP, 1.0)
        out.append({"w": w, "start": round(t, 3)}); acc += s
    for j, w in enumerate(out):  # keep monotonic, minimum 60 ms per word
        if j and w["start"] < out[j - 1]["start"] + 0.06: w["start"] = round(out[j - 1]["start"] + 0.06, 3)
    for j, w in enumerate(out):
        w["end"] = out[j + 1]["start"] if j + 1 < len(out) else l["singEnd"]
    l["words"] = out
    l["id"] = f"L{li:03d}"

for k, s in enumerate(sections):
    s["start"] = 0.0 if k == 0 else round(min(s["marker"], s["lines"][0]["start"]) if s["lines"] else s["marker"], 3)
for k, s in enumerate(sections):
    s["end"] = round(sections[k + 1]["start"] if k + 1 < len(sections) else dur, 3)

json.dump({"duration": round(dur, 3), "bpm": beats["bpm"], "period": beats["period"], "t0": beats["t0"],
           "sections": sections}, open(B("timing.json"), "w"), indent=1)
for s in sections:
    print(f"{s['id']:14s} {s['start']:7.2f} -> {s['end']:7.2f}  {len(s['lines'])} lines")
moved = [(l["id"], l["text"][:28], round(l["start"] - l["suno"][0], 3)) for l in all_lines if abs(l["start"] - l["suno"][0]) > 0.001]
print(f"{len(all_lines)} lines; {len(moved)} snapped; max shift {max((abs(m[2]) for m in moved), default=0):.3f}s")
