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
