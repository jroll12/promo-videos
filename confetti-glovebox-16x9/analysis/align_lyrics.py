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

print("pass A: global")
res_a = pack(align(wav, all_lines), all_lines)

print("pass B: windowed")
res_b = []
by_id = {s["id"]: s for s in sections}
for sc in CFG["sections"]:
    t0 = max(0.0, bar0 + (sc["startBar"] - 1) * bar_len) if sc["startBar"] > 0 else 0.0
    t1 = min(duration, bar0 + (sc["startBar"] + sc["bars"] + 1) * bar_len)
    clip = OUT / f"win_{sc['id']}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t0:.4f}", "-t", f"{t1 - t0:.4f}", "-i", str(wav), "-c:a", "pcm_s16le", str(clip)], check=True)
    lines = by_id[sc["id"]]["lines"]
    res_b += pack(align(clip, lines), lines, shift=t0)
    print(f"  {sc['id']}: window {t0:.2f}..{t1:.2f}")

print("pass C: free transcription (lyrics not given)")
tr = model.transcribe(str(wav), language="en", verbose=None, temperature=0.0, condition_on_previous_text=False)
free = [{"w": norm_word(w.word), "start": round(w.start, 3), "end": round(w.end, 3), "p": round(float(w.probability or 0), 3)}
        for seg in tr.segments for w in seg.words if norm_word(w.word)]
free_segments = [{"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()} for s in tr.segments]

(OUT / "align.json").write_text(json.dumps({"model": a.model, "global": res_a, "windowed": res_b, "free": free, "freeSegments": free_segments}, indent=1))
print("wrote", OUT / "align.json")
