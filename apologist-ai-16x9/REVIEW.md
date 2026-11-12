# REVIEW: Apologist AI promo ("Anyone who asks"), revision 2

Status: **final render for review and Tier 1 approval (2026-11-12).** Voice: ElevenLabs Max. Latest changes: the question types in from an empty box; each question card is in its chip's language (translations unreviewed by native speakers); line 9 names Got Questions, Apologetics Canada and Dare to Share, with the other ministries on screen only. Measured: 67.9 s, 2037 frames, -14.0 LUFS, QR decodes to https://apologistai.com?ref=page; the only pop flags are the planned cut and a small name highlight at 47.9 s. 66.9 s, vertical 9:16, narrated by ElevenLabs "Hale".
Deliverables in `renders/`: the 4K master (2160 x 3840), a 1080p copy, a poster frame, and the project zip.

## What changed from the first draft (Jarret + Jake feedback, 2026-11-01)
| Feedback | Change |
| --- | --- |
| "without the build" isn't explained | Removed. L5 is now "Apologist AI puts a faithful, branded chatbot on your ministry's website." ("chatbot" is the brochure's word; "agent" was jargon.) |
| The ESV excerpt doesn't stand alone | L2 is now the NIV: "Always be prepared to give an answer to everyone who asks you to give the reason for the hope that you have." Reference "1 PETER 3:15 (NIV)". |
| The chat box looks basic | The conversation now fills the screen, with no window: a slim ministry bar, about 1.4× larger type, refined bubbles and cards, an empty state at frame 0, and a larger composer. The strike-through tags were kept and enlarged. |
| The crosses look basic | Removed. The navy ground is flat. |
| Content squeezed at the top; captions | Every scene is re-laid out across y 180 to 1400. Captions are on every line in a bottom band (56 px, y 1440). |
| Ministries out of order | L9 is now "It's trusted by Ligonier, Got Questions, Apologetics Canada, and more." The names light up in brochure order. |
| Voice | ElevenLabs "Hale – Great for Commercials" (`dXtC3XhB9GtPusIpNtQx`, `eleven_multilingual_v2`). |
| Quality pass | See "Message pass" below. |

