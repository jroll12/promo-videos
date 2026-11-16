"""Check that a rendered video's audio is the song, in sync.

    analysis/.venv/bin/python tools/sync_check.py out/video.mp4 [--start-frame N]

Cross-correlates the rendered audio against public/song.m4a starting at frame N (default 0) and reports the offset
in ms (expect 0 within one audio block) and the duration difference.
"""
import argparse
import subprocess
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("video")
ap.add_argument("--start-frame", type=int, default=0)
ap.add_argument("--fps", type=int, default=30)
a = ap.parse_args()
SR = 8000


def load(path, ss=0.0, t=None):
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{ss:.4f}", "-i", path]
    if t:
        cmd += ["-t", f"{t:.4f}"]
    cmd += ["-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32)


vid = load(a.video)
ref = load("public/song.m4a", ss=a.start_frame / a.fps, t=len(vid) / SR)
n = min(len(vid), len(ref))
v, r = vid[:n] - vid[:n].mean(), ref[:n] - ref[:n].mean()
size = 1 << int(np.ceil(np.log2(2 * n)))
xc = np.fft.irfft(np.fft.rfft(v, size) * np.conj(np.fft.rfft(r, size)), size)
lag = int(np.argmax(xc))
if lag > size // 2:
    lag -= size
corr = float(xc.max() / (np.linalg.norm(v) * np.linalg.norm(r) + 1e-9))
print(f"offset {lag / SR * 1000:+.1f} ms | normalised correlation {corr:.3f} | video audio {len(vid) / SR:.3f}s vs reference {len(ref) / SR:.3f}s")
print("PASS" if abs(lag) / SR < 0.012 and corr > 0.8 else "FAIL")
