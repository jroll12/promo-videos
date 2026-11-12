# REVIEW: Zogreo introduction

## Round 3 (2026-11-04), Jarret's feedback
| Feedback | What was done | Evidence |
| --- | --- | --- |
| The narrator is creepy, especially at "two in the morning" | Voice swapped to Jason (`ILP9IN5fT2Jr2fSfmoNh`) and re-directed plain and warm. The last round had directed the opening "softly, unhurried, late at night" at speed 0.9: I over-corrected to the theme. | **Measured** (Hale opening vs the rest of the film): median pitch 100 Hz against 118-125; breathier by 1.3-1.6 dB (harmonics-to-noise 6.7 against 8.0-8.3); narrower pitch range. **Now** (Jason): opening 128 Hz median, 9.5 dB, the same as the rest. **Not heard by anyone yet.** |
| A second phone at about 22 s is unnecessary | Removed, with the gap it left. The field of messages now runs up to her phone on every side; of all those messages two are answered ("the workers are few"). The camera keeps travelling toward her phone. | Frames at 19-24 s checked |
| "Türkiye" to "Turkey" in the video and the script | Script, on-screen label ("TURKEY · WEEKLONG PILOT") and the pronunciation note | No old spelling left in the built files |
| Remove the Layla bubble that appears at 44 s | Removed from the proof diagram (the seeker ring is 8 + 22 bubbles again). Her lock-screen card, the chat and the morning card stay: the flyer's persona carries the story. | Frames at 38-49 s checked |
| The script, in case you record yourself | `SCRIPT-FOR-RECORDING.md` | The same text as `tools/script.json` |

Two things found and fixed on the way:
- With the tighter narration the dark overlay behind the verse started before the camera had pulled back and half-dimmed Layla's lit card. The overlay now sits under the phone layer, so it can never dim her card.
- The hand-off line came out the fastest of the film (3.96 words/s). It was re-taken (3.68), and the pause after it lengthened so the believer card holds about 2.4 s before the cut.

