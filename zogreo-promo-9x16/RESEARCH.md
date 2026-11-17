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
