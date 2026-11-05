"""Pop scan: find frames that jump when they should not.

    python popscan.py render.mp4 [--events build/events.json]

Decodes a small grayscale copy, measures how much each frame differs from the previous one, and reports
isolated one-frame spikes. Eased moves ramp over many frames and are not flagged; a pop is one frame far
above both neighbours. A scene cut should show up as exactly one spike; anything else is a glitch (a
missing element, a swap that was not hidden by motion, an asset that popped in).

--events is {name: seconds} for moments that are meant to jump (cuts, swaps); a spike within 0.6 s of
one is labelled with it, otherwise UNEXPLAINED. build.mjs writes build/events.json.
Also reports how still the last 2.5 s is: the end card should hold (change ~0), not drift.
"""
import argparse
import json
import subprocess

import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("video")
ap.add_argument("--events")
ap.add_argument("--fps", type=float, default=30)
ap.add_argument("--all", action="store_true", help="also list every frame above 2.2x the local median")
a = ap.parse_args()

W, H = 270, 480
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", a.video, "-vf", f"scale={W}:{H},format=gray,gblur=sigma=1.2", "-f", "rawvideo", "-"],
                     capture_output=True, check=True).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
diff = np.abs(np.diff(frames, axis=0)).mean(axis=(1, 2))  # diff[i] = change into frame i+1
med = np.array([np.median(diff[max(0, i - 15): i + 16]) for i in range(len(diff))])
pops = [i + 1 for i in range(1, len(diff) - 1) if diff[i] > 2.0 and diff[i] > 2.2 * max(diff[i - 1], diff[i + 1], 0.2)]
events = json.load(open(a.events)) if a.events else {}


def label(t):
    if not events:
        return "UNEXPLAINED"
    name, at = min(events.items(), key=lambda kv: abs(kv[1] - t))
    return name if abs(at - t) < 0.6 else "UNEXPLAINED"


print(f"{len(frames)} frames ({len(frames) / a.fps:.2f} s), median frame change {np.median(diff):.2f}")
print(f"{len(pops)} isolated one-frame spike(s):")
for f in pops:
    t = f / a.fps
    print(f"  frame {f:5d}  t={t:6.2f}s  change {diff[f - 1]:6.2f}  (neighbours {diff[f - 2]:.2f} / {diff[f]:.2f})  -> {label(t)}")
if a.all:
    for i in range(len(diff)):
        if diff[i] > 2.2 * max(med[i], 0.35) and diff[i] > 1.0:
            print(f"  frame {i + 1:5d}  t={(i + 1) / a.fps:6.2f}s  change {diff[i]:6.2f} (local {med[i]:.2f})  -> {label((i + 1) / a.fps)}")
tail = diff[-int(a.fps * 2.5):]
print(f"last 2.5 s: mean frame change {tail.mean():.3f} (a held end card should be ~0)")
bad = [f for f in pops if label(f / a.fps) == "UNEXPLAINED"]
print("RESULT:", "no unexplained pops" if not bad else f"{len(bad)} UNEXPLAINED pop(s) - look at those frames")
