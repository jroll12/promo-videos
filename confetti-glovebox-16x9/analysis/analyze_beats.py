"""Phase 0, step 1: beat grid, tempo check, bar phase, per-bar features and per-frame energy.

    analysis/.venv/bin/python analysis/analyze_beats.py

Reads public/song.m4a and timing.config.json. Writes analysis/out/beats.json and analysis/out/energy.json.
Nothing here is random: librosa's beat tracker is a deterministic dynamic programme.
"""
import hashlib
import json
import subprocess
from pathlib import Path

import librosa
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "analysis" / "out"
OUT.mkdir(parents=True, exist_ok=True)
CFG = json.loads((ROOT / "timing.config.json").read_text())
SONG = ROOT / CFG["audio"]
SR = 22050
HOP = 256  # 11.6 ms
FPS = CFG["fps"]

wav = OUT / "song_22k_mono.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(SONG), "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", str(wav)], check=True)
duration = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(SONG)],
                                capture_output=True, text=True).stdout)
y, _ = librosa.load(wav, sr=SR, mono=True)

onset_env = librosa.onset.onset_strength(y=y, sr=SR, hop_length=HOP, aggregate=np.median)
times = librosa.times_like(onset_env, sr=SR, hop_length=HOP)

# --- tempo candidates, without the prior that pulls everything to 120 ---
ac = librosa.autocorrelate(onset_env, max_size=int(4 * SR / HOP))
lags = np.arange(1, len(ac))
bpms = 60.0 * SR / (HOP * lags)
mask = (bpms >= 60) & (bpms <= 200)
order = np.argsort(ac[1:][mask])[::-1][:8]
candidates = [{"bpm": round(float(bpms[mask][i]), 2), "score": round(float(ac[1:][mask][i] / ac[0]), 4)} for i in order]

# --- beat tracking seeded at the nominal tempo ---
nominal = CFG["nominalBpm"]
tempo, beat_frames = librosa.beat.beat_track(onset_envelope=onset_env, sr=SR, hop_length=HOP, start_bpm=nominal, tightness=100, units="frames")
beat_times = librosa.frames_to_time(beat_frames, sr=SR, hop_length=HOP)

# refine each beat to the local onset peak (within 35 ms) so the fit is not limited by the tracker's lattice
def refine(t):
    i = int(round(t * SR / HOP))
    lo, hi = max(0, i - 3), min(len(onset_env), i + 4)
    j = lo + int(np.argmax(onset_env[lo:hi]))
    return float(times[j])
refined = np.array([refine(t) for t in beat_times])

# --- linear fit: beat k happens at offset + k * period ---
k = np.arange(len(refined))
A = np.vstack([k, np.ones_like(k)]).T
(period, offset), *_ = np.linalg.lstsq(A, refined, rcond=None)
resid = refined - (offset + k * period)
measured_bpm = 60.0 / period

# robust refit: drop beats more than 40 ms from the line (fills, silences), fit again
keep = np.abs(resid) < 0.040
(period2, offset2), *_ = np.linalg.lstsq(A[keep], refined[keep], rcond=None)
resid2 = refined - (offset2 + k * period2)
measured_bpm2 = 60.0 / period2

# local tempo in 16-beat windows, to see drift rather than average it away
local = []
for s in range(0, len(refined) - 16, 8):
    seg = refined[s:s + 17]
    p = np.polyfit(np.arange(len(seg)), seg, 1)[0]
    local.append({"beat": int(s), "t": round(float(seg[0]), 3), "bpm": round(60.0 / p, 3)})

# --- the grid: constant tempo, extended to cover the whole file ---
grid_period = period2
grid_offset = offset2 % grid_period  # earliest beat at or after 0
n_beats = int(np.floor((duration - grid_offset) / grid_period)) + 1
grid = grid_offset + grid_period * np.arange(n_beats)

# --- bar phase: which of 4 beat positions carries the downbeat ---
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=HOP))
freqs = librosa.fft_frequencies(sr=SR, n_fft=2048)
low = S[(freqs >= 30) & (freqs <= 120)].sum(axis=0)
low_flux = np.maximum(0, np.diff(low, prepend=low[0]))
def at(env, t):
    i = int(round(t * SR / HOP))
    lo, hi = max(0, i - 2), min(len(env), i + 3)
    return float(env[lo:hi].max()) if hi > lo else 0.0
