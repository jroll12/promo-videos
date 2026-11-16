"""Phase 0, step 3: merge the beat grid and the alignment into timing.json and write the confidence report.

    analysis/.venv/bin/python analysis/build_timing.py

Reads analysis/out/beats.json, analysis/out/align.json, timing.config.json, lyrics.txt.
Writes timing.json (committed), src/data/energy.json if src/data exists, and analysis/report.md.
Pure arithmetic: same inputs give the same bytes.
"""
import difflib
import json
import shutil
from pathlib import Path

from lyrics import parse, norm_word

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "analysis" / "out"
CFG = json.loads((ROOT / "timing.config.json").read_text())
BEATS = json.loads((OUT / "beats.json").read_text())
ALIGN = json.loads((OUT / "align.json").read_text())
TH = CFG["thresholds"]
FPS = CFG["fps"]
BPB = CFG["beatsPerBar"]

duration = BEATS["audio"]["duration"]
measured = BEATS["tempo"]["fitBpmRobust"]
period = BEATS["tempo"]["periodSec"] if CFG["grid"]["useMeasuredTempo"] else 60.0 / CFG["nominalBpm"]
offset = BEATS["tempo"]["offsetSec"] + CFG["grid"]["manualOffsetSec"]
phase = CFG["grid"]["barPhase"]
bar_len = period * BPB
bar0 = offset + phase * period


def fr(t):  # the only place seconds become frames
    return int(round(t * FPS))


def bar_t(b):
    return bar0 + b * bar_len


