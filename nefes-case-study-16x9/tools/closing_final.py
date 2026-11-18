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
# Smoothing (round 6, "Zogreo comes on strong"): the last speech burst of r is "at Zogreo". Round 5 matched "dot org" to a window
# that included silence, so it came out 4 dB louder than the name. Now: speech level of the name measured on its loud frames;
# "dot org" set 1 dB under it; the name eased down 2 dB with raised-cosine ramps; a 60 ms soft attack where "at" starts after the pause.
hop = int(SR * 0.01)
def frames_db(x):
    k = len(x) // hop
    return 20 * np.log10(np.sqrt((x[: k * hop].reshape(k, hop) ** 2).mean(1)) + 1e-9)
fd = frames_db(r)
loud = fd > fd.max() - 25
idx = np.where(loud)[0]
runs, cur = [], [idx[0], idx[0]]
for i in idx[1:]:
    if i - cur[1] <= 8: cur[1] = i  # merge frames closer than 80 ms
    else: runs.append(cur); cur = [i, i]
runs.append(cur)
a0, a1 = runs[-1]  # "at Zogreo"
seg = r[a0 * hop:(a1 + 1) * hop]
name_rms = rms(seg[seg.size // 3:])  # the name, not the short "at"
r = r.copy()
att = int(0.06 * SR); r[a0 * hop: a0 * hop + att] *= 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, att))  # soft attack
i0, i1 = a0 * hop + seg.size // 3, (a1 + 1) * hop
env = np.ones(i1 - i0); k = min(int(0.08 * SR), len(env) // 2)
env *= 10 ** (-2 / 20); env[:k] = 1 - (1 - 10 ** (-2 / 20)) * (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, k)))
env[-k:] = 1 - (1 - 10 ** (-2 / 20)) * (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, k)))
r[i0:i1] *= env
name_rms *= 10 ** (-2 / 20)
dot = trim(sec(g0, 2.84, None), floor=-50); dot *= 10 ** (-1 / 20) * name_rms / rms(dot[: int(0.35 * SR)])  # level of "dot org" speech, 1 dB under the name
y = np.concatenate([tone(0.05), fade(r, 0.01, 0.04), tone(0.14), fade(dot, 0.005, 0.04)])
sf.write("el-scenes/opt-D/close.wav", y.astype(np.float32), SR, subtype="FLOAT")
sf.write("el-scenes/opt-D/dot-org.wav", dot.astype(np.float32), SR, subtype="FLOAT")
print(f"close {len(y)/SR:.2f}s; 'dot org.' {len(dot)/SR:.2f}s")