**Measured on the final render:** 62.0 s, 1,860 frames; 18% of frames fully still, longest hold before the end card 3.5 s; loudness -14.5 LUFS, peak -1.5 dBFS; no unexplained one-frame jumps (the cuts, and the clock's ticks, are labelled); the QR decodes at 4K; the stems sum to the mix.

**Warnings kept:** four `line_unread` notes on chat bubbles (e.g. the 27-word reply is on screen 5.6 s against a 6.5 s guide). Jason talks faster than the first voice, so the chat's reading time shrank; the narration, not the chat, carries the story. Layla's English first message also sits on the lock screen for 16 s at the start.

---

## Round 2 (2026-11-02), the review pass

Jarret found the Hale cut "good, but not great" and couldn't say why. This pass diagnosed it by measurement plus an
independent second reviewer, then fixed what was found. The previous cut is kept in `backup-hale-v1/`.

## What was off, and what changed (before → now, measured on the rendered files)

| Problem | Before | Now |
| --- | --- | --- |
| Dead digital silence between sentences (narration made as 11 separate requests) | 10 stretches of 0.4–1.2 s, 10.3% of the narration exact zero | 3 continuous scene takes (plus one re-take of the hand-off); longest exact-zero run 1.3 ms; joins filled with the voice's own pause tone |
| The hushed 2 a.m. opening read fastest, every line a full ad-style pitch arc | 3.0–3.2 words/s; 12–15.5 semitone swings per line | Calmer direction: 7.5–12 semitones on the opening; hand-off re-taken from 3.8 to 3.1 words/s |
| Picture frozen, then lurching | 68% of frames fully still; 70% of runtime in holds of 1 s+; longest 6.5 s | 19% still; 15% in holds; longest hold before the end card 3.0 s |
| The story dropped Layla before the payoff | Cut away while the believer was typing; never returned | The hand-off is the climax (large "Local believer joined" card, a beat of stillness, the camera settling in); the film returns to the same phone the next morning |
| The problem beat was invisible without the voice | 24 px "waiting" tags and a small toggle | The clock runs 2:07 → 3:42; the camera pushes onto "Ministry ad · Paused"; her card stays lit as the screen goes dark |
| Switched away from Arabic on the words "heart language" | Toggle flipped on "heart" | Arabic stays through "heart language" (the reply streams in, the toggle lights); English after |
| Proof scene laid out for the removed captions, two numbers, clip-art people | Bottom 40% empty; 3.73× and 273% | Re-centred and enlarged; one number, landing on the spoken word; the team is the believer chip from the thread |
| Sound effects against house rules | 26 effects: 7 chimes and pings, one pop file 12 times, a riser making the statistic the climax | 17 effects: no chimes, pops rotated across 3 takes, nothing under the verse or the first word, a soft swell on the hand-off instead of the riser |

## Creative calls
- Night to morning: the problem at 2 a.m., the hand-off as dawn, the same lock screen at 7:12 with everyone answered.
- Script edited for the ear with the brochure's facts unchanged (see `RESEARCH.md` §3). It now ends on the flyer's own line,
  "Your gift puts that conversation within reach of someone who has never had a safe place to ask."
- End-card tagline: "Accelerate the Great Commission" (the flyer's donor header) replaces "Vetted Seekers, Delivered."
- Not taken from the second review:
  - "Say almost four times": no, 3.73 is the brochure's figure.
  - A named line from the believer: invented content; ask first.
  - Drop the QR: no, it is useful on booth screens.
  - A human narrator: that is Jarret's and Jake's call.

## Measured, looked at, and not checked
- **Measured:** every line's words (speech recognition: word error rate 0.00–0.22), pace, pitch, pauses and dead air; still
  frames and holds; one-frame pops (only the two cuts and the clock's last tick, all intended); loudness −14.5 LUFS, peak
  −1.5 dBFS; stems sum to the rendered mix within −32 dB.
- **Looked at:** contact sheets of 32 moments, plus spot checks after each fix.
- **Not heard:** nobody has listened to the Jason narration yet, me included. Listen especially to:
  - "Zogreo" in the proof scene and on the last line (the recogniser wrote "Zogreio" and "zogra"); it is now sent as "Zo-GRAY-oh" (Jarret's reference clip; option B of three).

## Needs a human before it goes out
- **Jake (Tier 1):** the whole cut, including the script edits and the new tagline.
- **A native Arabic speaker:** the Arabic lines (unchanged from before, still unchecked).
- **Music:** none yet, by choice. `MUSIC-CUES.md` has the brief and timestamps. Drop a track at `assets/music/bed.mp3` and
  rebuild, or use `renders/stems/`.

## Weakest shot now
The proof scene (42–55 s): it is still the one infographic in a film otherwise made of the product's own screens. It is
better than before (it now has the story's own people), and a more filmic version would be the next step.

## Warnings kept on purpose
- `text_below_floor` around 18 s and 26.5 s: the phone's text while the camera is pulled far back, where it is texture.
- `line_unread #nt-m1-en`: Layla's first message in English, already on screen for 17 s at the start.
- `composition_file_too_large`: `src/night.html` is one continuous camera move; splitting it would break the move.

## Rebuilding
1. `python tools/el_scenes.py`: the narration takes. It reuses existing takes; `--only <scene>` re-rolls one and spends credits.
2. `vo.py take`, with these arguments: `--script tools/script.json --audio el-scenes/take.wav`.
3. `node tools/build.mjs`.
4. Then `render.sh` and `python tools/stems.py --video <render>`.

---

## 16:9 version (2026-11-05)
A sibling of the 9:16 project: same narration, timing, sound and script (audio unchanged, so the stems and `MUSIC-CUES.md` still apply).
Scenes re-composed for 1920x1080: the phone is a 1080-px-tall close-up with the camera following the action; the proof scene and
end card are two columns. Delivered at 3840x2160 and 1920x1080. Checked: seam gate, one-frame jumps (cuts and clock only), QR decodes at 4K,
21% of frames fully still, longest hold before the end card 3.5 s, -14.5 LUFS. Chat reading-time notes are the same as the vertical cut.
Rebuild: `node tools/build.mjs`, then `render.sh . final --preset landscape-4k`.

## Round 4 (2026-11-09): pronunciation
Jarret supplied a reference recording of "Zogreo" and chose option B of three Jason renderings: **"Zo-GRAY-oh"**.
- **Measured** (clip vs Jason): the clip has two strong syllables (ZO, then a longer, higher GRAY) and a light final "oh", 0.69 s. B: 0.78 s, same stress. The previous spelling "Zoh-GRAY-oh" was 0.82 s. Measurements show rhythm and stress, not vowel quality.
- **Done:** all four scenes that say the name (night, handoff, proof, give) re-taken; narration re-aligned (word error 0.00 to 0.20, the name itself is mis-spelled by the recogniser as before); opening re-measured (126 Hz, harmonics-to-noise 9.0, the same as the rest).
- **Name card:** changed to "ZO · GRAY · OH" in Round 5.
- **Not heard by anyone yet:** the new narration. Listen for the name in L5, L6, L8, L9 and L11.

## Round 5 (2026-11-12): Jarret's review of the Round 4 renders
| Feedback | What was done |
| --- | --- |
| Content cut off in 16:9 | The phone is now always shown whole (camera base scale 0.56); the pushes stay within the whole phone. The morning phone is whole too, settling instead of panning. |
| A dark see-through band covering half the screen (both shapes) | The scrim behind the verse and name is now a feathered pool centred on the type that fades to nothing inside its own box (peak 0.84). |
| The last "Zogreo" sounded a little off | Measured: in "Give today at zogreo.org" the "oh" was swallowed (the recogniser heard "zogra") and the pitch fell into GRAY, unlike his clip. New takes of the give scene were made; Jarret picks one by ear. |
| Name card should follow the clip | "ZO · GRAY · OH" |
| No link text in the buttons | One address line "zogreo.org", then two plain buttons: GIVE (filled) and BOOK A CALL (outline). The calendly URL is gone; the QR still goes to the give page. |

Round 5, audio: the give scene (L10, L11) was re-taken so "Zogreo" in "Give today at zogreo.org" keeps its full "oh" (the recogniser now hears "Zogreo", word error 0.00; it heard "zogra" before) and the pitch rises into GRAY like Jarret's clip. Take 7 of two candidates was chosen by me, not by ear: Jarret has not heard it. Also in 16:9, the field of messages now fades in at 16.3 s instead of switching on (a one-frame jump the pop scan found).
Measured on the final renders: 63.0 s, 1,891 frames; -14.5 LUFS, peak -1.5 dBFS; QR decodes at 4K in both shapes; 19% (9:16) and 23% (16:9) of frames fully still; pop scan shows only the cuts and, in 9:16, the screen-off beat and the clock starting.
