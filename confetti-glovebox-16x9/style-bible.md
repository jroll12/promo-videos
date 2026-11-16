# Style bible: Confetti in the Glovebox

One desktop, one browser, one palette. Flat vector, bold shapes, ink outlines, hard shadows. Everything is code.
This file is the rule book for every section. The code it describes lives in `src/lib` and `src/data/contract.ts`.

## 1. Palette (locked)

All colours come from `C` in `src/lib/theme.ts`. A hex literal anywhere in `src/sections` fails the lint.

| token | hex | use |
|---|---|---|
| `ink` | #1B1A2E | every outline, all text, hard shadows |
| `ink2` | #4A4763 | secondary text, inactive tab labels, storm clouds |
| `paper` | #FFF4E0 | desktop, window bodies, lyric cards |
| `paper2` | #F4E2C2 | tab bar, inactive tabs, panels, the world beyond the desktop |
| `tangerine` | #FF7A1A | **the hook colour**: active tab, map pin, primary buttons, the sung word |
| `pickle` | #5BB04A | plants, pickles, "ok" states |
| `fizz` | #3EA6FF | drinks, water, selection |
| `pink` | #FF5FA2 | confetti pink, shoes, capes |
| `mustard` | #FFC93C | highlights, receipts' printing, crumbs, alerts, verse punchline cards |

Confetti and debris use only tangerine, pickle, fizz, pink, mustard. No gradients, no transparency washes (opacity is
allowed only for fades in and out), no blur except camera whip blur.

## 2. Type

- **Archivo** (variable, bundled in `public/fonts`): 900 weight, `fontStretch: '125%'`, uppercase for lyric type and
  big UI. 700 to 800 for UI labels. Condensed (75%) for dense secondary text.
- **JetBrains Mono**: tab titles, URLs, clocks, file names, counters.
- `FONT.display` and `FONT.mono` in `theme.ts`. Never name another font.
- Lyric type: `HookType` (hooks, always on screen) and `KineticLine` (verse punchlines only). The sung word turns
  tangerine. Cards are paper or mustard with ink outline and hard shadow, lightly tilted for verses, straight for hooks.

## 3. Shape language

- Ink outline `SHAPE.stroke` = 4 px at 1080p (`SHAPE.thin` 2.5 for small parts). One corner radius: 14 px
  (`radiusSmall` 8 for tabs and chips).
- Hard offset shadow, down-right, 8 px, pure ink, no blur: `hardShadow()`.
- Objects are glyph-simple: one fill, one outline, at most one detail colour. Faces are dots and lines.
- Desktop: paper with a paper2 dot grid, menu bar on top (`File Edit View Snacks`, clock on the right).

## 4. Motion rules

| part | camera | feel |
|---|---|---|
| intro | locked, rest pose | spoken, deliberate cursor drag |
| verses | **chaotic**: whip pans (`whip`), zoom punches (`punch`), jump cuts on beats (`jumpCut`), shake (`shake`) | every bar something changes; cuts on beats or eighths only, never sixteenths |
| hooks | **locked, centred, symmetrical**, REST_POSE only | chaos orbits the still centre |
| pre-hook | half-time float (`float`), slow eases, nothing lands hard | everything drifts at half speed |
| bridge | rhythmic, cuts on every beat or two, less whip than verses | stacking, counting |
| outro | MURAL_POSE, then still | buffering, then the end card |

- **Readable hold:** every literal gag holds still enough to read for at least 2 beats (`MIN_HOLD_FRAMES`, 26 frames).
  A whip may arrive at a gag, but the gag then sits for 2 beats before the next whip.
- Things appear with `popIn` (overshoot). Things land with `ease.outElastic` or a punch.
- Time is always global frames from `useGlobalFrame()`; positions on the beat come from `frameOfBeat`, `frameOfBar`,
  `line(id).startFrame`, `wordsOf(line)`. Never type a frame number.
- 140 BPM at 30 fps: a beat is 12.857 frames. Never add beat lengths up in a loop; convert from beat index each time.

## 5. Browser, tabs and cursor

- `BrowserWindow`: traffic lights, `TabBar`, address bar (mono URL), content area (`BROWSER_CHROME_H` = 124 px).
- Tab widths fall out of the count: 120 px or wider shows glyph + title, 34 px or wider glyph only, under that a
  sliver with a colour stripe. Verses must end in slivers.
- **Tab count is contract, not choice.** Whenever the full tab bar is on screen it shows `tabCountAt(frame)`. Name the
  tabs your gags use with `named={{index: {title, glyph}}}`; the rest are deterministic fillers. New tabs pop in on the
  beat (`newestPop`).
