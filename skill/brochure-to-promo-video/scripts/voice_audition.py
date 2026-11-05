"""Render the same passage in every available voice, level-matched, so a PERSON can choose.

    python voice_audition.py --script script.json [--lines L5,L9] --out auditions
        [--kokoro-voices am_michael,am_adam,am_eric,af_heart] [--piper all|name,name]
        [--api http://127.0.0.1:8765 --vs-engines omnivoice,supertonic3,kittentts]

Candidates: every Piper voice directory in $PROMO_MODELS, the chosen Kokoro voices, and (when VoiceStudio
is running and can reach its model hosts) VoiceStudio engines such as OmniVoice. Engines that cannot
start are listed with the reason instead of failing the run.

This tool deliberately does not rank voices. In the Zogreo run an automatic naturalness score (UTMOS) put
a Piper voice at the top, and it sounded flat and synthetic to the people who listened. The audition's job
is to put clips in the user's ears before anything is built on them. Send the mp3s; wait for a choice.
"""
import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import scipy.signal as sps
import soundfile as sf

sys.path.insert(0, str(Path(__file__).parent))
import vo  # noqa: E402  (DirectTTS, apply_respellings, http)

SR = 24000


def kokoro_speakers(model_dir):
    """speaker name -> id, read from the model's embedded metadata."""
    b = (Path(model_dir) / "model.onnx").read_bytes()
    m = re.search(rb"(0->[a-z]{2}_[a-z]+(?:,\d+->[a-z]{2}_[a-z]+)+)", b)
    return {n: int(i) for i, n in re.findall(r"(\d+)->([a-z]{2}_[a-z]+)", m.group(1).decode())} if m else {}


def piper_license(d):
    card = next(iter(Path(d).glob("MODEL_CARD*")), None)
    if card:
        for line in card.read_text(errors="ignore").splitlines():
            if "icense" in line:
                return line.strip("* ").replace("License:", "").strip()[:60]
    return "see model card"


def finish(parts, out, name):
    a = np.concatenate(parts).astype(np.float32)
    a = a * 10 ** ((-16 - pyln.Meter(SR).integrated_loudness(a)) / 20)
    sf.write(out / f"{name}.wav", np.clip(a, -0.89, 0.89), SR, subtype="PCM_16")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(out / f"{name}.wav"), "-c:a", "libmp3lame", "-b:a", "160k", str(out / f"{name}.mp3")], check=True)
    (out / f"{name}.wav").unlink()
    return len(a) / SR


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--script", default="script.json")
    ap.add_argument("--lines", help="comma-separated line ids to audition (default: lines containing a product term, else the first two)")
    ap.add_argument("--out", default="auditions")
    ap.add_argument("--models", default=os.environ.get("PROMO_MODELS", str(Path.home() / "promo-env/models")))
    ap.add_argument("--piper", default="all", help="all | none | comma-separated voice names, e.g. en_US-joe-medium")
    ap.add_argument("--kokoro-voices", default="am_michael,am_adam,am_eric,af_heart")
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--api")
    ap.add_argument("--vs-engines", default="")
    a = ap.parse_args()

    script = json.loads(Path(a.script).read_text())
    pron = script.get("pronunciation", {})
    by_id = {l["id"]: l for l in script["lines"]}
    if a.lines:
        chosen = [by_id[i] for i in a.lines.split(",")]
    else:
        hits = [l for l in script["lines"] if any(re.search(rf"(?<!\w){re.escape(k)}(?!\w)", l["text"], re.I) for k in pron if not vo.NUMBER_KEY.match(k))]
        chosen = (hits or script["lines"])[:2]
    texts = [l["text"] for l in chosen]
    words = sum(len(t.split()) for t in texts)
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    gap = np.zeros(int(0.7 * SR), np.float32)
    rows, failed = [], []

    def add_direct(name, engine, voice, tts, lic):
        parts = []
        for t in texts:
            x, sr = tts(vo.apply_respellings(t, pron))
            parts += [sps.resample_poly(x, SR, sr).astype(np.float32) if sr != SR else x, gap]
        rows.append((name, engine, voice, lic, finish(parts[:-1], out, name)))
        print(f"  {name}")

    models = Path(a.models)
    if a.piper != "none":
        want = None if a.piper == "all" else {f"vits-piper-{n}" for n in a.piper.split(",")}
        for d in sorted(models.glob("vits-piper-*")):
            if want is None or d.name in want:
                add_direct(f"piper_{d.name[len('vits-piper-'):]}", "Piper via sherpa-onnx", d.name[len("vits-piper-"):], vo.DirectTTS(d, 0, a.speed), piper_license(d))
    kd = models / "kokoro-multi-lang-v1_0"
    if a.kokoro_voices and kd.exists():
        spk = kokoro_speakers(kd)
        for v in a.kokoro_voices.split(","):
            if v in spk:
                add_direct(f"kokoro_{v}", "Kokoro v1.0 via sherpa-onnx", v, vo.DirectTTS(kd, spk[v], a.speed), "Apache-2.0 model")
            else:
                failed.append((f"kokoro_{v}", "no such voice in this model"))
    for eng in filter(None, a.vs_engines.split(",")):
        if not a.api:
            failed.append((eng, "pass --api to audition VoiceStudio engines"))
            continue
        try:
            parts = []
            for t in texts:
                wav, _ = vo.http("POST", f"{a.api}/generate", form={"text": t, "engine": eng, "language": "en", "speed": a.speed, "effect_preset": "raw",
                                                                     "wav_bits": "16", "max_chunk_chars": "0", "pronounce": "true"}, timeout=900)
                p = out / f"_{eng}.wav"
                p.write_bytes(wav)
                x, sr = sf.read(p, dtype="float32", always_2d=True)
                x = x.mean(axis=1)
                parts += [sps.resample_poly(x, SR, sr).astype(np.float32) if sr != SR else x, gap]
                p.unlink()
            rows.append((f"voicestudio_{eng}", f"VoiceStudio {eng}", "engine default", "see engine licence", finish(parts[:-1], out, f"voicestudio_{eng}")))
            print(f"  voicestudio_{eng}")
        except Exception as e:  # engine unavailable (model host blocked, licence not accepted, no GPU...)
            detail = getattr(e, "read", lambda: b"")().decode("utf8", "ignore")[:300] or str(e)
            failed.append((f"voicestudio_{eng}", detail))

    md = ["# Voice audition", "", "Passage (same for every clip, 0.7 s between sentences):", ""] + [f"> {t}" for t in texts]
    md += ["", "| clip | engine | voice | licence | seconds | words/s (incl. gap) |", "|---|---|---|---|---|---|"]
    md += [f"| {n}.mp3 | {e} | {v} | {lic} | {d:.1f} | {words / d:.2f} |" for n, e, v, lic, d in rows]
    if failed:
        md += ["", "Could not render:", ""] + [f"- {n}: {why}" for n, why in failed]
    md += ["", "Level-matched to -16 LUFS. Not ranked on purpose: send these to the user and wait for their choice."]
    (out / "audition.md").write_text("\n".join(md) + "\n")
    print("\n".join(md[md.index("| clip | engine | voice | licence | seconds | words/s (incl. gap) |"):]))


if __name__ == "__main__":
    main()
