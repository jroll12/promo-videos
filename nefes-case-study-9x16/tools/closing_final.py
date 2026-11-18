"""Round 5: the closing, with "dot org." never passed through speech-to-speech (it dropped "dot" twice).

    $TOOLS_PY tools/closing_final.py      # writes el-scenes/opt-D/close.wav

One speech-to-speech pass re-voices approved L11 + "Book a call, or give, at" (clear-"at" roll) + Jarret's raw name, ending on the
name. Then Jason's own "dot org." (closing-roll0.mp3 from 2.84 s; the recogniser hears exactly "Dot org" from there, and "...at zogreo" before it. Rounds 3 and 4 cut at 3.12 s, after "dot", which is why "dot" was missing) is joined after a short pause.
"""
import os, sys, numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import name_options_lib as L
dec, rms, sec, trim, fade, tone, sts, REF, SR = L.dec, L.rms, L.sec, L.trim, L.fade, L.tone, L.sts, L.REF, L.SR
c0 = dec("el-scenes/close.mp3"); g0 = dec("el-scenes/opt-B/closing-roll0.mp3")
ref = trim(dec(REF)); ref *= rms(sec(g0, 2.05, 2.84)) / rms(ref)
os.makedirs("el-scenes/opt-D", exist_ok=True)
out = "el-scenes/opt-D/close-sts.mp3"
if not os.path.exists(out):
    sts(np.concatenate([sec(c0, 0, 3.85), tone(0.5), trim(sec(g0, 0, 2.05)), fade(ref, 0.005, 0.03), tone(0.3)]), out)
r = trim(dec(out), floor=-50); r *= rms(sec(c0, 0, 3.85)) / rms(r)
dot = trim(sec(g0, 2.84, None), floor=-50); dot *= rms(r[-int(0.8 * SR):]) / rms(dot)  # same level as the name before it
y = np.concatenate([tone(0.05), fade(r, 0.01, 0.04), tone(0.14), fade(dot, 0.005, 0.04)])
sf.write("el-scenes/opt-D/close.wav", y.astype(np.float32), SR, subtype="FLOAT")
sf.write("el-scenes/opt-D/dot-org.wav", dot.astype(np.float32), SR, subtype="FLOAT")
print(f"close {len(y)/SR:.2f}s; 'dot org.' {len(dot)/SR:.2f}s")
