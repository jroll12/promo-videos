# REVIEW: NEFES case-study film, 16:9 (2026-11-12)

A sibling of `nefes-case-study-9x16/`. Same narration, word timing, sound cues, script and claims (`RESEARCH.md`, `SCRIPT.md` are copies). No new ElevenLabs spend. Only geometry changed: every scene was re-composed for 1920×1080, nothing cropped or pillarboxed.

## What changed from 9:16
| Scene | 16:9 layout |
| --- | --- |
| before | The quotation on three wide lines; the country pulls back to 1,300 px across with the team under it |
| pilot | Headline and partners stay in the left column; the study path rises into the right column; the hand-off lands on the team under the path |
| result | Dots left, 3.73× right; then the number moves to the top and the second finding takes the centre |
| relief | The diagram in the left half, the page's three numbers stacked on the right; the responder's quotation takes the diagram's place while the numbers stay |
| close | The country and the team; end card with logo, buttons and zogreo.org on the left, QR on the right |

Build changes are in `tools/build.mjs` only where geometry lives: the country's size (`SMIN`, 1,300 px), the camera pivot (`PIV` 520), the bubble keep-out boxes, the quotation line breaks, the relief diagram's offset, and the canvas size.

## Measured
See the delivery note in the commit and the chat; the same checks as the 9:16 film: lint, every `hyperframes check` gate, seam gate on all four cuts, loudness, pop scan, end card still, QR decoded from a 4K frame.

## Needs a human
The same as the 9:16 film (`../nefes-case-study-9x16/REVIEW.md`): Jarret listens to the name; Jake (or Troy) approves.

## Rebuilding
`node tools/build.mjs`, then the skill's `scripts/qa.sh .` and `scripts/render.sh . final --preset landscape-4k`. The narration and timing come from the 9:16 project; copy `el-scenes/`, `assets/vo/vo.wav` and `build/timing.json` across if they change there.

## Round 2 (2026-11-17): the name, and the team pill
- **The name** is now Jarret's own recording of "Zogreo", re-voiced in the Jason voice with ElevenLabs speech-to-speech and spliced into the two lines that say it (L3, L12). The word file comes from the other Zogreo promo (branch `claude/zogreo-promo-video-ecah3u`), where Jarret approved it; the splice copies that branch's method: no stretch, no EQ, level matched, room tone under it, 25 ms crossfade in, 15 ms out (`tools/splice_name.py`).
  - **Measured:** the narration before the first name is unchanged (correlation 1.0000); each name is 0.13 to 0.18 s shorter than Jason's, so the film is 67.8 s (was 68.2 s), and every cue re-stamped from the new word times.
  - **Recogniser:** it now hears "So, Zogreo" and "or give zogreo.org", dropping "at" in both lines. In the closing line the cut sits in 0.2 s of silence after "at", so this is the recogniser reacting to how the new word begins, not a clipped word. **Listen to both lines.**
  - A new roll of the pilot or close take moves the cut points; re-read the loudness contour before re-running the splice.
- **The pill** ("FIELD TEAM OF 2") now first appears on "handed to the team on the ground" (about 0:23.6), not at 0:10 on "The field team: two people".

## Round 3 to 6 (2026-11-18): the name, finally
Spliced and re-voiced names sounded wrong three times before this worked. What failed and why:
- A word cut out of the middle of a phrase ("at Zogreo,"): "at" was swallowed, and a word recorded alone never blends into a running sentence.
- Re-voicing the phrase with the name region cut at the wrong place (2.05 to 3.12 s, which included "dot"): "dot" was removed before conversion. The recogniser's "zogreo.org" does not prove "dot" is there.
What worked: the pilot line no longer says the name ("So we ran a pilot."); the closing is one speech-to-speech pass of L11 + "Book a call, or give, at" + Jarret's raw name, then Jason's own "dot org" (cut at 2.84 s of `el-scenes/opt-B/closing-roll0.mp3`) after a short pause; then smoothing (soft attack, name eased 2 dB, "dot org" matched). Builders: `tools/name_options.py` (+ `name_options_lib.py`), `tools/closing_whole.py`, `tools/closing_final.py`. The takes behind it are `el-scenes/opt-A/pilot.wav` and `el-scenes/opt-D/close.wav`. Known: the re-voiced closing sits a little lower in pitch than the rest of the narration (about 126 against 137 Hz).
