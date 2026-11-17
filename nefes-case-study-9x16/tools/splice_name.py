"""Replace the spoken name in the two takes that say it with Jarret's own pronunciation, re-voiced as Jason.

    $TOOLS_PY tools/splice_name.py          # writes el-scenes/pilot.wav and el-scenes/close.wav; then run el_scenes.py

Why: text-to-speech could not reproduce Jarret's recording of "Zogreo". The word file
assets/brand/pronunciation/zogreo-word-jason.mp3 is his reference re-voiced in the Jason voice with ElevenLabs
speech-to-speech (made for the other Zogreo promo, branch claude/zogreo-promo-video-ecah3u, where Jarret approved it).
Method copied from that branch's tools/splice_zogreo_sts.py: no stretch, no EQ, level matched to the word it replaces,
room tone under it, 25 ms equal-power crossfade in and 15 ms out. Everything else in each take is untouched.

Cut points are read off each take's loudness contour (10 ms frames), at the quiet dips either side of the word:
  pilot  (el-scenes/pilot-orig.wav, "So at Zogreo, we ran a pilot."): 0.335 s (after "at", its t kept) to 1.26 s (before the comma pause)
  close  (el-scenes/close.mp3, "... or give, at zogreo.org."):        5.66 s (onset of the name) to 6.63 s (the closure before "dot")
A new roll of either take moves these points: re-read the contour (see REVIEW.md) before re-running.
"""
import os
import subprocess

import numpy as np
import soundfile as sf

SR = 44100
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
WORD = "assets/brand/pronunciation/zogreo-word-jason.mp3"
W0, W1 = 0.055, 0.85  # the word file's speech span, before its breath tail (as on the other branch)
TAKES = [("el-scenes/pilot-orig.wav", 0.335, 1.26, "el-scenes/pilot.wav"), ("el-scenes/close.mp3", 5.66, 6.63, "el-scenes/close.wav")]


def dec(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(ROOT, p), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


rms = lambda x: np.sqrt((x ** 2).mean()) + 1e-12
ramp = lambda k: (np.sin(np.linspace(0, np.pi / 2, k)), np.cos(np.linspace(0, np.pi / 2, k)))

word0 = dec(WORD)[int(W0 * SR):int(W1 * SR)]
bed0 = dec("el-scenes/roomtone.wav")
for src, A, B, out in TAKES:
    x = dec(src)
    old = x[int(A * SR):int(B * SR)]
    w = word0 * (rms(old) / rms(word0))  # the replaced word's loudness
    k = int(0.030 * SR)
    w[-k:] *= ramp(k)[1]  # the word's own tail fades into the room tone
    bed = np.resize(bed0, len(w))
    f = int(0.02 * SR)
    bed[:f] *= ramp(f)[0]
    bed[-f:] *= ramp(f)[1]
    w = w + bed
    pre, post = x[:int(A * SR)], x[int(B * SR):]
    xi, xo = int(0.025 * SR), int(0.015 * SR)
    si, ci = ramp(xi)
    so, co = ramp(xo)
    mid = np.concatenate([pre[:-xi], pre[-xi:] * ci + w[:xi] * si, w[xi:]])
    y = np.concatenate([mid[:-xo], mid[-xo:] * co + post[:xo] * so, post[xo:]])
    sf.write(os.path.join(ROOT, out), np.clip(y, -1, 1).astype(np.float32), SR, subtype="FLOAT")
    print(f"{out}: replaced {B - A:.3f} s with {len(w) / SR:.3f} s (take {len(x) / SR:.2f} -> {len(y) / SR:.2f} s); level x{rms(old) / rms(word0):.2f}")