## Message pass (what I checked, what I changed)
- **The arc holds:** the 2 a.m. question, then the calling (verse), then the need ("the questions never stop", "your
  team can't answer them all"), then the alternative's failure (generic AI), then the product, then the mechanism
  (answers from your teaching, sources, any hour and language, handoff), then the proof (#1, trusted by, numbers),
  then the promise and the ask.
- **Changed:**
  - L5 says what the product is and where it lives.
  - L9 follows the brochure's order.
  - L2 is a complete sentence.
- **Kept:** every other line is the brochure's own wording. "#1" stays, but it is still unverified (see RESEARCH.md).
- **Delivery:** L1, L2 and L10 were generated at 0.9 speed. L2 was sent with two delivery-only commas so the verse
  isn't rushed: 6.4 s instead of 5.2 s. The words are the NIV's.

## Measured vs only looked at (sound was measured, not heard)
- **Measured:**
  - Speech recognition on the Hale take heard every line as written. Error rate was 0.00 on 10 lines, 0.18 on L5 and
    0.20 on L9, both from word splitting ("chat bot" for chatbot; "GotQuestions" run together).
  - No product or partner name was flagged.
  - Draft: 66.87 s, 2006 frames, audio the same length as the picture.
  - The draft mix was −13.1 LUFS, peaking at −1.0 dBFS. The delivered files' audio is normalised to −14 LUFS,
    peaking at −1.5 dBTP (video stream copied).
  - Pop scan: the only one-frame jump is the planned proof→cta cut; the end card holds still.
  - The QR code decodes to `https://apologistai.com?ref=page` from a rendered frame.
  - HyperFrames check: errors 0. The seam gate passes both cuts.
- **Only looked at:** contact sheets at 27 moments across the film, plus both seams. Everything listed in SPEC.md QA.
- **Not known:** how Hale sounds to a listener. Please listen to the whole film before it ships.

## Needs a human before it goes out
1. **Jake Carlson, Tier 1** (house rules). The film contains:
   - Scripture: 1 Peter 3:15 (NIV) and Romans 5:8 (ESV) in the illustrative answer
   - an illustrative pastoral answer
   - the generic-AI tags, including "NOT WHAT YOU TEACH" on "try to earn it by being better" (a doctrinal position on grace; a lower-risk rewrite is in RESEARCH.md)
   - a competitive ranking
2. **"#1 Christian AI platform on TGC 2026 benchmark"** is still unverified here (christianbenchmark.ai is blocked).
   Confirm which table and metric support it.
3. **"205+ countries"** is more than the 193 UN member states. Consider "countries and territories".
4. **Copyright notices for the post description** (the publishers' pages were blocked; confirm the current wording there):
   - NIV: "Scripture quotations taken from The Holy Bible, New International Version® NIV® Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ Used by permission. All rights reserved worldwide."
   - ESV: "Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved."
5. **ElevenLabs licence:** confirm that the account's plan allows commercial use of the output. I couldn't read the
   plan: the key lacks `user_read`.
6. **Product accuracy of the mock:** someone who knows the widget should confirm that the bar, chips, language selector
   and handoff don't promise anything the product doesn't do.
7. **QR tracking:** the code uses the brochure's `?ref=page`. A video-specific ref would separate this traffic. It's the
   team's link to choose.

## Weakest moments, and what I would change with more time
- **The handoff card (about 34 to 37.5 s):** its question and the connected state each stay up for about 1.5 s. That's
  a glance, not a read, but the narration says the same thing at that moment (two `line_unread` warnings, kept on purpose).
- **The last two trusted-by names** (Dare 2 Share, Jesus Film) light up about 0.5 s before the cut. They are visible
  faintly for the whole beat.
- **The first cut** passes through about 0.1 s of near-empty navy while the proof ground floods to light. It reads as a
  short dip, not a glitch.

## Warnings kept on purpose
- `line_unread` on `#ct-h-q`, `#ct-h-done-t` and `#pf-nm5`: see above.
- **Allowed overlaps:** the scrim covers the conversation during the verse and the logo, the question stream passes over
  the dimmed conversation, and the language roll overflows its pill. The "YM" avatar glyph is `data-layout-ignore`.

## Rebuilding
```
$TOOLS_PY -I tools/vo_elevenlabs.py               # ElevenLabs Hale, per line, cached in build/el (needs ELEVENLABS_API_KEY)
$TOOLS_PY -I <skill>/scripts/vo.py take --audio build/take_hale.wav --voice-label "ElevenLabs Hale ..."
node tools/build.mjs && bash <skill>/scripts/qa.sh . && bash <skill>/scripts/render.sh . final
```
Per-line pacing lives in `script.json` (`el_speed`, delivery-only `el_text`). Changing a line's text regenerates only
that line and its neighbours.

## 16:9 version (2026-11-12)
A sibling of the 9:16 project, built from the 67.9 s cut: same narration, timing, sound and script. Scenes re-composed for 1920x1080:
the chat is a centered full-height column (the vertical layout scaled to 0.78), the verse, logo beat, proof scene and end card are
wide layouts (the proof and end card are two columns). Captions sit in one wider line at the bottom, below the chat column.
- **Measured:** seam gate passes (0 fail, 0 warn, 2 seams), lint, runtime and layout checks clean, length 67.9 s and 2037 frames.
- **Delivered files, measured:** 4K 3840x2160 and 1080p 1920x1080, both 2037 frames and 67.9 s, -14.0 LUFS, true peak -2.1 dBFS, QR decodes to https://apologistai.com?ref=page at both sizes. The stock 1080p copy came out portrait (render.sh bug), so it was re-made from the 4K.
- **Read by eye:** draft frames at 12 moments and the seam sheet; not watched end to end.
- Rebuild: `node tools/build.mjs`, then `render.sh . final --preset landscape-4k`.
