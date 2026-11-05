# Worked example: the Zogreo introduction (75 s, vertical, three scenes)

Not runnable on its own: it has no brand assets, voice or sound files. It shows the shape of a finished build.

- `script.json`: the 11 narration lines, caption phrase breaks (`cap`), pronunciation respellings
- `build.mjs`: the product-specific half of a build, written on `lib/cues.mjs`; every cue is a spoken word's time
- `src/night.html`, `src/proof.html`, `src/give.html`: the three scenes (the 2 a.m. message, the pilot number, the ask)
- `src/fonts.css`: what `scripts/fonts.py` writes (hand-made here; the tool reproduces it byte for byte)

Verified when the library was extracted: rebuilding the Zogreo project with this `build.mjs` and `lib/cues.mjs`
reproduced `index.html`, `ledger.json`, `build/cues.json` and all four composition files byte-for-byte.

**Read with `references/authoring-notes.md` → "The Zogreo review".** This example is the *first* cut. The reviewed cut
(2026-11-02) kept its structure but fixed what the review measured:
- continuous narration takes (`scripts/el_takes.py`) instead of stitched sentences;
- a running clock and a push onto the paused ad, so the problem is visible;
- Layla's lit card carried into the field;
- the believer joining as a large card that the camera settles on;
- the proof scene re-centred, with her bubble and the team chip;
- a closing return to the same lock screen the next morning;
- 17 sound effects instead of 26, with no chimes.
Copy the structure, not the holds.
