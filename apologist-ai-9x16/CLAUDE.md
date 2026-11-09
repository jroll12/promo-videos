# apologist-ai-9x16: Apologist AI platform promo (vertical, about 67 s)

Read `REVIEW.md` first (status, open Tier 1 items for Jake), then `RESEARCH.md` (claims register).
HyperFrames' own project notes are in `HYPERFRAMES.md`.

- Script: `script.json` (12 lines, 157 words); recording copy in `RECORDING_SCRIPT.md`.
- Voice: ElevenLabs **Max** (`Gfpl8Yo74Is0W6cPUWWT`, eleven_v4), chosen by Jarret 2026-11-09. One continuous take per
  scene (`tools/el_scenes.py`, adapted from Zogreo: plain warm direction, no slowing, room tone in the joins), then
  `vo.py take --audio el-scenes/take.wav`. "Ligonier" is said li·guh·neer (sent as "Lih-guh-neer", `spoken_elevenlabs`).
  The older per-line `tools/vo_elevenlabs.py` (Hale) is kept for reference only. Zogreo keeps Jason; don't touch it.
- Rebuild from a new take: `vo.py take --audio <take.wav>` (skill `scripts/`), then `node tools/build.mjs`,
  `qa.sh .`, `render.sh . draft`, `render.sh . final`; normalise delivered audio to -14 LUFS / -1.5 dBTP.
- Brand: Apologist AI logo SVGs, Inter + JetBrains Mono, purple #7137FF; QR -> https://apologistai.com?ref=page.
