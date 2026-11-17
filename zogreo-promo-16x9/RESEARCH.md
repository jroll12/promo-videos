# Claims register (zogreo-promo-9x16)
All product claims below come from the user-supplied script; none were independently verified.
- A person can message a ministry on WhatsApp, Instagram, Telegram or another platform. (supplied)
- Zogreo's AI finds where a person is on their spiritual journey so a ministry can focus on those most open first. (supplied)
- It answers questions in the ministry's content and voice and hands the conversation to a missionary. (supplied)
- The platform connects with Chatwoot and Turumba. (supplied)
- Free demo call and donations at zogreo.org. (supplied)
Creative choices (not claims): journey path, chat bubbles and person icons are abstract; LINE, Discord and Messenger icons stand for "another platform".
Narration: ElevenLabs "Jason - Friendly and Approachable" take, used unedited (32.026 s). Word timings: forced alignment, about 0.1 s tolerance.

## v2 additions
- Sample conversation (illustrative, labelled on screen "ILLUSTRATIVE CONVERSATION"; names invented): notifications from Amir (WhatsApp), Lena (Instagram), Daniel (Telegram); inbox of six seekers with journey tracks; thread: "Does God really listen to people like me?" / "Yes. A lot of people ask that. Can I show you what the Bible says?" / "Yes, I'd like that." / "A missionary joined the conversation" / Joseph, Missionary / "Hi Amir, I'd love to keep talking." Approved by the user as labelled sample text.
- "A PROGRAM OF THE APOLOGIST PROJECT": from the supplied brochure (Zogreo___Missions.pdf), added at the user's request.
- End-card pills "Book a free demo call" and "Make a donation" restate the narration.
- Sound effects: repo SFX (intro project), each peak 11 to 22 dB under the narration peak.

## v3: pronunciation fix
- The word "Zogreo" (30.65 to 31.27 s of the original ElevenLabs narration) was replaced by the user's own reference recording (Zogreo_Correct_Pronunciation.m4a, 0.055 to 0.80 s, gain -0.9 dB, 12 ms equal-power crossfades). Words after it shifted +0.125 s. New audio: assets/vo/narration-zogreo.mp3 (32.16 s). The original assets/vo/narration.mp3 is unchanged.
- Everything before the splice is unchanged (0.9999 correlation with the original at 0 offset).

## v4: smoother splice
- tools/splice_zogreo.py rebuilds narration-zogreo.mp3: the reference word is EQ-matched 90% toward the narration's speech spectrum, level-matched, faded out, followed by a 45 ms natural gap before "dot", and joined with a 25 ms equal-power crossfade. The words after it shifted +0.165 s in total (audio 32.17 s).

## v5: splice refined
- Reference word trimmed to 0.065-0.715 s (drops its ~150 ms room/breath tail), stretched x0.985 (pitch and formants kept) so "dot org" stays exactly where the narrator put it, EQ'd 70% toward the narration (max 6 dB), joined with 25 ms and 15 ms crossfades into the narrator's own quiet dips. Audio length and every other word time equal the original narration.

## 16:9 sibling
Same narration (narration-v4.mp3), word timings, sound effects, captions and content as zogreo-promo-9x16; scenes re-composed for 1920x1080 (phone close-up on the left, caption and icon column on the right; tools in a horizontal row; two-column end card). Audio is identical to the 9:16 render (correlation 1.0 at 0 ms).
- v2 (iPad): lines 1-3 rebuilt on a landscape iPad drawn at 1:1 (lock screen, then a split-view inbox with Amir's thread in the right pane); the "and more" icons fan out from behind the iPad's bottom edge as in the 9:16. Lines 4-5 unchanged. Same audio as 9:16 (correlation 1.0 at 0 ms); output SAR 1:1, DAR 16:9.
