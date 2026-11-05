# Sandbox notes: what is slow, what is blocked, and how not to hurt yourself

These come from the first full run in a cloud sandbox with an allow-listed network. Check what applies to the
current environment with `scripts/setup_env.sh check` instead of assuming.

## Network (measured on the first run; re-check with `setup_env.sh check`)

| Reachable | Blocked |
| --- | --- |
| pypi.org, files.pythonhosted.org, registry.npmjs.org (incl. `npm pack @fontsource/...`), github.com release downloads (redirect to release-assets), raw.githubusercontent.com, api.github.com, Google Drive / Slack / Confluence through their connectors | huggingface.co, hf-mirror.com, download.pytorch.org, cdn.jsdelivr.net, unpkg.com, fonts.googleapis.com, the product's own website (zogreo.org) |

Consequences:
- Link extraction in `extract_brochure.py` works without pypdf on simple PDFs; install `pypdf` (setup does) for compressed ones.
- A blocked website means you cannot verify the live site's copy or case studies. Say so in the claims register
  ("could not check") and ask the user to allow the domain if it matters.
- VoiceStudio engines that download from Hugging Face cannot run. Ask the user to allow `huggingface.co` rather
  than hunting for workarounds.
- HyperFrames' template loads GSAP from jsDelivr: `scaffold.sh` vendors it into `assets/vendor/`.
- Brand fonts come from `npm pack @fontsource/<family>` (`fonts.py`), not Google Fonts.
- Cloud environments are ephemeral. Deliver the project as a zip; do not rely on the container surviving.

## Long jobs

- **VoiceStudio's Python environment is the long pole**: about 8 GB (PyPI's torch bundles CUDA) and about 57
  minutes in the throttled sandbox. `setup_env.sh start` launches it in the background first, so intake,
  research, storylines and script writing happen while it installs. If `download.pytorch.org` is reachable it
  installs CPU wheels instead (saves most of the time; that branch is untested). `--no-voicestudio` skips it
  when you will use `vo.py --via direct` or an external take.
- Check progress with `setup_env.sh status`, not by polling the process. A stalled-looking install is usually a
  slow wheel: compare the uv cache size twice, 30 seconds apart.
- Rendering without a GPU is slow because supersampling forces screenshot capture: about 2 minutes for a 75 s
  1080p draft, about 10 minutes for the 4K delivery render (2.8 frames per second). Run it in the background.
- Never run a foreground `sleep N; cat log` (the harness blocks it). Start the job in the background and wait
  with `until grep -q 'DONE\|FAILED' log; do sleep 5; done`.

## Process hygiene (each of these bit the first run)

- **Never `pkill -f <pattern>`**: the pattern also matches the shell running the command and kills it. Stop a
  server by the process listening on its port (`vs_server.sh stop`).
- A bare `cd x && cmd &` leaves a shell holding the caller's output pipe, so `start | tail` hangs. Use
  `( cd x && exec cmd ) > log 2>&1 < /dev/null &`.
- A watcher whose command line contains the pattern it waits for never sees the process end.
- `ss`/`lsof` may be missing; read `/proc/net/tcp` (see `vs_server.sh`).
- Set `DO_NOT_TRACK=1 HYPERFRAMES_NO_TELEMETRY=1` (the scripts do).

## HyperFrames

- Use the repo's own CLI: `node $HF_REPO/packages/cli/bin/hyperframes.mjs ...` (`$HF_CLI`). The repo needs
  `bun install && bun run build` once (a few minutes; not timed). `hyperframes browser ensure` fetches the headless Chrome
  that the fast capture path needs.
- `hyperframes init` stamps `data-hf-id` attributes into HTML as it works; harmless.
- Sub-composition files must use `<template>` and `#root`; only fonts declared with `@font-face` resolve.

## Sources of truth and secrets

- Brand rules live in the user's own systems (Confluence, Drive, Slack). Read them when connected.
- Some internal pages and DMs contain plaintext account passwords. Never copy them into any output, and mention
  once to the user that they exist.
