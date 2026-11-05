#!/usr/bin/env bash
# Prepare everything a promo-video run needs, and start the slow installs in the background.
# Run this FIRST: VoiceStudio's environment can take ~1 hour to install in a throttled sandbox,
# and everything else (intake, research, script, scenes) can proceed while it runs.
#
#   setup_env.sh start  [--no-voicestudio] [--models asr,kokoro,piper:en_US-joe-medium,...]
#   setup_env.sh status            # what has finished, what is still running, what failed
#   setup_env.sh check             # report only: repos, network reachability, installed pieces
#
# Writes $PROMO_HOME/env.sh (source it) and $PROMO_HOME/env.json. Safe to re-run: finished
# pieces are detected and skipped. Override locations with HF_REPO, VS_REPO, PROMO_HOME,
# PROMO_MODELS, TOOLS_VENV.
set -uo pipefail

CMD="${1:-check}"; shift || true
WITH_VS=1; MODELS="asr,kokoro,piper:en_US-bryce-medium,piper:en_US-joe-medium"
while [ $# -gt 0 ]; do
  case "$1" in
    --no-voicestudio) WITH_VS=0 ;;
    --models) MODELS="$2"; shift ;;
  esac; shift
done

PROMO_HOME="${PROMO_HOME:-$HOME/promo-env}"
PROMO_MODELS="${PROMO_MODELS:-$PROMO_HOME/models}"
TOOLS_VENV="${TOOLS_VENV:-$PROMO_HOME/tools-venv}"
STATE="$PROMO_HOME/state"; LOGS="$PROMO_HOME/logs"
mkdir -p "$STATE" "$LOGS" "$PROMO_MODELS"
export DO_NOT_TRACK=1 HYPERFRAMES_NO_TELEMETRY=1

find_repo() { # find_repo <marker file> <candidates...>
  local marker="$1"; shift
  for d in "$@"; do [ -n "$d" ] && [ -f "$d/$marker" ] && { echo "$d"; return; }; done
}
HF_REPO="${HF_REPO:-$(find_repo packages/cli/package.json /home/user/hyperframes "$HOME/hyperframes" "$PWD/../hyperframes")}"
VS_REPO="${VS_REPO:-$(find_repo backend/main.py /home/user/VoiceStudio "$HOME/VoiceStudio" "$PWD/../VoiceStudio")}"
HF_CLI="node $HF_REPO/packages/cli/bin/hyperframes.mjs"
VS_PY="$VS_REPO/.venv/bin/python"

probe() { # probe <name> <url> [curl args...] -> prints "<name> <http code> ok|blocked"
  local name="$1" url="$2"; shift 2
  local code; code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -L "$@" "$url" 2>/dev/null || true)
  local verdict=blocked; case "$code" in 200|206|301|302) verdict=ok ;; esac
  echo "$name $code $verdict"
}
network() {
  probe pypi            https://pypi.org/simple/
  probe npm             https://registry.npmjs.org/
  probe github_release  https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-en_US-joe-medium.tar.bz2 -r 0-0
  probe github_raw      https://raw.githubusercontent.com/tarepan/SpeechMOS/main/README.md -r 0-10
  probe huggingface     https://huggingface.co/api/models/k2-fsa/OmniVoice
  probe pytorch_cpu     https://download.pytorch.org/whl/cpu/
  probe jsdelivr        https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js -r 0-10
}

have_py() { [ -x "$1" ] && "$1" -c "$2" >/dev/null 2>&1; }
TOOLS_OK()  { have_py "$TOOLS_VENV/bin/python" "import numpy, scipy, soundfile, cv2, sherpa_onnx, pyloudnorm, segno"; }
VS_OK()     { have_py "$VS_PY" "import torch, sherpa_onnx, fastapi"; }
HF_OK()     { [ -n "$HF_REPO" ] && $HF_CLI --version >/dev/null 2>&1; }
model_ok()  { # model_ok <token>
  case "$1" in
    asr) [ -f "$PROMO_MODELS/sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8/tokens.txt" ] ;;
    kokoro) [ -f "$PROMO_MODELS/kokoro-multi-lang-v1_0/model.onnx" ] ;;
    piper:*) [ -f "$PROMO_MODELS/vits-piper-${1#piper:}/tokens.txt" ] ;;
  esac
}

bg() { # bg <name> <command string>: run detached, leave a .done/.failed marker
  local name="$1"; shift
  rm -f "$STATE/$name.done" "$STATE/$name.failed"
  nohup bash -c "$* && touch '$STATE/$name.done' || touch '$STATE/$name.failed'" >"$LOGS/$name.log" 2>&1 &
  echo $! >"$STATE/$name.pid"
  echo "started $name (pid $!, log $LOGS/$name.log)"
}

download_model() { # download_model <token>
  local url dir
  case "$1" in
    asr)    url=https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8.tar.bz2 ;;
    kokoro) url=https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_0.tar.bz2 ;;
    piper:*) url=https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-${1#piper:}.tar.bz2 ;;
  esac
  local f="$PROMO_MODELS/.dl-$$-$RANDOM.tar.bz2"
  curl -sSL --retry 3 -o "$f" "$url" && tar xjf "$f" -C "$PROMO_MODELS" && rm -f "$f"
}

