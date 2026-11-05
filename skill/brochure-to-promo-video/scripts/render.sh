#!/usr/bin/env bash
# Render a promo project. Rendering is slow without a GPU, so do it in the background and wait on the log.
#
#   render.sh <project> draft            # 1080-wide draft, about 2 min for 75 s: use it for QA and for the user to approve
#   render.sh <project> final [--preset portrait-4k]   # supersampled delivery render (about 10 min for 75 s on CPU),
#                                                     # then a 1080p copy, poster frame and a project zip
#
# Run with: bash render.sh <project> final > render.log 2>&1 &   then
#           until grep -q 'RENDER DONE\|RENDER FAILED' render.log; do sleep 10; done
# (a foreground `sleep N; cat` is blocked by the harness; an until-loop on the log is not)
set -uo pipefail
[ -f "${PROMO_HOME:-$HOME/promo-env}/env.sh" ] && source "${PROMO_HOME:-$HOME/promo-env}/env.sh"
PROJ="${1:?usage: render.sh <project> draft|final}"; MODE="${2:-draft}"; shift 2 || true
PRESET=portrait-4k; while [ $# -gt 0 ]; do case "$1" in --preset) PRESET="$2"; shift ;; esac; shift; done
cd "$PROJ" || exit 1; : "${HF_CLI:?run setup_env.sh first}"
export DO_NOT_TRACK=1 HYPERFRAMES_NO_TELEMETRY=1
SLUG="$(basename "$(pwd)")"; mkdir -p renders
# the 1080p copy keeps the preset's shape: landscape 1920x1080, square 1080x1080, otherwise portrait 1080x1920
case "$PRESET" in landscape*) OUTW=1920; OUTH=1080 ;; square*) OUTW=1080; OUTH=1080 ;; *) OUTW=1080; OUTH=1920 ;; esac
fail() { echo "RENDER FAILED: $*"; exit 1; }

case "$MODE" in
  draft)
    $HF_CLI render --quality draft --output renders/draft.mp4 || fail "draft"
    echo "RENDER DONE renders/draft.mp4" ;;
  final)
    $HF_CLI render --quality delivery --resolution "$PRESET" --fps 30 --output "renders/$SLUG-4k.mp4" || fail "delivery render"
    ffmpeg -v error -y -i "renders/$SLUG-4k.mp4" -vf "scale=${OUTW}:${OUTH}:flags=lanczos" -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p \
      -movflags +faststart -c:a copy "renders/$SLUG-1080p.mp4" || fail "1080p copy"
    ffmpeg -v error -y -ss 0 -i "renders/$SLUG-4k.mp4" -frames:v 1 "renders/$SLUG-poster-4k.png" || fail "poster"
    rm -f "renders/$SLUG-project.zip"
    # the zip must never carry credentials: .env files are excluded (an ElevenLabs key may live in .env.local)
    ( cd .. && zip -qr "$SLUG/renders/$SLUG-project.zip" "$SLUG" -x "$SLUG/renders/*" "$SLUG/.hyperframes/*" "$SLUG/build/vo_raw.wav" "$SLUG/build/check.json" "$SLUG/.env" "$SLUG/.env.*" "$SLUG/*/.env*" ) || fail "zip"
    for f in "renders/$SLUG-4k.mp4" "renders/$SLUG-1080p.mp4"; do
      echo "$f: $(ffprobe -v error -show_entries stream=codec_type,width,height,nb_frames,duration -of compact=p=0 "$f" | tr '\n' ' ')"; done
    echo "RENDER DONE renders/$SLUG-4k.mp4" ;;
  *) echo "usage: render.sh <project> draft|final"; exit 2 ;;
esac
