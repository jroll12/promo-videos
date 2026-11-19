#!/usr/bin/env python3
"""Blind sync check. Reads only the final cue times (build/timing.json) and the audio; it does not
reuse the aligner's onset picker. Two tests:
 1. Global lag: cross-correlate a pulse train of line starts against the 300-3000 Hz flux; the peak
    lag should be near 0 (a systematic offset would show here).
 2. Per line: the lag (within +-0.2 s) that maximises flux around that start. Lines whose best lag
    is over 0.12 s are listed for a manual look.
  /root/lv/bin/python -I tools/synccheck.py [--words]
"""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import stft

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = json.load(open(os.path.join(ROOT, "build/timing.json")))
y, sr = sf.read(os.path.join(ROOT, "assets/audio/song.wav"))
y = y.mean(1) if y.ndim > 1 else y
hop = 240  # 5 ms at 48 kHz
f, t, Z = stft(y, fs=sr, nperseg=2048, noverlap=2048 - hop)
mag = np.abs(Z)
band = mag[(f >= 300) & (f <= 3000)].sum(0)
flux = np.maximum(0, np.diff(np.log1p(band), prepend=0))
flux = np.convolve(flux, np.ones(4) / 4, "same")
fr = 1 / (t[1] - t[0])

lines = [l for s in T["sections"] for l in s["lines"]]
starts = np.array([l["start"] for l in lines])
if "--words" in sys.argv:
    starts = np.array([w["start"] for l in lines for w in l["words"]])

train = np.zeros_like(flux)
for s in starts:
    i = int(round(s * fr))
    if 0 <= i < len(train): train[i] = 1
lags = np.arange(-int(0.3 * fr), int(0.3 * fr) + 1)
cc = [float(np.dot(np.roll(train, L), flux)) for L in lags]
best = lags[int(np.argmax(cc))] / fr
print(f"global lag {best*1000:+.0f} ms (positive = vocals arrive after our cues)  over {len(starts)} cues")

if "--words" not in sys.argv:
    res = []
    for l in lines:
        i0 = int(round(l["start"] * fr)); w = int(0.2 * fr)
        seg = flux[max(0, i0 - w): i0 + w + 1]
        lag = (int(np.argmax(seg)) - min(w, i0)) / fr
        res.append((l["id"], l["text"], lag))
    d = np.array([abs(r[2]) for r in res])
    print(f"per-line |lag|: median {np.median(d)*1000:.0f} ms, p90 {np.percentile(d,90)*1000:.0f} ms")
    for r in res:
        if abs(r[2]) > 0.12: print(f"  {r[0]} {r[2]*1000:+5.0f} ms  {r[1][:50]}")
