"""Pop scan: flag frames whose change from the previous frame spikes above the local norm.

Usage: python tools/popscan.py renders/draft-1080.mp4 build/cues.json
Every flag should be an intended event (a cut, a blur swap, a camera move); anything else is a glitch.
"""
import json
import subprocess
import sys

import numpy as np

video, cues_path = sys.argv[1], sys.argv[2]
W, H, FPS = 270, 480, 30
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-vf", f"scale={W}:{H},format=gray,gblur=sigma=1.2",
                      "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
diff = np.abs(np.diff(frames, axis=0)).mean(axis=(1, 2))  # diff[i] = change into frame i+1
med = np.array([np.median(diff[max(0, i - 15): i + 16]) for i in range(len(diff))])
flags = [i + 1 for i in range(len(diff)) if diff[i] > 2.2 * max(med[i], 0.35) and diff[i] > 1.0]
# a pop is an isolated one-frame spike: far above both neighbours (eased moves ramp over many frames)
pops = [i + 1 for i in range(1, len(diff) - 1) if diff[i] > 2.0 and diff[i] > 2.2 * max(diff[i - 1], diff[i + 1], 0.2)]

c = json.load(open(cues_path))
n = c["night"]
known = {"cut night→proof": c["cutB"], "cut proof→give": c["cutC"], "lock→thread swap": n["swap"],
         "push-in": (n["pushStart"] + n["pushEnd"]) / 2, "pull-back": (n["pullStart"] + n["pullEnd"]) / 2,
         "screen off": n["closing"], "screen wakes": n["catching"] + 0.3, "AR→EN switch": n["heart"],
         "verse out": n["verseOut"], "name out": n["nameOut"], "headline out": c["cutC"] + c["give"]["headOut"],
         "logo wipe": c["cutC"] + c["give"]["logo"]}
print(f"{len(frames)} frames, median change {np.median(diff):.2f}, {len(flags)} flagged")
print(f"{len(pops)} isolated one-frame spikes (pop signature):")
for f in pops:
    t = f / FPS
    near = min(known.items(), key=lambda kv: abs(kv[1] - t))
    tag = near[0] if abs(near[1] - t) < 0.6 else "UNEXPLAINED"
    print(f"  POP frame {f:5d}  t={t:6.2f}s  change {diff[f - 1]:6.2f}  neighbours {diff[f - 2]:.2f}/{diff[f]:.2f}  -> {tag}")
if "--all" not in sys.argv:
    flags = []
for f in flags:
    t = f / FPS
    near = min(known.items(), key=lambda kv: abs(kv[1] - t))
    tag = near[0] if abs(near[1] - t) < 0.6 else "UNEXPLAINED"
    print(f"  frame {f:5d}  t={t:6.2f}s  change {diff[f - 1]:6.2f} (local {med[f - 1]:.2f})  -> {tag}")
tail = diff[-int(FPS * 2.5):]
print(f"last 2.5 s: mean change {tail.mean():.3f} (held end card), final frame index {len(frames) - 1}")
