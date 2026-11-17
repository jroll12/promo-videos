# Progress log: Confetti in the Glovebox (16:9, Remotion)

## Plan (approved)
- Project lives in `confetti-glovebox-16x9/`. Deliverables are relative to this folder.
- Alignment: local stable-ts. Blind validation joins to the storyboard, lyric type hidden. Mural: "You are here" map pin.
- Bar grid drives cuts. Alignment drives word-level type and flags lines that leave the grid.

## Phase 0: timing (in progress)
- Environment: new personal environment `promo-videos`, hosts `download.pytorch.org`, `download-r2.pytorch.org`, `openaipublic.azureedge.net`.
  The second pytorch host was added after the first install attempt: the index page links wheel files to it.
- Tempo: 140.00 BPM measured (linear fit over 371 tracked beats, 9 ms RMS residual, local tempo 139.8 to 140.4). No drift. Matches the brief.
- Grid: beat period 0.428570 s, first grid beat 0.030 s, bar phase 1, so bar 0 starts at 0.458 s.
- Structure from the kick and loudness pattern, 95 bars: intro 4, verse 1 16, hook 8 + 2-bar turnaround, verse 2 16, pre-hook 4,
  hook 8 + 2-bar turnaround, bridge 8, verse 3 12, final hook 8, outro 7.
- Alignment: stable-ts 2.19.1 with whisper small.en on CPU. Three passes: global forced alignment (used), per-section forced
  alignment (cross-check), lyric-free transcription (confirms the words are actually sung there).
- The vocal sings lyrics.txt as written: all 89 lines, in order, nothing dropped or repeated.
- The three hooks land on the same bar positions to within about 20 ms, which is the strongest evidence the alignment is right.
- Result: 77 of 89 lines pass the threshold and use aligned word timing. 12 fall back to bar-grid timing (see `analysis/report.md`).
- Deviation from the plan: "start within 1 beat of grid" is measured against the line's assigned bars with one beat of pickup
  allowed, because hook lines legitimately start on beat 2 or 3 of their bar.
- Outputs: `timing.json` (381 beats, 95 bars, 10 sections, 89 lines, 4897 frames), `analysis/report.md`,
  `out/timing-check.m4a` (song with grid clicks in the left ear and a tick at each line start in the right ear, not committed).
- Reproduce: `analysis/.venv/bin/python analysis/analyze_beats.py && ... align_lyrics.py && ... build_timing.py`.

## Phase 0: stopped for review of the 12 under-threshold lines
- Review decision (owner, "go"): 7 flagged lines accepted with aligned word timing (in.05, v1.03, v1.16, v2.05, v2.10, v2.15, br.08),
  br.05 accepted at line level only, 4 stay on the bar grid (in.01, in.02, br.01, out.01). Recorded in `timing.config.json` -> `accepted`.
  timing.json now: 85 lines aligned, 4 grid.

## Phase 1: style bible and component library (in progress)
- Remotion 4.0.544 + React 19.2.0 + TypeScript 5.9.3, exact pins, lockfile committed. Renders with the container's
  Chromium headless shell (`remotion.config.ts`, override with `REMOTION_BROWSER`). Fonts bundled from npm into
  `public/fonts` (Archivo variable incl. width axis, JetBrains Mono), loaded before the first frame.
- `style-bible.md` written. Library in `src/lib`: theme, fonts, rng, motion, camera (whip, punch, jumpCut, shake),
  chrome (Desktop, MenuBar, DesktopIcon, AppWindow, BrowserWindow, TabBar, Tab, Cursor, Popup, CalendarApp, NotesApp,
  Spinner), 46 glyphs, confetti (ConfettiField fall/float/orbit, ConfettiBurst, DebrisLayer), type (HookType,
  KineticLine, LyricCard), section context (useGlobalFrame, useShowLyrics).
- Continuity contract `src/data/contract.ts`: ICON_HOME, HOOK_WINDOW, MURAL_POSE, tabCountAt (verses 1->48, 2->96,
  3->160, held elsewhere), confettiLevelAt (0 -> 1, monotone), pull-back / minimise / mural progress, gag budgets.
- Debris ledger (`src/lib/confetti/debris.ts`): 600 confetti, 17 receipts (at "Wallet got receipts"), 140 crumbs (at
  "Crumbs in the car"), 210 paint dots (at "Paint on the floor" and "let it splatter"). Mural (`mural.ts`): "You are
  here" map; pin tip on the glovebox icon, crumb route, lake, park, compass, receipt city blocks, YOU ARE HERE label,
  paint-dot border. Checked with the `MuralCheck` dev composition.