phase_scores = []
for ph in range(4):
    idx = np.arange(ph, n_beats, 4)
    phase_scores.append({"phase": ph, "lowFlux": round(float(np.mean([at(low_flux, grid[i]) for i in idx])), 3),
                         "onset": round(float(np.mean([at(onset_env, grid[i]) for i in idx])), 3)})

# --- per-beat and per-bar features for section finding (bars counted from grid beat 0, phase applied later) ---
rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=HOP)[0]
centroid = librosa.feature.spectral_centroid(S=S, sr=SR)[0]
hi = S[freqs >= 6000].sum(axis=0)
mid = S[(freqs >= 300) & (freqs <= 3400)].sum(axis=0)  # where the voice sits
def seg_mean(env, t0, t1):
    a, b = int(t0 * SR / HOP), max(int(t0 * SR / HOP) + 1, int(t1 * SR / HOP))
    return float(env[a:b].mean()) if a < len(env) else 0.0
beat_feats = []
for i in range(n_beats):
    t0, t1 = grid[i], grid[i] + grid_period
    beat_feats.append({"i": i, "t": round(float(t0), 4), "rms": round(seg_mean(rms, t0, t1), 5), "low": round(seg_mean(low, t0, t1), 2),
                       "mid": round(seg_mean(mid, t0, t1), 2), "hi": round(seg_mean(hi, t0, t1), 2),
                       "centroid": round(seg_mean(centroid, t0, t1), 1), "kick": round(at(low_flux, t0), 2)})

# --- per-video-frame energy for audio-reactive motion (normalised 0..1) ---
n_frames = int(np.ceil(duration * FPS))
ft = np.arange(n_frames) / FPS
def per_frame(env):
    v = np.array([seg_mean(env, t, t + 1.0 / FPS) for t in ft])
    p = np.percentile(v, 99)
    return np.clip(v / p if p > 0 else v, 0, 1)
energy = {"fps": FPS, "frames": n_frames,
          "rms": [round(float(x), 3) for x in per_frame(rms)],
          "onset": [round(float(x), 3) for x in per_frame(onset_env)],
          "low": [round(float(x), 3) for x in per_frame(low)]}
(OUT / "energy.json").write_text(json.dumps(energy, separators=(",", ":")))

out = {
    "audio": {"file": CFG["audio"], "sha256": hashlib.sha256(SONG.read_bytes()).hexdigest(), "duration": round(duration, 4)},
    "tempo": {
        "nominalBpm": nominal,
        "librosaTempo": round(float(np.atleast_1d(tempo)[0]), 3),
        "candidates": candidates,
        "fitBpm": round(float(measured_bpm), 4), "fitBpmRobust": round(float(measured_bpm2), 4),
        "offsetSec": round(float(grid_offset), 4), "periodSec": round(float(grid_period), 6),
        "trackedBeats": int(len(refined)), "beatsKeptInFit": int(keep.sum()),
        "residualMs": {"rms": round(float(np.sqrt(np.mean(resid2[keep] ** 2)) * 1000), 2),
                       "maxAbsKept": round(float(np.abs(resid2[keep]).max() * 1000), 2),
                       "maxAbsAll": round(float(np.abs(resid2).max() * 1000), 2),
                       "firstQuarterMean": round(float(resid2[: len(resid2) // 4].mean() * 1000), 2),
                       "lastQuarterMean": round(float(resid2[-len(resid2) // 4:].mean() * 1000), 2)},
        "localBpm": local,
    },
    "phaseScores": phase_scores,
    "grid": [round(float(t), 4) for t in grid],
    "beatFeatures": beat_feats,
}
(OUT / "beats.json").write_text(json.dumps(out, indent=1))
t = out["tempo"]
print(f"duration {duration:.3f}s | librosa tempo {t['librosaTempo']} | fit {t['fitBpm']} | robust fit {t['fitBpmRobust']} BPM")
print(f"grid offset {t['offsetSec']}s period {t['periodSec']}s | {n_beats} grid beats | kept {t['beatsKeptInFit']}/{t['trackedBeats']}")
print("residual ms:", t["residualMs"])
print("tempo candidates:", candidates[:5])
print("local bpm min/max:", min(l["bpm"] for l in local), max(l["bpm"] for l in local))
print("phase scores:", phase_scores)
