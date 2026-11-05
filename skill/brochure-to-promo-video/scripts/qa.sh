#!/usr/bin/env bash
# One command for the whole pre-render quality pass on a HyperFrames promo project.
#
#   qa.sh <project> [--video renders/draft.mp4]
#
# Runs: lint, the full check gate (lint, runtime, layout, motion, contrast, craft, audio), the seam gate
# when ledger.json exists, snapshot --review (scene beats, a strip across each cut, phone-width sheet),
# and, given a rendered video, a pop scan and a loudness measurement. Prints the sheets to LOOK AT.
#
# A passing gate does not mean the film is good: read the sheets (references/review notes in SKILL.md).
set -uo pipefail
[ -f "${PROMO_HOME:-$HOME/promo-env}/env.sh" ] && source "${PROMO_HOME:-$HOME/promo-env}/env.sh"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJ="${1:?usage: qa.sh <project> [--video file.mp4]}"; shift || true
VIDEO=""; while [ $# -gt 0 ]; do case "$1" in --video) VIDEO="$2"; shift ;; esac; shift; done
cd "$PROJ" || exit 1
: "${HF_CLI:?run setup_env.sh first (HF_CLI is unset)}"; : "${TOOLS_PY:?TOOLS_PY is unset}"
export DO_NOT_TRACK=1 HYPERFRAMES_NO_TELEMETRY=1
mkdir -p build; rc=0

echo "### lint";  $HF_CLI lint 2>&1 | tail -6 || rc=1
echo "### check"; $HF_CLI check --json >build/check.json 2>/dev/null; node "$HERE/check_summary.mjs" build/check.json || rc=1

SEAM="$(ls "$HF_REPO"/.claude/skills/motion-doctrine/scripts/seam-gate.mjs "$HF_REPO"/.agents/skills/motion-doctrine/scripts/seam-gate.mjs 2>/dev/null | head -1)"
if [ -f ledger.json ] && [ -n "$SEAM" ]; then echo "### seam gate"; node "$SEAM" verify --ledger ledger.json --project . 2>&1 | tail -14 || rc=1
else echo "### seam gate: skipped (no ledger.json or the motion-doctrine script was not found)"; fi

echo "### snapshot --review"; $HF_CLI snapshot --review 2>&1 | grep -E "Beat sheet|Seam [0-9]+ at|Phone sheet" | sed 's/^ *//'
if [ -n "$VIDEO" ]; then
  echo "### file: $VIDEO"; ffprobe -v error -show_entries stream=codec_type,width,height,r_frame_rate,nb_frames,duration -of compact=p=0 "$VIDEO"
  echo "### loudness (social target about -16 to -14 LUFS, peak <= -1 dBFS)"
  ffmpeg -hide_banner -i "$VIDEO" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|LRA:|Peak:)"
  echo "### pop scan"; "$TOOLS_PY" -I "$HERE/popscan.py" "$VIDEO" $( [ -f build/events.json ] && echo --events build/events.json )
fi
echo; echo "LOOK AT the sheets above (Read the .jpg files) before calling this done. Measured is not the same as good."
exit $rc
