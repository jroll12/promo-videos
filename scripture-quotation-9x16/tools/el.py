"""Minimal ElevenLabs calls. The key is read from ELEVENLABS_API_KEY and never printed or stored."""
import base64, json, os, urllib.error, urllib.request

VOICE = "ILP9IN5fT2Jr2fSfmoNh"  # "Jason - Friendly and Approachable" (house voice, see CLAUDE.md)


def _post(url, body, timeout=180):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST",
                                 headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def tts(text, out_mp3, voice=VOICE, model="eleven_v4", settings=None):
    """Speech plus character timings: writes out_mp3 and out_mp3 + '.align.json' (the request text and per-character times)."""
    body = {"text": text, "model_id": model}
    if settings:
        body["voice_settings"] = settings
    try:
        d = json.loads(_post(f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128", body))
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}: {e.read().decode()[:300]}"
    open(out_mp3, "wb").write(base64.b64decode(d["audio_base64"]))
    json.dump({"text": text, "alignment": d.get("alignment"), "normalized_alignment": d.get("normalized_alignment")},
              open(out_mp3 + ".align.json", "w"), ensure_ascii=False)
    return True, ""


def music(prompt, out_mp3, ms):
    try:
        audio = _post("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128",
                      {"prompt": prompt, "music_length_ms": int(ms)}, timeout=600)
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}: {e.read().decode()[:400]}"
    open(out_mp3, "wb").write(audio)
    return True, ""
