# Confetti in the Glovebox (16:9 music video)

A 1920x1080, 30 fps music video built entirely in code with Remotion (React + TypeScript). The whole film is one fake
desktop and browser. Timing comes from the song itself (beat grid + forced lyric alignment), committed as `timing.json`.

## Render

```bash
npm ci
npm run render            # -> out/video.mp4 (1920x1080, H.264 + AAC)
```

Other commands: `npm run preview` (540p), `npm run testcard` (10 s pipeline check), `npm run studio` (interactive).
Renders use the Chromium headless shell at `/opt/pw-browsers/...` if present; elsewhere set
`REMOTION_BROWSER=/path/to/chrome-headless-shell` or remove the line in `remotion.config.ts` to let Remotion fetch one.

## Re-derive timing (optional; timing.json is committed)

See `analysis/requirements.txt` for the pinned Python environment, then:

```bash
analysis/.venv/bin/python analysis/analyze_beats.py
analysis/.venv/bin/python analysis/align_lyrics.py
analysis/.venv/bin/python analysis/build_timing.py
```

## Files

- `timing.json` beats, bars, sections, per-line and per-word timing; `timing.config.json` grid offset, thresholds, overrides
- `style-bible.md` palette, type, motion and layout rules; `storyboard.md` what each line shows
- `PROGRESS.md` build log; `analysis/report.md` alignment confidence per line
- `src/data/contract.ts` continuity contract; `src/lib` shared components; `src/sections/<id>` one folder per section
