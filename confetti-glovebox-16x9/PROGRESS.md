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
