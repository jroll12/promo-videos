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
