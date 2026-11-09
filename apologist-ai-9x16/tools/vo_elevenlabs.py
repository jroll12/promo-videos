"""Narrate script.json with an ElevenLabs voice, one request per line, and assemble one take for `vo.py take`.

    python -I tools/vo_elevenlabs.py [--project .] [--voice dXtC3XhB9GtPusIpNtQx] [--model eleven_multilingual_v2]
                                     [--only L5,L9] [--seed 1031] [--out build/take_hale.wav]

Then:  vo.py take --audio build/take_hale.wav --voice-label "ElevenLabs Hale ..."   (alignment, loudness, report)

Why per line: each line can be regenerated alone (--only) when a word comes out wrong, and the script's own pauses
are kept exactly. `previous_text` / `next_text` (ElevenLabs request stitching) keep the intonation continuous across
the separately generated lines. Respellings from script.json "pronunciation" are applied to the text sent.

Reads the API key from ELEVENLABS_API_KEY and never prints it. Lines are cached in build/el/<id>.mp3 with the exact
text and settings they were made from (build/el/<id>.json); a line is only re-requested when those change or --only names it.
"""
import argparse
import json
import os
import ssl
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

SKILL_SCRIPTS = Path(os.environ.get("PROMO_SKILL_SCRIPTS", "/root/.claude/skills/synced/419bee16-7394-433e-af19-566f1083d85e_05656f75-9669-4d1c-af45-25e5b0462090/brochure-to-promo-video/scripts"))
sys.path.insert(0, str(SKILL_SCRIPTS))
import vo  # noqa: E402  (apply_respellings, speech_bounds)

SR = 48000


def tts(text, prev_text, next_text, a, speed):
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("ELEVENLABS_API_KEY is not set")
    body = {
        "text": text,
        "model_id": a.model,
        "voice_settings": {"stability": a.stability, "similarity_boost": a.similarity, "style": a.style, "use_speaker_boost": True, "speed": speed},
        "seed": a.seed,
    }
    if prev_text:
        body["previous_text"] = prev_text
    if next_text:
        body["next_text"] = next_text
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{a.voice}?output_format=mp3_44100_128",
        data=json.dumps(body).encode(), method="POST",
        headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"})
    ctx = ssl.create_default_context(cafile=os.environ.get("SSL_CERT_FILE") or None)
    try:
        with urllib.request.urlopen(req, timeout=180, context=ctx) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf8", "ignore")[:400]
        sys.exit(f"ElevenLabs HTTP {e.code}: {detail}")


def decode(mp3):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp3), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32).copy()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", default=".")
    ap.add_argument("--script", default="script.json")
    ap.add_argument("--voice", default="dXtC3XhB9GtPusIpNtQx")  # "Hale - Great for Commercials"
    ap.add_argument("--model", default="eleven_multilingual_v2")
    ap.add_argument("--stability", type=float, default=0.5)
    ap.add_argument("--similarity", type=float, default=0.75)
    ap.add_argument("--style", type=float, default=0.0)
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--seed", type=int, default=1031)
    ap.add_argument("--only", default="", help="comma-separated line ids to regenerate even if cached")
    ap.add_argument("--lead-in", type=float, default=0.35)
    ap.add_argument("--out", default="build/take_hale.wav")
    a = ap.parse_args()

    proj = Path(a.project)
    script = json.loads((proj / a.script).read_text())
    pron = script.get("pronunciation", {})
    lines = script["lines"]
    # "el_text" (optional, per line) is a delivery-only version of the line, e.g. commas that shape phrasing.
    # The words must stay the same: captions, alignment and the screen use "text".
    sent = [vo.apply_respellings(l.get("el_text", l["text"]), pron) for l in lines]
    for l in lines:
        if "el_text" in l and [w.strip(",.;:—") for w in l["el_text"].split()] != [w.strip(",.;:—") for w in l["text"].split()]:
            sys.exit(f"{l['id']}: el_text must have the same words as text (only punctuation may differ)")
    only = set(filter(None, a.only.split(",")))
    cache = proj / "build/el"
    cache.mkdir(parents=True, exist_ok=True)

    pieces = [np.zeros(int(a.lead_in * SR), np.float32)]
    total_words, total_speech = 0, 0.0
    for i, l in enumerate(lines):
        speed = l.get("el_speed", a.speed)  # per-line pacing override in script.json (ElevenLabs allows 0.7 to 1.2)
        meta = {"text": sent[i], "prev": sent[i - 1] if i else "", "next": sent[i + 1] if i + 1 < len(lines) else "",
                "voice": a.voice, "model": a.model, "stability": a.stability, "similarity": a.similarity, "style": a.style, "speed": speed, "seed": a.seed}
        mp3, mj = cache / f"{l['id']}.mp3", cache / f"{l['id']}.json"
        fresh = mp3.exists() and mj.exists() and json.loads(mj.read_text()) == meta and l["id"] not in only
        if not fresh:
            mp3.write_bytes(tts(meta["text"], meta["prev"], meta["next"], a, speed))
            mj.write_text(json.dumps(meta, indent=1, ensure_ascii=False))
        x = decode(mp3)
        s0, s1 = vo.speech_bounds(x, SR)
        x = x[max(0, int((s0 - 0.03) * SR)): int((s1 + 0.06) * SR)]
        n = len(l["text"].split())
        total_words += n
        total_speech += len(x) / SR
        print(f"{l['id']:>4} {'new ' if not fresh else 'kept'} {len(x) / SR:5.2f}s  {n / (len(x) / SR):4.2f} w/s  sent: {meta['text']}")
        pieces.append(x.astype(np.float32))
        if l.get("pause"):
            pieces.append(np.zeros(int(l["pause"] * SR), np.float32))
    take = np.concatenate(pieces)
    out = proj / a.out
    sf.write(out, take, SR, subtype="PCM_24")
    print(f"take: {out} {len(take) / SR:.2f}s · speech {total_speech:.2f}s · {total_words / total_speech:.2f} w/s overall")


if __name__ == "__main__":
    main()
