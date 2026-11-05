"""Copy HyperFrames' bundled sound effects into a project and measure where each one actually hits.

    python sfx_meta.py --project . [--names pop,whoosh,notification,...]   # default: all bundled effects

Writes assets/sfx/*.mp3 and build/sfx_meta.json: duration, peak (loudest 10 ms frame), onset (first frame
within 20 dB of the peak), audible_end (last frame within 25 dB of the peak).

Why measure: HyperFrames' manifest describes effects loosely (it says the 10 s riser "peaks at the end";
its loudest point is at 3.5 s and it is silent after 4.3 s). lib/cues.mjs places each file so its peak
lands one frame after the picture, which needs the true numbers; use `mediaStart`/`duration` to play only
the audible part of a long file.
"""
import argparse
import json
import os
import shutil
import subprocess
from pathlib import Path

import numpy as np


def locate_bundle():
    for base in (os.environ.get("HF_REPO"), "/home/user/hyperframes", str(Path.home() / "hyperframes")):
        if base and (Path(base) / "skills/media-use/audio/assets/sfx").is_dir():
            return Path(base) / "skills/media-use/audio/assets/sfx"
    raise SystemExit("HyperFrames repo not found (set HF_REPO)")


def measure(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", "48000", "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, dtype=np.float32)
    hop = 480
    n = len(a) // hop
    db = 20 * np.log10(np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9)
    pk = int(db.argmax())
    loud = np.where(db > db.max() - 25)[0]
    return {"duration": round(len(a) / 48000, 3), "peak": round(pk * hop / 48000, 3),
            "onset": round(int(np.argmax(db > db.max() - 20)) * hop / 48000, 3),
            "audible_end": round((int(loud[-1]) + 1) * hop / 48000, 3),
            "peak_dbfs": round(float(20 * np.log10(np.abs(a).max() + 1e-9)), 1)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", default=".")
    ap.add_argument("--names")
    a = ap.parse_args()
    src = locate_bundle()
    proj = Path(a.project)
    (proj / "assets/sfx").mkdir(parents=True, exist_ok=True)
    names = a.names.split(",") if a.names else sorted(p.stem for p in src.glob("*.mp3"))
    meta = {}
    for n in names:
        f = src / f"{n}.mp3"
        if not f.exists():
            raise SystemExit(f"no bundled effect '{n}'. Available: {', '.join(sorted(p.stem for p in src.glob('*.mp3')))}")
        shutil.copy(f, proj / "assets/sfx" / f.name)
        meta[n] = measure(f)
    (proj / "build").mkdir(exist_ok=True)
    (proj / "build/sfx_meta.json").write_text(json.dumps(meta, indent=1))
    for n, m in meta.items():
        note = "  <- plays only its first part; set mediaStart/duration" if m["audible_end"] < m["duration"] - 1.0 else ""
        print(f"{n:18s} dur {m['duration']:5.2f}s  peak {m['peak']:5.2f}s  audible to {m['audible_end']:5.2f}s{note}")


if __name__ == "__main__":
    main()
