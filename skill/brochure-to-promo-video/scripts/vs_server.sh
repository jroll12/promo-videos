#!/usr/bin/env bash
# Start / stop / check the VoiceStudio backend that tools vo.py talks to.
#
#   vs_server.sh start [--model-dir DIR] [--port 8765] [--data-dir DIR]
#   vs_server.sh stop  [--port 8765]
#   vs_server.sh status [--port 8765]
#
# Its sherpa-onnx engine loads ONE Piper-style (VITS) voice, chosen at start with --model-dir; to audition
# a different voice, stop and start with another directory. Needs $VS_REPO and $VS_PY (see setup_env.sh).
# `stop` kills whatever is listening on the port (found from /proc, since `ss`/`lsof` may be missing).
# Never stop it with `pkill -f main.py`: the pattern also matches the shell running the command.
set -uo pipefail
[ -f "${PROMO_HOME:-$HOME/promo-env}/env.sh" ] && source "${PROMO_HOME:-$HOME/promo-env}/env.sh"
CMD="${1:-status}"; shift || true
PORT=8765; DATA="${PROMO_HOME:-$HOME/promo-env}/voicestudio-data"; MODEL=""
while [ $# -gt 0 ]; do case "$1" in --port) PORT="$2"; shift ;; --model-dir) MODEL="$2"; shift ;; --data-dir) DATA="$2"; shift ;; esac; shift; done

listener() { # pid of the process listening on $PORT, read from /proc (no ss/lsof needed)
  python3 - "$PORT" <<'PY'
import os, sys
port = int(sys.argv[1]); inodes = set()
for f in ("/proc/net/tcp", "/proc/net/tcp6"):
    try:
        for line in open(f).read().splitlines()[1:]:
            p = line.split()
            if p[3] == "0A" and int(p[1].rsplit(":", 1)[1], 16) == port:
                inodes.add(p[9])
    except OSError:
        pass
for pid in filter(str.isdigit, os.listdir("/proc")):
    try:
        for fd in os.listdir(f"/proc/{pid}/fd"):
            if os.readlink(f"/proc/{pid}/fd/{fd}").removeprefix("socket:[").removesuffix("]") in inodes:
                print(pid); sys.exit(0)
    except OSError:
        pass
PY
}
up() { [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "http://127.0.0.1:$PORT/openapi.json")" = 200 ]; }

case "$CMD" in
  start)
    up && { echo "already up on :$PORT (pid $(listener))"; exit 0; }
    [ -n "${VS_PY:-}" ] && [ -x "$VS_PY" ] || { echo "VoiceStudio env not ready (run setup_env.sh status)"; exit 1; }
    mkdir -p "$DATA"; : "${MODEL:=$(ls -d "${PROMO_MODELS:-$HOME/promo-env/models}"/vits-piper-* 2>/dev/null | head -1)}"
    [ -n "$MODEL" ] || { echo "no Piper voice directory found; pass --model-dir"; exit 1; }
    # HF_HUB_OFFLINE stops VoiceStudio waiting on huggingface.co when it is blocked
    # exec + redirecting the subshell itself: a bare `cd && cmd &` leaves a shell holding the caller's pipe,
    # which makes `vs_server.sh start | tail` hang until the server exits
    ( cd "$VS_REPO/backend" && exec env OMNIVOICE_PORT="$PORT" OMNIVOICE_DATA_DIR="$DATA" OMNIVOICE_SHERPA_MODEL="$MODEL" HF_HUB_OFFLINE=1 \
      nohup "$VS_PY" main.py ) >"$DATA/backend.log" 2>&1 </dev/null &
    for i in $(seq 1 60); do sleep 2; up && { echo "up on :$PORT after $((i*2))s, voice $(basename "$MODEL"), log $DATA/backend.log"; exit 0; }; done
    echo "did not come up; tail of log:"; tail -5 "$DATA/backend.log"; exit 1 ;;
  stop)
    pid="$(listener)"; [ -n "$pid" ] && kill "$pid"
    for i in 1 2 3 4 5; do sleep 1; up || { echo "stopped (port $PORT closed)"; exit 0; }; done
    echo "still answering on :$PORT"; exit 1 ;;
  status) if up; then echo "up on :$PORT (pid $(listener))"; else echo "down"; fi ;;
  *) echo "usage: vs_server.sh start|stop|status"; exit 2 ;;
esac
