"""Voice every script line with ElevenLabs (Hale) and join them, with the script's pauses, into one take."""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(__file__)); import el
import numpy as np, soundfile as sf
S = {"stability": 0.5, "similarity_boost": 0.75, "style": 0.15, "use_speaker_boost": True}
SR = 44100
script = json.load(open("tools/script.json")); os.makedirs("el-lines", exist_ok=True)
parts = [np.zeros(int(0.35 * SR), np.float32)]
spoken = lambda t: t.replace("zogreo.org", "Zoh-GRAY-oh dot org").replace("Zogreo", "Zoh-GRAY-oh").replace("3.73", "three point seven three")
for l in script["lines"]:
    ok, err = el.tts(spoken(l["text"]), f"el-lines/{l['id']}.mp3", settings=S)
    if not ok: sys.exit(f"{l['id']} failed: {err}")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"el-lines/{l['id']}.mp3", "-ar", str(SR), "-ac", "1", f"el-lines/{l['id']}.wav"], check=True)
    a, _ = sf.read(f"el-lines/{l['id']}.wav", dtype="float32")
    parts += [a, np.zeros(int(l.get("pause", 0) * SR), np.float32)]
    print(l["id"], f"{len(a)/SR:.2f}s")
sf.write("el-lines/take.wav", np.concatenate(parts), SR, subtype="PCM_16")