- Hooks use `tabMode="symmetric"`: one active tangerine tab, dead centre, slivers split evenly either side.
- `Cursor`: kinds arrow, pointer, grab, grabbing, wait. `press` 0..1 for clicks (mustard fill + tangerine ring). In
  hooks the cursor snaps to the active tab on the first downbeat and **holds** there, still, for the whole hook.
- Other apps: `AppWindow` (generic), `CalendarApp`, `NotesApp`, `Popup` (OS dialog), `Spinner`. Build gag-specific
  apps on `AppWindow`.

## 6. Confetti system

- `ConfettiField` (screen space, in front of everything): density from `confettiLevelAt(frame)`, monotone over the
  film: 0.02 to 0.14 in verse 1 (sparse), about 0.2 in hook 1, 0.4 by the end of verse 2, about 0.6 in hook 2 and the
  bridge, 0.8 by the end of verse 3, 0.85 to 1.0 in the final hook. Modes: `fall` (verses), `float` (pre-hook,
  with `speed={0.5}`), `orbit` (hooks, `spin={1 + intensity}`). Do not override `level` in the film.
- `ConfettiBurst`: one-shot pops for gags (glovebox opens, boss defeated). Allowed anywhere, any count up to 150.
- `DebrisLayer`: everything that has landed (confetti, receipts at "Wallet got receipts", crumbs at "Crumbs in the car",
  paint at "Paint on the floor" and "let it splatter"). Its ledger is fixed in `src/lib/confetti/debris.ts`. Render it
  **after** `<Camera>` with the same `pose`. Every section renders it; nobody moves debris by hand.
- All particle positions are closed-form functions of the global frame: any frame renders alone, identically.

## 7. Hook layout

- Desktop at `REST_POSE`. `BrowserWindow` at `HOOK_WINDOW` (centred), `tabMode="symmetric"`, `tabs={tabCountAt(frame)}`.
- The glovebox icon sits centred below the window at `ICON_HOME`: the anchor that keeps showing up.
- The cursor snaps to the active tab on the first downbeat and holds.
- `HookType` near the top, centred, size from intensity; confetti in `orbit` mode around the window; small gag windows
  (the hook's own: sauce, fizz cup, tabs, keys, lunch) orbit on symmetric paths in mirrored pairs.
- Intensity (`HOOK_INTENSITY`): hook1 0.4, hook2 0.7, hook3 1.0. Higher = bigger type, more orbiters, faster orbit,
  stronger downbeat punch on the window (not the camera).
- Final hook only: the window minimises into the icon (`MINIMISE_BARS`), the camera pulls back to `MURAL_POSE`
  (`pullbackAt`, `lerpPose`), and the debris resolves into the mural (`DebrisLayer` does this by itself from
  `muralAt`). The hook type stays on screen in the top band (screen y < 300), which the mural keeps clear.

## 8. The mural (final payoff)

A "You are here" map made only from the film's debris (`src/lib/confetti/mural.ts`): a tangerine and pink confetti map
pin whose tip touches the glovebox icon (the spot the intro cursor chose), a dotted route of crumbs looping in from the
bottom-left corner to the icon, a fizz lake and a pickle park as mirror images, a mustard compass star, receipts as city
blocks either side of the pin, one receipt printed YOU ARE HERE, and paint dots as the map border. The outro starts on
exactly this frame (`MURAL_POSE`).

## 9. Lyric type rules

- Hook lines: always on screen as large type (`HookType`), every hook, every line.
- Verse lines: only when the line carries a punchline (`KineticLine`), at most one in three verse lines.
- Spoken intro and outro lines: as UI text (dialog, address bar, end card) rather than lyric cards.
- `useShowLyrics()` is false in validation renders; lyric cards then render nothing. **Any text a gag needs to be
  understood must therefore live in the picture itself** (a tab title, a dialog, a label), not only in the lyric card.

## 10. Literal gags

- About 1 line in 3 becomes a literal visual gag (film target 27 to 33 of 89). Budgets per section in `GAG_BUDGET`.
- Priority gags (assigned): talking left shoe, pickle parkour, Costco-box boat, shopping cart as F1, judgmental dog in
  a window (verse 1); calendar as an RPG boss fight with a tangerine weapon (verse 2); houseplant in a thunderstorm,
  lemonade stand in a hurricane, paper plane (verse 3); cursor drags the icon into place (intro); buffering spinner and
  end card (outro).
- A gag is "literal" only if a stranger could name the object and the action from a still. Hold it 2 beats.

## 11. Determinism

- No `Math.random`, no `Date`, no `performance.now`, no network at render time. Randomness only through
  `rng(seed)`, `hash(seed, i)`, `seedOf('name')`, `noise1` from `src/lib/rng.ts`.
- Canvas drawing happens in the shared canvas helpers only; they wait for fonts.
- Same inputs, same frames: checked by rendering frames twice and comparing hashes.
