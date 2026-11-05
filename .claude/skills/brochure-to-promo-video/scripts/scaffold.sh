#!/usr/bin/env bash
# Create a promo project: a vertical HyperFrames project plus this skill's build library and templates.
#
#   scaffold.sh <slug> [--parent DIR] [--landscape]     (default vertical 1080 x 1920; --landscape is 1920 x 1080)
#
# Result: <parent>/<slug>-promo/ with
#   tools/cues.mjs        shared build library (copied in, so the project zips up self-contained)
#   tools/build.mjs       the product-specific build: edit it (see examples/zogreo/build.mjs)
#   src/                  scene templates (src/intro.html is a minimal working scene)
#   script.json           narration lines, caption phrase breaks, pronunciations
#   brand/                the brochure extraction, if ./brand exists next to the project (so it ships in the zip)
#   assets/vendor/gsap    GSAP vendored locally (the CDN is blocked in many sandboxes)
#   assets/sfx, build/sfx_meta.json   HyperFrames' bundled effects with measured peaks
#   SPEC.md STORYLINES.md RESEARCH.md REVIEW.md   documents to fill in as you go
set -uo pipefail
[ -f "${PROMO_HOME:-$HOME/promo-env}/env.sh" ] && source "${PROMO_HOME:-$HOME/promo-env}/env.sh"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; SKILL="$(dirname "$HERE")"
SLUG="${1:?usage: scaffold.sh <slug> [--parent DIR] [--landscape]}"; shift || true
PARENT="$PWD"; RES=portrait
while [ $# -gt 0 ]; do case "$1" in --parent) PARENT="$2"; shift ;; --landscape) RES=landscape ;; esac; shift; done
: "${HF_CLI:?run setup_env.sh first}"; : "${HF_REPO:?HF_REPO is unset}"; : "${TOOLS_PY:?TOOLS_PY is unset}"
export DO_NOT_TRACK=1 HYPERFRAMES_NO_TELEMETRY=1 HYPERFRAMES_SKIP_SKILLS=1
NAME="$SLUG-promo"; DIR="$PARENT/$NAME"
[ -e "$DIR" ] && { echo "$DIR already exists"; exit 1; }
(cd "$PARENT" && $HF_CLI init "$NAME" --resolution "$RES" --non-interactive --skip-skills >/dev/null) || { echo "hyperframes init failed"; exit 1; }
cd "$DIR" || exit 1
mkdir -p assets/{fonts,vendor,brand,sfx,vo} src compositions build tools renders
VENDORED="$(find "$HF_REPO/packages/cli/dist/vendor/npm" -path '*gsap@*/dist/gsap.min.js' 2>/dev/null | head -1)"
[ -n "$VENDORED" ] || VENDORED="$(find "$HF_REPO/node_modules" -path '*gsap/dist/gsap.min.js' 2>/dev/null | head -1)"
[ -n "$VENDORED" ] && cp "$VENDORED" assets/vendor/gsap.min.js || echo "WARNING: no local GSAP found; index.html will fall back to the CDN"
[ -d "$PARENT/brand" ] && cp -r "$PARENT/brand" brand && echo "copied the brochure extraction into brand/"
cp "$SKILL/lib/cues.mjs" tools/cues.mjs
cp "$SKILL/templates/build.template.mjs" tools/build.mjs
[ "$RES" = landscape ] && sed -i 's|createProject(ROOT, {|createProject(ROOT, { width: 1920, height: 1080, preset: "landscape",|' tools/build.mjs && echo "build.mjs set to 1920 x 1080 (landscape); scene templates are authored for 1080 x 1920: re-lay them out (see references/authoring-notes.md)"
cp "$SKILL/templates/scene.intro.html" src/intro.html
cp "$SKILL/templates/script.json" script.json
for f in SPEC STORYLINES RESEARCH REVIEW; do cp "$SKILL/templates/$f.md" "$f.md"; done
"$TOOLS_PY" -I "$HERE/sfx_meta.py" --project . >/dev/null && echo "sound effects copied and measured"
echo "created $DIR"
echo "next: extract_brochure.py -> fonts.py -> write script.json -> voice gate -> vo.py -> edit tools/build.mjs and src/*.html -> node tools/build.mjs -> qa.sh"
