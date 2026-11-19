#!/usr/bin/env bash
# From the source song (assets/audio/song.m4a, Suno export with an embedded timed-lyrics track) to build/timing.json.
#   bash tools/prep.sh        (needs ffmpeg, node, and a Python with librosa: python3 -m venv /root/lv && /root/lv/bin/pip install librosa soundfile scipy)
set -euo pipefail
cd "$(dirname "$0")/.."
PY="${PY:-/root/lv/bin/python}"
ffmpeg -v error -y -i assets/audio/song.m4a -map 0:a:0 -ar 48000 -c:a pcm_s16le assets/audio/song.wav
ffmpeg -v error -y -i assets/audio/song.m4a -map 0:s:0 build/suno.srt
DO_NOT_TRACK=1 npx --yes hyperframes@0.8.223 beats assets/audio/song.wav --json > build/hf_beats.json
"$PY" -I tools/beats.py
"$PY" -I tools/align.py
"$PY" -I tools/synccheck.py
