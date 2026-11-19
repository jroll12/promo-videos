#!/usr/bin/env bash
# Render this project (run from the project folder: 16x9 or 9x16).
#   bash tools/render.sh draft          -> renders/draft.mp4
#   bash tools/render.sh final          -> renders/<slug>-1080p.mp4 + poster
#   bash tools/render.sh draft 40 55    -> a span only
set -uo pipefail
MODE="${1:-draft}"; A="${2:-}"; B="${3:-}"
export DO_NOT_TRACK=1 HYPERFRAMES_NO_TELEMETRY=1
SLUG="$(basename "$(pwd)")"; mkdir -p renders
node tools/build.mjs || { echo "RENDER FAILED: build"; exit 1; }
SPAN=(); [ -n "$A" ] && SPAN=(--start "$A" --end "$B")
case "$MODE" in
  draft) OUT=renders/draft.mp4; npx --yes hyperframes@0.8.223 render . --quality draft --fps 30 "${SPAN[@]}" --output "$OUT" --quiet || { echo "RENDER FAILED"; exit 1; } ;;
  final) OUT="renders/$SLUG-1080p.mp4"; npx --yes hyperframes@0.8.223 render . --quality delivery --fps 30 --output "$OUT" --quiet || { echo "RENDER FAILED"; exit 1; }
         ffmpeg -v error -y -ss 6.4 -i "$OUT" -frames:v 1 "renders/$SLUG-poster.png" ;;
esac
ffprobe -v error -show_entries stream=codec_type,width,height,nb_frames,duration -of compact=p=0 "$OUT"
echo "RENDER DONE $OUT"