vs_install_cmd() {
  # VoiceStudio pins CUDA torch builds from download.pytorch.org (often blocked in sandboxes). Export its
  # lockfile, then either install the CPU wheels from the PyTorch index when it is reachable (saves ~6 GB and
  # most of an hour; UNTESTED path) or fall back to the PyPI wheels (tested; large because they bundle CUDA).
  local req="$PROMO_HOME/vs-req.txt" pypi="$PROMO_HOME/vs-req-pypi.txt"
  echo "cd '$VS_REPO' && uv python install 3.12 && uv venv .venv --python 3.12 \
&& uv export --frozen --no-dev --no-hashes --format requirements-txt -o '$req' \
&& sed -E -e '/^(torch|torchaudio|torchvision)==[0-9.]+\\+[A-Za-z0-9]+/d' -e 's/^(torch|torchaudio|torchvision)==([0-9.]+) ;.*\$/\\1==\\2/' '$req' >'$pypi' \
&& if [ '${PROMO_TORCH:-auto}' = cpu-index ] || { [ '${PROMO_TORCH:-auto}' = auto ] && curl -s -o /dev/null --max-time 8 https://download.pytorch.org/whl/cpu/; }; then \
VIRTUAL_ENV='$VS_REPO/.venv' uv pip install --no-sources --extra-index-url https://download.pytorch.org/whl/cpu --index-strategy unsafe-best-match -r '$pypi'; \
else VIRTUAL_ENV='$VS_REPO/.venv' uv pip install --no-sources -r '$pypi'; fi"
}

report() {
  local net; net="$(network)"
  {
    echo "{"
    echo "  \"hyperframes_repo\": \"$HF_REPO\", \"hyperframes_cli_ok\": $(HF_OK && echo true || echo false),"
    echo "  \"voicestudio_repo\": \"$VS_REPO\", \"voicestudio_env_ok\": $(VS_OK && echo true || echo false),"
    echo "  \"tools_venv_ok\": $(TOOLS_OK && echo true || echo false),"
    echo "  \"models\": {$(for m in ${MODELS//,/ }; do printf '"%s": %s, ' "$m" "$(model_ok "$m" && echo true || echo false)"; done | sed 's/, $//')},"
    echo "  \"network\": {$(echo "$net" | awk '{printf "%s\"%s\": \"%s\"", (NR>1?", ":""), $1, $3}')}"
    echo "}"
  } >"$PROMO_HOME/env.json"
  cat >"$PROMO_HOME/env.sh" <<EOF
export PROMO_HOME="$PROMO_HOME" PROMO_MODELS="$PROMO_MODELS" TOOLS_VENV="$TOOLS_VENV"
export TOOLS_PY="$TOOLS_VENV/bin/python" HF_REPO="$HF_REPO" VS_REPO="$VS_REPO" VS_PY="$VS_PY"
export HF_CLI="$HF_CLI" DO_NOT_TRACK=1 HYPERFRAMES_NO_TELEMETRY=1
EOF
  echo "--- repos";   echo "hyperframes: ${HF_REPO:-NOT FOUND}"; echo "voicestudio: ${VS_REPO:-NOT FOUND}"
  [ -z "$HF_REPO" ] && echo "  -> attach jroll12/hyperframes (add_repo) or git clone it, then re-run"
  [ -z "$VS_REPO" ] && echo "  -> attach jroll12/VoiceStudio (add_repo) or git clone it, then re-run (or use --no-voicestudio)"
  echo "--- network"; echo "$net" | awk '{printf "  %-16s %s (%s)\n", $1, $3, $2}'
  echo "--- installed"
  printf "  %-26s %s\n" "hyperframes CLI" "$(HF_OK && echo ready || echo missing)"
  printf "  %-26s %s\n" "tools venv" "$(TOOLS_OK && echo ready || echo missing)"
  printf "  %-26s %s\n" "voicestudio venv" "$(VS_OK && echo ready || echo missing)"
  for m in ${MODELS//,/ }; do printf "  %-26s %s\n" "model $m" "$(model_ok "$m" && echo ready || echo missing)"; done
  echo "  (written: $PROMO_HOME/env.sh, env.json)"
}

case "$CMD" in
  check) report ;;
  status)
    for f in "$STATE"/*.pid; do [ -e "$f" ] || continue; n=$(basename "$f" .pid)
      if [ -f "$STATE/$n.done" ]; then s=done; elif [ -f "$STATE/$n.failed" ]; then s="FAILED (see $LOGS/$n.log)"
      elif kill -0 "$(cat "$f")" 2>/dev/null; then s=running; else s="stopped without a marker (see $LOGS/$n.log)"; fi
      printf "%-18s %s\n" "$n" "$s"; done
    report | sed -n '/--- installed/,$p' ;;
  start)
    report >/dev/null
    if [ -z "$HF_REPO" ] || { [ "$WITH_VS" = 1 ] && [ -z "$VS_REPO" ]; }; then report; echo "Cannot start: a required repo is missing."; exit 1; fi
    # tools venv: quick, foreground (the other scripts need it)
    if ! TOOLS_OK; then
      uv venv "$TOOLS_VENV" --python 3.12 -q && VIRTUAL_ENV="$TOOLS_VENV" uv pip install -q numpy scipy soundfile opencv-python-headless \
        "sherpa-onnx==${SHERPA_VER:-1.13.6}" pyloudnorm segno pypdf || echo "tools venv install failed"
    fi
    # HyperFrames: build, then fetch the fast headless browser
    if ! HF_OK; then bg hyperframes "cd '$HF_REPO' && bun install && bun run build && $HF_CLI browser ensure"
    else bg chrome "$HF_CLI browser ensure"; fi
    # VoiceStudio env (long pole)
    if [ "$WITH_VS" = 1 ] && ! VS_OK; then bg voicestudio "$(vs_install_cmd)"; fi
    # voice and ASR models
    for m in ${MODELS//,/ }; do model_ok "$m" || bg "model-${m//[:\/]/_}" "$(declare -f download_model); PROMO_MODELS='$PROMO_MODELS'; download_model '$m'"; done
    report ;;
  *) echo "usage: setup_env.sh start|status|check"; exit 2 ;;
esac
