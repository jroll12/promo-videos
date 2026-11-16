# Brief for section agents (Phase 2)

You are building ONE section of a music video made entirely in code (Remotion 4, React 19, TypeScript). The whole film
is one fake desktop and browser. Project root: `confetti-glovebox-16x9/` (run every command from there).

## Read first (in this order)
1. `style-bible.md` — the rules. Follow them.
2. `src/data/contract.ts` — continuity values you must respect (tab counts, confetti level, icon home, hook window,
   mural pose). Read-only.
3. `src/data/timing.ts` — how to get time: `line(id)`, `linesOf(section)`, `frameOfBar`, `frameOfBeat`, `beatAt`,
   `barAt`, `wordAt`. Every timing value comes from here.
4. `src/lib/` — the component library: `camera`, `chrome`, `confetti`, `glyphs`, `type`, `motion`, `context`, `rng`,
   `theme`. Skim the exports; reuse them.
5. `src/testcard/TestCard.tsx` — a working example that uses most of the library.
6. Your lines and frames: `node -e "const t=require('./timing.json');t.lines.filter(l=>l.section==='SECTION').forEach(l=>console.log(l.id,l.startFrame,l.endFrame,l.source,l.text))"`
   and the section range: `node -e "console.log(require('./timing.json').sections.find(s=>s.id==='SECTION'))"`.

## Hard rules
- You own ONLY `src/sections/<your folder>/`. Do not edit anything else: not `src/lib`, not `src/data`, not other
  sections, not `timing.json`, not tools, not docs. If the library lacks something, build it locally in your folder and
  list it in your manifest under `localProps`; if you think it belongs in the library, list it under
  `promotionCandidates`. Do not commit or push.
- `Section.tsx` must default-export `React.FC<SectionProps>` (from `src/lib/sectionRoot`). It is mounted inside a
  `<Sequence>`; get the GLOBAL frame with `useGlobalFrame()` and use it for every lookup. Keep `entry.ts` as is.
- Time only via the timing helpers and line ids. No literal frame numbers. A gag is anchored to a line
  (`line('v1.04').startFrame`, its words via `wordsOf(line)` from `src/lib/type`) or to a bar/beat (`frameOfBar(bar)`).
- Colours only from `C`, fonts only from `FONT`, randomness only from `src/lib/rng`. No `Math.random`, `Date`, network.
- Render `<DebrisLayer frame pose>` (same pose as your `<Camera>`) and `<ConfettiField frame>` (no `level` override)
  in every frame of your section. Whenever the full browser tab bar is visible it shows `tabCountAt(frame)` tabs.
- Lyric cards render nothing when `useShowLyrics()` is false (the library handles this). Any words a gag NEEDS to be
  understood must be in the picture itself (tab title, dialog text, label), because validation stills hide lyric cards.
- Every literal gag holds readable for at least 2 beats (`MIN_HOLD_FRAMES`).
- Stay inside your gag budget (`GAG_BUDGET` in the contract). Do not literalise lines assigned elsewhere.
- Performance: avoid heavy SVG filters and more than about 300 DOM nodes animated per frame; use the canvas confetti.

## Verify (540p, stills only)
- `npx tsc --noEmit` must pass. `node tools/continuity.mjs --section <folder>` must pass.
- Stills of your own section, bundled once:
  `node tools/stills.mjs src/sections/<folder>/entry.ts <compositionId> <local frames...> --out out/<folder>`
  (local frame 0 = first frame of your section; `every:24` renders every 24th frame). Look at the contact sheet
  (`out/<folder>/<compositionId>-sheet.png`) with the Read tool, fix, re-check. Keep each batch to 12 frames or fewer,
  and at most about 6 batches in total. Also render one batch with `--no-lyrics` and check every literal gag still reads.
- Do not render video files. Do not render other sections.

## Deliver
1. `src/sections/<folder>/Section.tsx` (plus any local files in the folder).
2. `src/sections/<folder>/manifest.json`:
```json
{
  "section": "<id or 'hook'>",
  "frames": [start, end],
  "gags": [
    {"lineId": "v1.04", "treatment": "literal", "gag": "pickle parkour", "description": "what a viewer sees",
     "tab": {"title": "...", "glyph": "pickle"}, "holdFrames": [startGlobal, endGlobal], "lyricType": false}
  ],
  "tabs": {"start": 1, "end": 48},
  "confetti": {"start": 0.02, "end": 0.14},
  "debrisIds": "ledger (no manual debris)",
  "localProps": ["names of components you built locally"],
  "promotionCandidates": ["anything that should move into src/lib"],
  "notes": "anything the reducer should know"
}
```
   List EVERY line of your section in `gags`, with `treatment` one of `literal` (a visual gag a stranger could name
   from a still), `type-only` (lyric card, no gag), `ambient` (supports the mood, not a gag for that line). Use global
   frames in `holdFrames` (compute them, then paste the numbers; the manifest is data, not code).
3. A final message of at most 15 lines: what you built, the literal gags, anything you could not do, and the paths of
   two or three representative stills.
