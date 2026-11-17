# Spec: Scripture Quotation explainer (9:16)

- Canvas 1080 × 1920, 30 fps; master 2160 × 3840 (portrait-4k), 1080p copy by ffmpeg downscale. One full render only.
- Length target 45–60 s (provisional build: 59.6 s including a 2.6 s end card).
- Graphics band about 275–1230 px after the fit transform (scene scale 1.1–1.2); captions band 1290–1490 px (one group visible, Inter 600 64 px, white on a feathered scrim).

## Apologist AI tokens (from apologist.ai live CSS, 2026-11-17)
| Token | Value | Use |
|---|---|---|
| bg | #111827 (site theme-color) | ground |
| panel / line | #1F2937 / #374151 | chat bubbles, bar tracks |
| ink / muted / dim | #F9FAFB / #9CA3AF / #4B5563 | text, sublabels, text bars |
| purple | #7137FF (site primary, logo) | user bubble, frames, wire |
| purple2 / lilac / deep | #8A50FF / #B177FF / #4700F6 | highlights, winning bar, glow |
| amber | #FBBF24 | drift (wrong words) only |
- Fonts: Outfit (display, site `--display-font`) and Inter (body, site `--body-font`), self-hosted woff2.
- Logo: `assets/brand/apologist-ai-white.svg` (Drive › Brand Assets › Logos).

## Scenes (cues come from word times in build/timing.json)
| Composition | Lines | Picture |
|---|---|---|
| hook | L1, "It's not a bug" | user asks for a verse; AI reply as text bars; five words drift amber on "wrong" |
| engine | L2–L3 | model emits "For God so loved the"; next-word candidates; guess lands on "earth" on "drift"; model swaps A/B/C, settings dial turns, a frame "the method" wraps both |
| results | L4–L6 | count to 33,000 with 5 method tiles; five bars fill on their spoken words; output transform 100% plus "99.4% across 10 other languages" |
| how | L7–L8 | placeholder [John 3:16] → Bible source → exact BSB verse; then the wire breaks, the reference stays, "Verse not inserted" gap |
| end | L9 | Apologist AI logo, apologist.ai, "Read the study" + paper URL |

Seams: cut-the-curve leftward, 0.32 s, power4 in/out, 8 px blur. No `Math.random`: every value is fixed so render workers agree.

## Sound
- Voice: ElevenLabs Jason `ILP9IN5fT2Jr2fSfmoNh`, eleven_v4, `[warm, natural, conversational]`, one take per scene (why, study, how, end), word times from `/with-timestamps`, -16 LUFS.
- Music (warm, uplifting, not cinematic): about 100–110 bpm, acoustic guitar or light piano, soft claps, major key; no swells, no ambient pads; 0.14 under the voice. `assets/music/bed.mp3`.
- Effects: soft whooshes at cuts, pops as bars land, clicks on the placeholder and the break. Nothing under the verse.