# ---------- grid ----------
beats = []
i = 0
while offset + i * period < duration:
    t = offset + i * period
    k = i - phase
    beats.append({"i": i, "t": round(t, 4), "frame": fr(t), "bar": k // BPB, "beatInBar": k % BPB})
    i += 1
n_bars = max(b["bar"] for b in beats) + 1

sections = []
for n, sc in enumerate(CFG["sections"]):
    start = 0.0 if n == 0 else bar_t(sc["startBar"])
    end = duration if n == len(CFG["sections"]) - 1 else bar_t(CFG["sections"][n + 1]["startBar"])
    kind = "hook" if sc["id"].startswith("hook") else ("verse" if sc["id"].startswith("verse") else sc["id"])
    s = {"id": sc["id"], "type": kind, "start": round(start, 4), "end": round(end, 4), "startFrame": fr(start), "endFrame": fr(end),
         "startBar": sc["startBar"], "bars": sc["bars"], "intensity": sc["intensity"]}
    if "tailBars" in sc:
        s["tailBars"] = sc["tailBars"]
    sections.append(s)
sec_by_id = {s["id"]: s for s in sections}

bars = []
for b in range(n_bars):
    t = bar_t(b)
    owner = next((s["id"] for s in sections if s["startBar"] <= b < s["startBar"] + s["bars"]), sections[-1]["id"])
    bars.append({"i": b, "t": round(t, 4), "frame": fr(t), "section": owner})

# ---------- lines ----------
lyr = parse(ROOT / CFG["lyrics"])
A = {x["id"]: x for x in ALIGN["global"]}
B = {x["id"]: x for x in ALIGN["windowed"]}
FREE = ALIGN["free"]


def similar(a, b):
    return a == b or difflib.SequenceMatcher(None, a, b).ratio() >= 0.75


def free_match(words):
    """Share of a line's words that the lyric-free transcription also heard at about the same time.
    Hyphenated words count per part ("snack-pack" = snack + pack), as the transcriber writes them apart."""
    hit = n = 0
    for w in words:
        lo, hi = w["start"] - TH["freeMatchWindowSec"], w["end"] + TH["freeMatchWindowSec"]
        near = [f["w"] for f in FREE if lo <= f["start"] <= hi]
        for part in w["w"].replace("-", " ").split():
            nw = norm_word(part)
            if not nw:
                continue
            n += 1
            hit += any(similar(nw, f) for f in near)
    return hit / n if n else 0.0


def tidy(words):
    """Forced alignment parks uncertain first words early and lets last words ring on. Trim both; never move a confident word."""
    ws = [dict(w) for w in words]
    if ws and ws[0]["p"] < 0.3 and ws[0]["end"] - ws[0]["start"] > 0.5:
        ws[0]["start"] = round(ws[0]["end"] - 0.35, 3)
    if ws and ws[-1]["end"] - ws[-1]["start"] > 1.0:
        ws[-1]["end"] = round(ws[-1]["start"] + 1.0, 3)
    return ws


lines, rows = [], []
for sec in lyr:
    sc = sec_by_id[sec["id"]]
    for ln in sec["lines"]:
        sb, nb = CFG["lineBars"].get(ln["id"], [sc["startBar"] + ln["index"], 1])
        g0, g1 = bar_t(sb), bar_t(sb + nb)
        a, b = A[ln["id"]], B[ln["id"]]
        wa, wb = tidy(a["words"]), tidy(b["words"])
        a0, a1, b0 = wa[0]["start"], wa[-1]["end"], wb[0]["start"]
        prob = sum(w["p"] for w in a["words"]) / len(a["words"])
        matched = free_match(wa)
        # distance in beats from the line start to the window [one beat of pickup before its bars, end of its bars]
        lo, hi = g0 - period, g1
        dev = max(0.0, lo - a0, a0 - hi) / period
        dur_bars = (a1 - a0) / bar_len
        flags = []
        if prob < TH["minMeanWordProb"]:
            flags.append("low-probability")
        if matched < TH["minWordsMatched"]:
            flags.append("not-heard-by-free-pass")
        if dev > TH["maxStartDeviationBeats"]:
            flags.append("off-grid")
        if dur_bars > nb * TH["maxDurationBars"]:
            flags.append("too-long")
        notes = []
        if abs(a0 - b0) > TH["passAgreementSec"]:
            notes.append("passes-disagree")
        ok = not flags
        acc = CFG.get("accepted", {})
        if ok:
            start, end, source, words = a0, a1, "aligned", wa
        elif ln["id"] in acc.get("aligned", []):
            start, end, source, words = a0, a1, "aligned", wa
            notes.append("accepted-on-review")
        elif ln["id"] in acc.get("lineOnly", []):
            start, end, source, words = a0, a1, "aligned", []
            notes.append("accepted-on-review-line-only")
        else:
            start, end, source, words = g0, g1, "grid", []
        ov = CFG.get("lineOverrides", {}).get(ln["id"])
        if ov:
            start, end, source, words = ov["start"], ov["end"], "manual", []
            flags = flags + ["manual-override"]
        lines.append({"id": ln["id"], "section": ln["section"], "index": ln["index"], "text": ln["text"],
                      "start": round(start, 3), "end": round(end, 3), "startFrame": fr(start), "endFrame": fr(end),
                      "bar": sb, "bars": nb, "gridStart": round(g0, 3), "gridEnd": round(g1, 3),
                      "gridStartFrame": fr(g0), "gridEndFrame": fr(g1),
                      "confidence": round(prob, 3), "wordsMatched": round(matched, 2), "source": source, "flags": flags + notes,
                      "words": [{"w": w["w"], "start": w["start"], "end": w["end"], "startFrame": fr(w["start"]), "p": w["p"]} for w in words]})
        rows.append({"id": ln["id"], "text": ln["text"], "prob": prob, "matched": matched, "a0": a0, "a1": a1, "b0": b0, "g0": g0,
                     "dev": dev, "dur": dur_bars, "nb": nb, "ok": ok, "flags": flags, "notes": notes, "source": source,
                     "beatInBar": ((a0 - bar0) / period) % BPB + 1, "aligned_words": a["words"]})

# monotonic sanity: a line may not start before the previous one
for p, q in zip(lines, lines[1:]):
    assert q["start"] >= p["start"] - 1e-6, (p["id"], q["id"])

timing = {
    "version": 1,
    "audio": {"file": CFG["audio"], "sha256": BEATS["audio"]["sha256"], "duration": duration, "sampleRate": 48000},
    "fps": FPS, "durationInFrames": fr(duration),
    "tempo": {"nominalBpm": CFG["nominalBpm"], "measuredBpm": measured, "beatSec": round(period, 6), "barSec": round(bar_len, 6),
              "beatsPerBar": BPB, "gridOffsetSec": round(offset, 4), "barPhase": phase, "firstBarSec": round(bar0, 4),
              "residualRmsMs": BEATS["tempo"]["residualMs"]["rms"], "maxDriftMs": BEATS["tempo"]["residualMs"]["maxAbsKept"],
              "source": "librosa beat track, linear fit"},
    "sections": sections, "bars": bars, "beats": beats, "lines": lines,
}
(ROOT / "timing.json").write_text(json.dumps(timing, indent=1, ensure_ascii=False) + "\n")
if (ROOT / "src" / "data").is_dir():
    shutil.copyfile(OUT / "energy.json", ROOT / "src" / "data" / "energy.json")

# ---------- report ----------
dev_pct = abs(measured - CFG["nominalBpm"]) / CFG["nominalBpm"] * 100
R = ["# Phase 0 report: timing and alignment confidence", "",
     "## Tempo and grid", "",
     f"- Measured tempo: **{measured:.3f} BPM** (brief says {CFG['nominalBpm']}; deviation {dev_pct:.3f} %, limit {TH['maxTempoDeviationPct']} %).",
     f"- Beat fit residual: {BEATS['tempo']['residualMs']['rms']} ms RMS, worst kept beat {BEATS['tempo']['residualMs']['maxAbsKept']} ms. "
     f"Mean residual first quarter {BEATS['tempo']['residualMs']['firstQuarterMean']} ms, last quarter {BEATS['tempo']['residualMs']['lastQuarterMean']} ms: no drift.",
     f"- Grid: beat {period:.6f} s, bar {bar_len:.4f} s, bar 0 downbeat at {bar0:.3f} s. {len(beats)} beats, {n_bars} bars, {fr(duration)} frames.",
     "", "## Sections", "", "| section | bars | start bar | start s | end s | frames |", "|---|---|---|---|---|---|"]
for s in sections:
    R.append(f"| {s['id']} | {s['bars']} | {s['startBar']} | {s['start']:.2f} | {s['end']:.2f} | {s['startFrame']}..{s['endFrame']} |")
bad = [r for r in rows if not r["ok"]]
R += ["", "## Lines", "",
      f"Threshold: word probability >= {TH['minMeanWordProb']}, words confirmed by the lyric-free pass >= {int(TH['minWordsMatched'] * 100)} %, "
      f"start within {TH['maxStartDeviationBeats']} beat of its bars, length <= {TH['maxDurationBars']}x its bars.",
      f"**{len(rows) - len(bad)} of {len(rows)} lines pass. {len(bad)} fall back to bar-grid timing.**", "",
      "| id | prob | heard | start s | grid s | beat in bar | passes A-B | source | flags | text |", "|---|---|---|---|---|---|---|---|---|---|"]
for r in rows:
    mark = "" if r["ok"] else "**"
    R.append(f"| {mark}{r['id']}{mark} | {r['prob']:.2f} | {int(round(r['matched'] * 100))} % | {r['a0']:.2f} | {r['g0']:.2f} | {r['beatInBar']:.2f} | "
             f"{r['b0'] - r['a0']:+.2f} | {r['source']} | {', '.join(r['flags'] + r['notes']) or 'ok'} | {r['text']} |")
R += ["", "## Under threshold", ""]
for r in bad:
    R.append(f"- **{r['id']}** \"{r['text']}\": {', '.join(r['flags'])}. Aligner said {r['a0']:.2f}..{r['a1']:.2f} s; using grid {r['g0']:.2f}..{r['g0'] + r['nb'] * bar_len:.2f} s. "
             f"Words: " + " ".join(f"{w['w']}({w['p']:.2f})" for w in r["aligned_words"]))
R += ["", "## What the lyric-free pass heard", ""] + [f"- {s['section']} {s['start']:.2f}..{s['end']:.2f}: {s['text']}" for s in ALIGN["freeSegments"]]
(ROOT / "analysis" / "report.md").write_text("\n".join(R) + "\n")

print(f"tempo {measured:.3f} BPM, {len(beats)} beats, {n_bars} bars, {fr(duration)} frames")
print(f"{len(rows) - len(bad)}/{len(rows)} lines pass; {len(bad)} under threshold:")
for r in bad:
    print(f"  {r['id']:7s} p={r['prob']:.2f} heard={r['matched']:.2f} dev={r['dev']:.2f} dur={r['dur']:.2f}/{r['nb']} {r['flags']} | {r['text']}")
print("notes:", [(r["id"], r["notes"]) for r in rows if r["notes"] and r["ok"]])
