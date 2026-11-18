"""Round 4: re-voice the WHOLE closing scene (L11 + L12) in one speech-to-speech pass, so the voice is continuous.

    $TOOLS_PY tools/closing_whole.py [--gap 0.18]      # writes el-scenes/opt-C/close-g<gap>.wav (one per gap)

Guide = approved L11 ("Our AI doesn't replace the team. It multiplies them.") + the clear-"at" roll of "Book a call, or give, at ...
dot org." with its name replaced by Jarret's raw recording, plus a pause of `gap` seconds between the name and "dot" so the
re-voicing keeps the word. Round 3 option B lost "dot" because the name ran straight into it.
"""
import os, sys, subprocess, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import name_options_lib as L
import argparse
ap = argparse.ArgumentParser(); ap.add_argument("--gap", type=float, nargs="+", default=[0.18, 0.32]); a = ap.parse_args()
dec, rms, sec, trim, fade, tone, sts, REF = L.dec, L.rms, L.sec, L.trim, L.fade, L.tone, L.sts, L.REF
SR = L.SR
c0 = dec("el-scenes/close.mp3")
g0 = dec("el-scenes/opt-B/closing-roll0.mp3")
l11 = sec(c0, 0, 3.85)                                  # approved "Our AI doesn't replace the team. It multiplies them."
ref = trim(dec(REF)); ref *= rms(sec(g0, 2.05, 3.12)) / rms(ref)
os.makedirs("el-scenes/opt-C", exist_ok=True)
for gap in a.gap:
    out = f"el-scenes/opt-C/close-g{int(gap*100):02d}.mp3"
    guide = np.concatenate([l11, tone(0.5), trim(sec(g0, 0, 2.05)), fade(ref, 0.005, 0.01), tone(gap), sec(g0, 3.12, None)])
    if not os.path.exists(out): sts(guide, out)
    r = trim(dec(out)); r *= rms(sec(c0, 0, 3.85)) / rms(r)
    sf.write(out.replace(".mp3", ".wav"), np.concatenate([tone(0.05), fade(r, 0.01, 0.03)]).astype(np.float32), SR, subtype="FLOAT")
    print(out, f"{len(r)/SR:.2f}s")
