"""Phase 0, step 2: forced alignment of lyrics.txt against the song with stable-ts (OpenAI whisper checkpoint, CPU).

    analysis/.venv/bin/python analysis/align_lyrics.py [--model small.en]

Two independent passes, so that agreement between them can be used as evidence:
  A. global   : the whole song against the whole lyric sheet
  B. windowed : each section's audio (its bars from timing.config.json, padded by one bar) against that section's lines only

Also runs a plain transcription (no lyrics given) so we can see whether the vocal actually says what lyrics.txt says.
Writes analysis/out/align.json. Deterministic: no sampling, fixed seed, pinned versions.
"""
import argparse
import json
import subprocess
from pathlib import Path

import torch
import stable_whisper

from lyrics import parse, norm_word

ap = argparse.ArgumentParser()
ap.add_argument("--model", default="small.en")
ap.add_argument("--only-free", action="store_true", help="reuse passes A and B from align.json, redo only the free transcription")
a = ap.parse_args()

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "analysis" / "out"
CFG = json.loads((ROOT / "timing.config.json").read_text())
BEATS = json.loads((OUT / "beats.json").read_text())
torch.manual_seed(0)
torch.set_num_threads(4)

period = BEATS["tempo"]["periodSec"]
offset = BEATS["tempo"]["offsetSec"] + CFG["grid"]["manualOffsetSec"]
bar0 = offset + CFG["grid"]["barPhase"] * period
bar_len = period * CFG["beatsPerBar"]
duration = BEATS["audio"]["duration"]

wav = OUT / "song_16k_mono.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(ROOT / CFG["audio"]), "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", str(wav)], check=True)

sections = parse(ROOT / CFG["lyrics"])
model = stable_whisper.load_model(a.model, device="cpu", download_root=str(ROOT / "analysis" / ".cache"))


def pack(result, lines, shift=0.0):
    """Map aligned segments back onto lyric lines. original_split keeps one segment per input line."""
    segs = result.segments
    out = []
    if len(segs) != len(lines):
        print(f"  ! {len(segs)} segments for {len(lines)} lines; matching by order")
    for ln, seg in zip(lines, segs):
        words = [{"w": w.word.strip(), "start": round(w.start + shift, 3), "end": round(w.end + shift, 3), "p": round(float(w.probability or 0), 3)}
                 for w in seg.words]
        out.append({"id": ln["id"], "start": round(seg.start + shift, 3), "end": round(seg.end + shift, 3), "words": words})
    return out


def align(audio, lines):
    text = "\n".join(l["text"] for l in lines)
    return model.align(str(audio), text, language="en", original_split=True, verbose=None)


all_lines = [l for s in sections for l in s["lines"]]

by_id = {s["id"]: s for s in sections}


def window(sc):
    t0 = max(0.0, bar0 + (sc["startBar"] - 1) * bar_len) if sc["startBar"] > 0 else 0.0
    t1 = min(duration, bar0 + (sc["startBar"] + sc["bars"] + 1) * bar_len)
    clip = OUT / f"win_{sc['id']}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t0:.4f}", "-t", f"{t1 - t0:.4f}", "-i", str(wav), "-c:a", "pcm_s16le", str(clip)], check=True)
    return clip, t0, t1


if a.only_free:
    prev = json.loads((OUT / "align.json").read_text())
    res_a, res_b = prev["global"], prev["windowed"]
else:
    print("pass A: global")
    res_a = pack(align(wav, all_lines), all_lines)
    print("pass B: windowed")
    res_b = []
    for sc in CFG["sections"]:
        clip, t0, t1 = window(sc)
        lines = by_id[sc["id"]]["lines"]
        res_b += pack(align(clip, lines), lines, shift=t0)
        print(f"  {sc['id']}: window {t0:.2f}..{t1:.2f}")

# Pass C: free transcription, lyrics not given. Corroboration only: it never sets a timestamp.
# Two runs, pooled, because each one alone has holes on this song:
#   whole  : the full song with whisper's default gates. It drops whole 30 s windows of fast rap as "no speech".
#   section: one run per section window with the no-speech and log-probability gates off, which recovers the verses
#            but can return nothing useful for a window that starts mid-phrase.
print("pass C: free transcription (lyrics not given), whole song + per section")
free, free_segments = [], []


def keep(tr, label, shift=0.0):
    for seg in tr.segments:
        free_segments.append({"section": label, "start": round(seg.start + shift, 2), "end": round(seg.end + shift, 2), "text": seg.text.strip()})
        for w in seg.words:
            for part in w.word.replace("-", " ").split():
                if norm_word(part):
                    free.append({"section": label, "w": norm_word(part), "start": round(w.start + shift, 3), "end": round(w.end + shift, 3),
                                 "p": round(float(w.probability or 0), 3)})


keep(model.transcribe(str(wav), language="en", verbose=None, temperature=0.0, condition_on_previous_text=False), "whole")
for sc in CFG["sections"]:
    clip, t0, t1 = window(sc)
    keep(model.transcribe(str(clip), language="en", verbose=None, temperature=0.0, condition_on_previous_text=False,
                          no_speech_threshold=None, logprob_threshold=None, compression_ratio_threshold=None), sc["id"], t0)

(OUT / "align.json").write_text(json.dumps({"model": a.model, "global": res_a, "windowed": res_b, "free": free, "freeSegments": free_segments}, indent=1))
print("wrote", OUT / "align.json")
