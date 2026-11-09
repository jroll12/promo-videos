# apologist-ai-9x16: Apologist AI platform promo (vertical, about 67 s)

Read `REVIEW.md` first (status, open Tier 1 items for Jake), then `RESEARCH.md` (claims register).
HyperFrames' own project notes are in `HYPERFRAMES.md`.

- Script: `script.json` (12 lines, 157 words); recording copy in `RECORDING_SCRIPT.md`.
- Voice: Jarret is recording the narration himself. `assets/vo/vo.wav` is a PLACEHOLDER ElevenLabs "Hale" take
  (`dXtC3XhB9GtPusIpNtQx`, made with `tools/vo_elevenlabs.py`, key from `ELEVENLABS_API_KEY`), used only for timing.
- Rebuild from a new take: `vo.py take --audio <take.wav>` (skill `scripts/`), then `node tools/build.mjs`,
  `qa.sh .`, `render.sh . draft`, `render.sh . final`; normalise delivered audio to -14 LUFS / -1.5 dBTP.
- Brand: Apologist AI logo SVGs, Inter + JetBrains Mono, purple #7137FF; QR -> https://apologistai.com?ref=page.
