"""Minimal ElevenLabs text-to-speech call. The key is read from ELEVENLABS_API_KEY and never printed or stored."""
import json, os, urllib.error, urllib.request

VOICE = "Gfpl8Yo74Is0W6cPUWWT"  # "Max - Elearning and Documentary", chosen by Jarret (earlier: Hale dXtC3XhB9GtPusIpNtQx)


def tts(text, out_mp3, voice=VOICE, model="eleven_v4", settings=None):
    body = {"text": text, "model_id": model}
    if settings:
        body["voice_settings"] = settings
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128",
        data=json.dumps(body).encode(), method="POST",
        headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            open(out_mp3, "wb").write(r.read())
        return True, ""
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}: {e.read().decode()[:300]}"
