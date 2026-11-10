# REVIEW: NEFES case-study film (round 1, 2026-11-10)

68.2 s, 9:16, Jason's voice, no phone UI. Ask: "Book a call, or give, at zogreo.org." Source: the case-study page text (`source/nefes-case-study-page.txt`); claims in `RESEARCH.md`.

## Needs a human before it goes out
- **Jarret, by ear:** the name in L3 ("So at Zogreo, we ran a pilot", about 12.6 s) and L12 ("at zogreo.org", about 64 s). Sent as "Zo-GRAY-oh". The recogniser heard L3 as "Zogreio" on this take and "Zogreo" on an earlier one, and L12 as "zograyo.org". That is a weak signal either way; nobody has heard the narration yet.
- **Jake (Tier 1, or Troy while he is away):** the whole cut, including Kavanah Media and Waha named on screen.
- **Confirm on the live page:** the stats panel labels (see `RESEARCH.md` §2). The Nov 3 fact sheet listed "Clicks" where the paste has "Abusive Messages".

## Scenes
| Time | Scene | What happens |
| --- | --- | --- |
| 0:00 | before | The responder's words light as they are spoken while messages close in; the camera pulls back to the whole country full of messages; the field team of two lands |
| 0:12 | pilot | "An AI Discovery Bible Study agent"; the camera travels down a path of three studies; one person moves study by study; each is ticked; a beat of stillness, then the hand-off to the team (the film's peak) |
| 0:27 | result | 100 dots against 373 as the number counts to 3.73× on the spoken word; then "Leaders found at about the same rate" with two equal bars |
| 0:37 | relief | Messages come in from every side and most turn hostile (shape, not colour); three hit the team; a line closes around the team, every hostile one gets a reply, only the sincere pass; the page's numbers count up; then the responder's words again |
| 0:57 | close | The country again, every message answered; logo, "Book a call" or "Give", zogreo.org, QR |

Seams: cut-the-curve LEFT, UP, LEFT, UP. The team of two is the object carried from scene to scene.

## Measured
- **Narration:** six continuous takes (1,190 characters in all). Word error 0.00 on 10 of 12 lines, 0.07 and 0.14 on the other two (an apostrophe and the name). Pace 2.3 to 3.7 words a second. The hand-off line was re-taken on its own (it came out at 3.83 words a second in the first take; now 3.23).
- **Voice:** median pitch 134 Hz in the opening against 137 to 150 Hz elsewhere (−4%), harmonics-to-noise 9.6 to 10.4 dB throughout, so the opening is not lower or breathier than the rest (the intro film's "creepy" problem).
- **Final render:** 2160×3840 and 1080×1920, 30 fps, 2,045 frames, audio as long as the picture. Loudness −14.4 LUFS, peak −1.5 dBFS. Pop scan: the only one-frame jumps are two of the cuts. End card holds (frame change 0.001 over the last 2.5 s). The QR decodes to `https://zogreo.org` from a 4K frame.
- **Checks:** lint 0/0; `hyperframes check` passes every gate; seam gate passes all four cuts.
- **Text:** every quotation and on-screen fact was found word for word in the page text by script.

## Only looked at
- Frames at every beat and every cut, before and after the narration. Fixed on the way: top-heavy layouts, bubbles over a label, an empty beat after the headline, clipped quote marks, two labels on screen too briefly, a 6 s still stretch in the pilot (now a slow push), cards growing into the top labels.

## Warnings kept
- The draft scan counted about half the frames as nearly still at a strict threshold: much of it is slow pushes and small changes (ticks, words lighting) that the threshold does not see. Longest real hold before the end card: about 2 s at the start of the result scene.
- No music (no licensed bed). `MUSIC-CUES.md` has the brief and timestamps; stems are in `renders/stems/`.

## Rebuilding
1. `python tools/el_scenes.py` (reuses existing takes; `--only <scene>` re-rolls one and spends credits). Needs `ELEVENLABS_API_KEY`.
2. `$TOOLS_PY tools/vo_take.py` (the skill's `vo.py take`, but each take is recognised on its own; on the joined take the plain script lost the last line).
3. `node tools/build.mjs`, then the skill's `scripts/qa.sh .` and `scripts/render.sh . final`, then `python tools/stems.py --video <render>`.
- `tools/draft_timing.mjs` writes an estimated timing for layout work before any narration exists; `build.mjs` then leaves the voice out and warns.
