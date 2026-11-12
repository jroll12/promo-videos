# apologist-ai-16x9: Apologist AI platform promo (landscape, 1920x1080, about 68 s)

Sibling of `../apologist-ai-9x16`: same narration, timing, cues and sound (the audio is unchanged). Read the 9:16 `REVIEW.md`
and `RESEARCH.md` for status and the claims register; this cut adds no claims.

- What differs from the vertical cut: `tools/build.mjs` (1920x1080, landscape preset, wider captions at the bottom, the verse
  breaks into 4 lines, names in one column) and the three scenes in `src/`.
- Chat scene: the vertical chat is a centered full-height column (scaled 0.78, `#ct-phone`); the verse, the logo beat, the
  proof scene and the end card are wide, two-column layouts.
- Rebuild: `node tools/build.mjs`, `qa.sh .`, `render.sh . draft`, then `render.sh . final --preset landscape-4k`;
  normalise delivered audio to -14 LUFS / -1.5 dBTP. A new voice take is made in the 9:16 project and copied here.
- Voice: ElevenLabs Max (`Gfpl8Yo74Is0W6cPUWWT`). Zogreo keeps Jason; don't touch it.
- Gotcha: the skill's `render.sh final` always makes the 1080p copy as 1080x1920 (portrait), even with `--preset landscape-4k`.
  For this project re-make it from the normalised 4K: `ffmpeg -i renders/apologist-ai-16x9-4k.mp4 -vf scale=1920:1080:flags=lanczos -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart -c:a copy renders/apologist-ai-16x9-1080p.mp4`.
