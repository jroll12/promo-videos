"""Write audio stems for adding music later: narration, effects, and the full mix, all the film's length.

    python tools/stems.py [--video renders/zogreo-intro-1080p.mp4]

Reads build/cues.json (every effect's file, start, trim and volume, as placed by tools/build.mjs) and
assets/vo/vo.wav. Writes renders/stems/{narration,effects,mix}.wav at 48 kHz. The mix comes from the rendered
video, so it is exactly what viewers hear; narration + effects is a rebuilt approximation of it.
"""
import argparse
import json
import subprocess
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument("--video")
a = ap.parse_args()
cues = json.load(open("build/cues.json"))
total = cues["total"]
out = Path("renders/stems")
out.mkdir(parents=True, exist_ok=True)

# mono to stereo by copying the channel (a plain -ac 2 upmix would drop it 3 dB, and the stems would no longer sum to the mix)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "assets/vo/vo.wav", "-af", f"apad,atrim=0:{total},pan=stereo|c0=c0|c1=c0", "-ar", "48000",
                str(out / "narration.wav")], check=True)

inputs, chains = [], []
for i, c in enumerate(cues["sfx"]):
    inputs += ["-i", f"assets/sfx/{c['f']}.mp3"]
    d = int(round(c["start"] * 1000))
    chains.append(f"[{i}:a]atrim=start={c['ms']}:duration={c['dur']},asetpts=PTS-STARTPTS,volume={c['vol']},adelay={d}|{d}[s{i}]")
mix = "".join(f"[s{i}]" for i in range(len(cues["sfx"])))
graph = ";".join(chains) + f";{mix}amix=inputs={len(cues['sfx'])}:normalize=0,apad,atrim=0:{total}[out]"
subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", graph, "-map", "[out]", "-ar", "48000", "-ac", "2",
                str(out / "effects.wav")], check=True)

if a.video:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.video, "-vn", "-ar", "48000", "-ac", "2", str(out / "mix.wav")], check=True)
for f in sorted(out.glob("*.wav")):
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)],
                               capture_output=True, text=True).stdout)
    print(f"{f}: {dur:.2f}s")

if a.video:
    # The renderer sets its master a little lower than narration + effects (about -1.3 dB on this film). Measure that gain
    # and apply it to the two stems, so stacking them in an editor reproduces the delivered mix.
    import numpy as np
    import soundfile as sf
    nar, sr = sf.read(out / "narration.wav", dtype="float32")
    fx, _ = sf.read(out / "effects.wav", dtype="float32")
    mx, _ = sf.read(out / "mix.wav", dtype="float32")
    n = min(len(nar), len(fx), len(mx))
    rec = (nar[:n] + fx[:n]).ravel()
    g = float(rec @ mx[:n].ravel() / (rec @ rec))
    for name, x in (("narration", nar), ("effects", fx)):
        sf.write(out / f"{name}.wav", x * g, sr, subtype="PCM_24")
    resid = 20 * np.log10(np.linalg.norm(g * rec - mx[:n].ravel()) / np.linalg.norm(mx[:n].ravel()))
    print(f"stems scaled by {20 * np.log10(g):+.2f} dB to match the rendered mix; narration + effects = mix within {resid:.1f} dB")
