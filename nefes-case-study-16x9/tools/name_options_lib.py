"""(helpers) Build the two candidate narrations for the name fix (Round 3). Every join is in silence, or inside a phrase re-voiced whole.

    $TOOLS_PY tools/name_options.py     # writes el-scenes/opt-A/, el-scenes/opt-B/ (pilot.wav, close.wav), and auditions/

Pilot (both options): the line becomes "So we ran a pilot." A fresh Jason take of that sentence replaces the first sentence
of the approved pilot take, joined in the 0.3 s silence before "Our AI" (pilot-orig.wav 2.31 to 2.62 s). The rest is untouched.

Closing, option A ("clean silences"): "Book a call, or give. ... Zogreo dot org."
  approved close take up to the end of "give" (5.33 s), a pause of room tone, Jarret's word re-voiced as Jason
  (assets/brand/pronunciation/zogreo-word-jason.mp3), a short pause, then "dot org." from the approved take (from the closure
  before "dot", 6.62 s).
Closing, option B ("re-voice the whole phrase"): a guide clip of the approved "Book a call, or give, at" + Jarret's own raw
  recording of the name + the approved "dot org.", re-spoken whole as Jason by ElevenLabs speech-to-speech, so "at" and the name
  join as one breath. It replaces the take from the silence before "Book" (3.85 s).
"""
import json
import os
import subprocess
import sys
import urllib.request
import uuid

import numpy as np
import soundfile as sf

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
sys.path.insert(0, HERE)
import el  # noqa: E402

os.chdir(ROOT)
REF = "../zogreo-intro-9x16/assets/brand/pronunciation/Zogreo_Correct_Pronunciation.m4a"
WORD = "assets/brand/pronunciation/zogreo-word-jason.mp3"
SET = {"stability": 0.5, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": True}


def dec(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


rms = lambda x: np.sqrt((x ** 2).mean()) + 1e-12
sec = lambda x, a, b: x[int(a * SR):int(b * SR)] if b is not None else x[int(a * SR):]
bed0 = dec("el-scenes/roomtone.wav")
tone = lambda s: np.resize(bed0, int(s * SR))


def trim(x, floor=-45, keep=0.03):
    """Cut leading and trailing quiet (relative to the peak frame) but keep a few ms of the edges."""
    hop = int(SR * 0.01)
    n = len(x) // hop
    db = 20 * np.log10(np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-12)
    on = np.where(db > db.max() + floor)[0]
    return x[max(0, on[0] * hop - int(keep * SR)): min(len(x), (on[-1] + 1) * hop + int(keep * SR))]


def fade(x, a=0.01, b=0.01):
    x = x.copy()
    ka, kb = int(a * SR), int(b * SR)
    if ka: x[:ka] *= np.sin(np.linspace(0, np.pi / 2, ka))
    if kb: x[-kb:] *= np.cos(np.linspace(0, np.pi / 2, kb))
    return x


def join(*parts):
    """Concatenate pieces that start and end in quiet, each with a 10 ms fade, over room tone so the floor never drops out."""
    out = np.concatenate([fade(p) for p in parts])
    return out + np.resize(bed0, len(out)) * 0.0 + 0  # pieces already carry their own floor; tone parts are explicit


def sts(guide, out_mp3):
    """ElevenLabs speech-to-speech into the Jason voice (el.VOICE)."""
    wav = out_mp3.replace(".mp3", "-guide.wav")
    sf.write(wav, guide.astype(np.float32), SR, subtype="PCM_16")
    b = uuid.uuid4().hex
    body = b"".join([
        f"--{b}\r\nContent-Disposition: form-data; name=\"model_id\"\r\n\r\neleven_multilingual_sts_v2\r\n".encode(),
        f"--{b}\r\nContent-Disposition: form-data; name=\"voice_settings\"\r\n\r\n{json.dumps(SET)}\r\n".encode(),
        f"--{b}\r\nContent-Disposition: form-data; name=\"audio\"; filename=\"guide.wav\"\r\nContent-Type: audio/wav\r\n\r\n".encode(),
        open(wav, "rb").read(), f"\r\n--{b}--\r\n".encode()])
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/speech-to-speech/{el.VOICE}?output_format=mp3_44100_128", data=body, method="POST",
                                 headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Content-Type": f"multipart/form-data; boundary={b}"})
    with urllib.request.urlopen(req, timeout=180) as r:
        open(out_mp3, "wb").write(r.read())


