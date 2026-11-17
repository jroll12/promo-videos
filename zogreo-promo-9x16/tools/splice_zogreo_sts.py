#!/usr/bin/env python3
"""STS VARIANT: the word is the user's reference re-voiced in the narrator's voice (ElevenLabs speech-to-speech), so it is NOT stretched or EQ'd; only level-matched.
Rebuild assets/vo/narration-zogreo.mp3: original narration with the word 'Zogreo' replaced by the
user's reference recording, tone-matched to the narration voice, with a room-tone bed and soft joins.
usage: splice_zogreo.py ORIGINAL_16BIT_MONO_44K_WAV REFERENCE_16BIT_MONO_44K_WAV OUT_WAV
"""
import sys, wave, json, numpy as np
sr = 44100
def rd(f):
    w = wave.open(f); return np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(float) / 32768
n, r = rd(sys.argv[1]), rd(sys.argv[2])
A, B = 30.650, 31.270                    # cut points in the original (quiet dips either side of the word)
r0, r1 = 0.055, 0.85                    # speech span of the reference, ending before its room/breath tail
TARGET = 0.66                             # word length so the joins' crossfades leave 'dot' exactly where the narrator put it
GAP = 0.0                                 # no added silence: the narrator's own dip before "dot" follows
sec = lambda x, a, b: x[int(a * sr):int(b * sr)]
rms = lambda x: np.sqrt((x ** 2).mean())
db = lambda x: 20 * np.log10(rms(x) + 1e-9)
def bands(x):
    X = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2; f = np.fft.rfftfreq(len(x), 1 / sr)
    e = [80, 200, 400, 800, 1600, 3200, 6400, 12000]; c = [np.sqrt(a * b) for a, b in zip(e[:-1], e[1:])]
    return c, np.array([10 * np.log10(X[(f >= a) & (f < b)].sum() + 1e-12) for a, b in zip(e[:-1], e[1:])])
# 1) tone match: move the reference's average spectrum 70% of the way (capped at 6 dB) to the narration's speech spectrum
ref = sec(r, r0, r1).copy()
# 0) pace: rubberband time-stretch, pitch and formants kept, so only the speed changes
import subprocess, tempfile, os
td = tempfile.mkdtemp()
def wr(x, f):
    w = wave.open(f, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
wr(ref, td + '/a.wav'); tempo = 1.0
print('no stretch: %.3f s' % (len(ref) / sr))
c, bn = bands(sec(n, 29.5, 30.55)); _, br = bands(ref)
gain_db = np.clip(0.0 * (bn - br), -6, 6); print("EQ gain dB per band:", np.round(gain_db, 1))
X = np.fft.rfft(ref); f = np.fft.rfftfreq(len(ref), 1 / sr)
g = 10 ** (np.interp(np.log(np.maximum(f, 1)), np.log(c), gain_db) / 20); ref = np.fft.irfft(X * g, len(ref))
# 2) level: match the replaced word's loudness
orig_word = sec(n, A, B); ref *= rms(orig_word) / rms(ref)
# 3) room tone from a pause in the narration, laid under the word so the noise floor does not drop out
tone = sec(n, 22.999, 23.40); tone = tone[int(.02 * sr):-int(.02 * sr)]
print("room tone dB %.1f" % db(tone))
def fin(x, k):  x = x.copy(); x[:k] *= np.sin(np.linspace(0, np.pi / 2, k)); return x
def fout(x, k): x = x.copy(); x[-k:] *= np.cos(np.linspace(0, np.pi / 2, k)); return x
gap = int(GAP * sr)
ref = fout(ref, int(.030 * sr))
word = np.concatenate([ref, np.zeros(gap)])
bed = np.tile(tone, int(np.ceil(len(word) / len(tone)) + 1))[:len(word)]
bed = fin(fout(bed, int(.02 * sr)), int(.02 * sr)); word = word + bed
# 4) joins: 25 ms equal-power crossfade into the word; the word's tail already sits in the natural dip before 'dot'
xf = int(.025 * sr); cs = np.cos(np.linspace(0, np.pi / 2, xf)); sn = np.sin(np.linspace(0, np.pi / 2, xf))
pre, post = n[:int(A * sr)], n[int(B * sr):]
mid = np.concatenate([pre[:-xf], pre[-xf:] * cs + word[:xf] * sn, word[xf:]])
x2 = int(.015 * sr); c2 = np.cos(np.linspace(0, np.pi / 2, x2)); s2 = np.sin(np.linspace(0, np.pi / 2, x2))
out = np.concatenate([mid[:-x2], mid[-x2:] * c2 + post[:x2] * s2, post[x2:]]); out = np.clip(out, -1, 1)
w = wave.open(sys.argv[3], 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((out * 32767).astype('<i2').tobytes()); w.close()
delta = (len(out) - len(n)) / sr; print("word %.3f s (+gap) vs original %.3f s; delta %.3f; total %.3f s" % (len(word) / sr, B - A, delta, len(out) / sr))
json.dump({"delta": delta, "total": len(out) / sr}, open(sys.argv[3] + ".json", "w"))