- Each section has its own entry point (`src/sections/<id>/entry.ts`) and a placeholder `Section.tsx`.
- Tools: `tools/stills.mjs` (bundle once, render frames, contact sheet), `tools/continuity.mjs` (lint),
  `tools/sync_check.py` (audio cross-correlation).
- Verification: test card (`TestCard`, 10 s over hook 1) rendered at 540p with audio: `out/testcard-540p.mp4`.
  Audio sync: offset 0.0 ms, correlation 0.984 (PASS). Determinism: same frame rendered twice, identical SHA-256.
  Lint clean, types clean.
- Fixed during Phase 1: canvas layers drew before fonts loaded (YOU ARE HERE fell back to a serif). Canvas helper now
  holds the frame until fonts are in and redraws.

## Phase 2: section fan-out (in progress)
- All eight section agents delivered (intro, verse1, hook x3, verse2, prehook, bridge, verse3, outro). Seven were cut off
  by the account's 5-hour usage limit mid-build and resumed from their saved state with a tighter still budget.
- Each section: tsc clean, lint clean, stills checked with and without lyric cards, manifest written.

## Phase 3: reduce
- `node tools/reduce.mjs`: 89/89 lines covered; 28 unique literal gags (target 27..33), 36 literal moments on screen
  (the hook's 4 gags recur in all three hooks); every literal gag holds >= 2 beats; no edits outside section folders.
  One soft warning kept: the pencil glyph appears in two different gags (spoon in a pencil drawer; "brb" pencil).
- Literal per section: intro 2, verse1 5, hook 4 (x3), verse2 6, prehook 2, bridge 3, verse3 4, outro 2.
- Library issues found by section agents, worked around locally, not changed in the library to avoid shifting tuned
  layouts: BrowserWindow's tab bar is about 55 px right of window centre (hook uses a centred local copy), content area
  sits 8 px below BROWSER_CHROME_H (verse2 corrects locally).
- Outputs: `storyboard.json`, `storyboard.md`.

## Phase 4: synthesize
- `Video.tsx` mounts all ten section ranges (hook component three times) on one audio track.
- 540p full preview rendered in 2 m 49 s (`out/preview-540p.mp4`). Audio sync PASS (offset 0.0 ms, correlation 1.000,
  163.243 s both). Seam sheet (frames either side of all nine boundaries) and a whole-film sheet checked once:
  every seam is a clean downbeat hard cut; hook3 -> outro hands off on an identical mural frame; end card correct.
- Minor, left as is: the hook's lyric card and verse 1's receipts card show empty for 1 to 3 frames before their first
  word pops; the final h3.08 card reaches about 5 px into the mural's top band.
- 1080p final render started: `out/video.mp4`.
- 1080p final rendered (205 MB): 1920x1080, 30 fps, 4897 frames, H.264 + AAC, 163.243 s; audio sync PASS.

## Phase 5: blind validation
- `tools/validate_frames.mjs`: 89 strips (3 frames per line at 25/50/75 %, 540p, showLyrics=false), named by
  opaque hash ids so file order is shuffled; key kept in `analysis/out/` (not given to reviewers).
- Round 1: three identically briefed reviewers (about 30 strips each), each allowed to read only lyrics.txt and its
  own strip folder. `tools/join_validation.mjs` joined their reports to storyboard.json.
  Result: 30/36 literal moments recognised; 0 broken frames. Failures: fizz cup (h1.02, h2.02, h3.02), keys (h2.06),
  lunch (h3.07, read as the mural), "With snacks." (out.03, read as the previous line). Report:
  `validation/report-round1.md`.
- Fixes: hook gag windows step in and grow during their own line while the others recede (spotlight); final hook's
  keys and lunch pop at 1.9x; outro snack falls for the whole of out.03 at 300 px and its card lands with the line.
- Round 2 (the one allowed re-run): a fresh reviewer, same brief, 11 re-rendered strips (6 failures + 5 controls):
  11/11 matched. Merged with round 1 for the untouched strips: 36/36 literal moments recognised, 0 failures.
  Report: `validation/report-round2.md`.
- Final re-rendered with the fixes.
