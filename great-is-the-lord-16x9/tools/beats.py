#!/usr/bin/env python3
"""Beat grid, bar phase, vocal-band onsets and 30 fps energy envelopes for the song.

  /root/lv/bin/python -I tools/beats.py            -> build/beats.json, build/env.json

Beat times come from `hyperframes beats` (build/hf_beats.json). We fit a straight line to them
(Suno renders to a fixed tempo), find which beat of four carries the most kick energy to set the
bar phase, and detect vocal-band onsets for the lyric aligner.
"""
import json, os, sys
import numpy as np
import librosa

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = lambda p: os.path.join(ROOT, "build", p)

y, sr = librosa.load(os.path.join(ROOT, "assets/audio/song.wav"), sr=22050, mono=True)
dur = len(y) / sr

hf = json.load(open(B("hf_beats.json")))
bt = np.array(hf["beatTimes"])
k = np.arange(len(bt))
# robust linear fit: iterate dropping outliers
mask = np.ones(len(bt), bool)
for _ in range(3):
    period, t0 = np.polyfit(k[mask], bt[mask], 1)
    res = bt - (t0 + period * k)
    mask = np.abs(res) < 0.03
print(f"grid: period {period:.5f}s  ({60/period:.2f} bpm)  t0 {t0:.3f}  inliers {mask.sum()}/{len(bt)}  "
      f"max|res| {np.abs(res[mask]).max()*1000:.1f} ms")
# extend grid back to before 0 and to end of song
kmin = int(np.floor(-t0 / period))
kmax = int(np.ceil((dur - t0) / period))
grid = [t0 + period * i for i in range(kmin, kmax + 1) if 0 <= t0 + period * i <= dur]

# spectrogram for band energies
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=256))
freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
times = librosa.frames_to_time(np.arange(S.shape[1]), sr=sr, hop_length=256)
band = lambda lo, hi: S[(freqs >= lo) & (freqs < hi)].sum(0)
kick = band(30, 120)
snare = band(1500, 5000)
vocal = band(300, 3000)

def at(series, t, w=0.04):
    m = (times >= t - w) & (times <= t + w)
    return float(series[m].max()) if m.any() else 0.0

# bar phase: beat position (0..3) with most kick energy, measured from the first beat in the grid
kv = np.array([at(kick, t) for t in grid])
sv = np.array([at(snare, t) for t in grid])
phase_scores = [kv[p::4].mean() for p in range(4)]
phase = int(np.argmax(phase_scores))
print("kick by phase:", [round(x, 1) for x in phase_scores], "-> downbeat phase", phase)
downbeats = grid[phase::4]

# vocal-band spectral flux onsets
flux = np.maximum(0, np.diff(np.log1p(vocal), prepend=np.log1p(vocal[0])))
on_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=256, fmin=300, fmax=3000, n_mels=64)
onsets = librosa.onset.onset_detect(onset_envelope=on_env, sr=sr, hop_length=256, units="time", backtrack=False)
on_str = [float(on_env[librosa.time_to_frames(t, sr=sr, hop_length=256)]) for t in onsets]

json.dump({
    "bpm": round(60 / period, 3), "period": period, "t0": t0, "duration": dur,
    "beats": [round(t, 4) for t in grid],
    "downbeats": [round(t, 4) for t in downbeats],
    "kick": [round(float(x), 2) for x in kv], "snare": [round(float(x), 2) for x in sv],
    "vocalOnsets": [round(float(t), 4) for t in onsets], "vocalOnsetStrength": [round(x, 3) for x in on_str],
}, open(B("beats.json"), "w"))

# 30 fps envelopes, normalised 0..1 (99th pct), for audio-reactive visuals baked into the film
fps = 30
ft = np.arange(0, dur, 1 / fps)
def env(series):
    v = np.interp(ft, times, series)
    v = v / (np.percentile(v, 99) + 1e-9)
    return [round(float(min(1.0, x)), 3) for x in v]
rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=256)[0]
json.dump({"fps": fps, "bass": env(kick), "high": env(snare), "vocal": env(vocal), "rms": env(rms)},
          open(B("env.json"), "w"))
print(f"beats {len(grid)}  downbeats {len(downbeats)}  vocal onsets {len(onsets)}  dur {dur:.2f}")
