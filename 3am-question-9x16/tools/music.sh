#!/usr/bin/env bash
# Song (Jarret's Suno track "Warm Hope") aligned to the film:
# delay 1.1 s so the big hit (~15.79 s in source) lands on the Give scene at 16.9 s,
# 40 ms fade in, tail fade, pad to exactly 21.9 s.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=assets/music/song-source.m4a
mkdir -p build
ffmpeg -v error -y -i "$SRC" -vn -ac 2 -ar 44100 \
  -af "adelay=1100|1100,afade=t=in:st=1.1:d=0.04,afade=t=out:st=20.2:d=0.77,apad=whole_dur=21.9,atrim=0:21.9" \
  -c:a pcm_s16le build/music-aligned.wav
ffprobe -v error -show_entries format=duration -of csv=p=0 build/music-aligned.wav
