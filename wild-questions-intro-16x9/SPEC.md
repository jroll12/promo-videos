# Spec: Wild Questions of the Week intro

- Length 8.8 s: the theme (8.0 s of music) plus a 0.8 s end-card hold. 30 fps. 16:9 1920x1080 (4K delivery) and a 9:16 sibling (`../wild-questions-intro-9x16`) built from the same `src/wild.html`; only `SHAPE` in `tools/build.mjs` differs.
- Timing source: `tools/lyrics.json` (sung words snapped to vocal onsets; 125 bpm grid t0 0.232 s, 0.48 s). Every cue in `build/cues.json` derives from it; `build/events.json` lists the named moments.
- Palette (Apologist Project Design System): base `#111827`, violet `#7137FF` (fills, shadows), `#8F61FF` / `#B191FF` for violet glyphs and text, gray-800 `#1F2937` chips, Aurora `#4F46E5 → #7137FF → #9089FC → #80CAFF` on "Wild" only.
- Type: Outfit 700–900 display, Inter 600 UI text, local woff2 from @fontsource (OFL).
- Beats: storm of # and question chips (0–1.1) → "#Wild / questions / of the / week" on the sung words (1.2–3.0) → chat pill types and sends `#WasMannaGlutenFree` (3.0–3.9) → "They're the wild, wild" over a pile-up of questions (3.9–5.5) → title builds on "questions of the week" (5.5–6.6) → "asked to apologist AI" (7.09) → # spin + confetti (7.45) → float to 8.8.
- Sound: the theme at full level; three quiet SFX (0.12) on their own tracks (whoosh 1.2, pop 3.6, whoosh 5.6): mute them by deleting the `sfx-*` lines or setting `SFX_VOL = 0` in `tools/build.mjs`.
- Rebuild: `node tools/build.mjs && npm run check`.
