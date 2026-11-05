# SPEC: Zogreo introduction (storyline A, "The 2 a.m. message")

GOAL: A donor ends the film knowing what Zogreo does (AI answers seekers in their own language and hands the ready ones to local believers), that it worked (Türkiye, 3.73×), and where to give, having felt the weight of one unanswered 2 a.m. message.

OUTPUT: HyperFrames, 1080 × 1920 composition, delivered supersampled at 2160 × 3840, 30 fps, H.264 + AAC.

TIME: voiceover length + 3.2 s end-card hold (≈ 72 s ≈ 2,160 frames). Narrated: the VoiceStudio take is the clock. Every cue is stamped from its word times by `tools/build.mjs`. No music bed.

LOOK (from the flyer; nothing invented):
- Grounds: night is a radial #21452A → #163017 → #0B1A0C; proof is flat cream #F7F4EC; give is a radial #24492A → #1D3D1E → #152D16.
- Ink: #F3F0E8 on green; #1B241A / #1D3D1E on cream; body #4B5245.
- Accent: sage-light #B4C4AE as an italic Cormorant accent word, one per shot ("few.", "Great Commission").
- Display: Cormorant Garamond Light 300 at 86 px (verse), 232 px (name), 96 px (CTA), 236 px with lining figures (3.73×).
- UI and captions: Inter 400–700 at 28–48 px. Labels: Inter 600 28 px, tracking 0.24–0.30 em with a leading rule, as on the flyer.
- Medium: the product's own phone UI (lock screen, notifications, thread) in brand colours, plus the flyer's thin header rings (2 px, cream at 6–7.5%). No grain, glow, particles or vignette beyond the radial ground.

OBJECTS:
- The phone: bezel #0A150B, 124 px radius, island, side keys, signal and battery. It reads as a phone without a label.
- Notification cards (Layla's in Arabic with its English line).
- Chat bubbles with tails: cream for seekers; forest-green for the AI; a white bubble with a green rim for the believer.
- A field of about 250 bubbles (the harvest) around two phones (the few workers).
- Two person glyphs (the team), the logo SVG and the give QR (`https://zogreo.org/?give=1&ref=page`).

MOTION:
- Arrivals use `power3.out` / `expo.out`. UI pops use `back.out(1.5–1.7)` from 0.84–0.86 scale.
- Camera: one continuous take, `power3.inOut` interpolated in log-scale. Pull 1 → 0.14 over at least 2.0 s; push 0.14 → 1.12 over at least 1.3 s.
- Seams: cut-the-curve (±230 px, `power4.in` 0.32 s / `power4.out` 0.34 s, 8 px blur), LEFT then UP.
- Titles arrive per word at the spoken word (blur 6 → 0 px, 0.16 s). Captions take 0.14 s in and 0.12 s out.
- No idle loops. The typing dots only run while someone is typing.

SHOTS (cue names from `build/cues.json`):
1. 0 → L2: lock screen at 2:07, "Ministry ad · Running", Layla's card on frame 0 (the thumbnail). Notification sound.
2. L2: six cards pour in below hers (notification / pop / ping rotation).
3. L3: "waiting" tags ripple down the stack; on "off" the ad toggle flips to Paused (click); on "closing" the screen dims.
4. L4: the camera pulls back from 1 to 0.14 (cinematic whoosh). Her message becomes one bubble in a field of them. The verse arrives word by word over a dark scrim, then "MATTHEW 9:37". On "workers" a second phone appears; on "few" two replies pop.
5. L5: "zōgreō" arrives letter by letter on "Zogreo", then "DZOH · GRAY · OH" on "named", then "ζωγρέω · to catch alive · Luke 5:10" on "catching". A sage reply wave answers the whole field and both phones wake.
6. L5 → L6: push into Layla's phone (whoosh). The lock screen blur-swaps into the thread, landing at 1.12 on the chat.
7. L6: typing dots, then the AI's Arabic reply on "answers". On "heart language" the toggle flips عربي → EN and both bubbles turn to English. Then her hard message (on "bluffing") and the AI's honest answer (on "hard").
8. L7: "Yes, I'd like that.", "✓ Ready for a conversation" on "ready", "A trained believer from a local ministry joined" on "believer", the believer typing on "carries". Exit LEFT.
9. L8: "— TÜRKİYE · WEEKLONG PILOT"; the two-person team with 8 seeker bubbles; on "serve" 22 more arrive while 1.00× counts to 3.73× (riser crest on "times"); "273% CAPACITY INCREASE" and the reliability line follow.
10. L9: on "replace" the team holds and grows 8%; on "multiplies" lines connect every seeker to the team. Exit UP.
11. L10: "Together, we can / help fulfill the / *Great Commission* / in our lifetime." arrives word by word.
12. L11 + 3.2 s: the logo wipes in; "VETTED SEEKERS, DELIVERED."; "Give at zogreo.org" on "zogreo.org"; "Book a call · calendly.com/zogreo/intro" on "book"; the QR, "SCAN TO GIVE" and "A program of The Apologist Project · 501(c)(3) nonprofit". Hold.

CAPTIONS: a verbatim rail (Inter 600 44 px, cream on a 78% green-black pill, top 1198 px) on L1–L3 and L5–L9. The verse (L4) and the CTA (L10–L11) are the embed: the big type is the caption.

BANNED: the default list in `spec.md`, except the brand's own cream ground, serif display, italic accent words, spaced small-caps labels and pill buttons, used only as the flyer uses them. Also banned: dark void with floating dots (the night ground always holds the phone or the field), glow, particles, purple/blue gradients, three cards in a row, a docked logo, fade-and-slide-up on every element, music written in code, em dashes on screen, numbers not in the flyer, real people's names besides the flyer's attributions.

QA: frame 0 (thumbnail reads without sound); the pour-in at its fullest; the toggle and dim; the field with the verse; the name with its definition (legible over the field); the Arabic → English switch; the thread's last state; 3.73× after it lands (lining figures, no collision with the label); "multiplies" lines; the CTA headline; the end card with the QR. Then the strip across both cuts, the phone-width sheet, and the rendered file's audio (`hyperframes audio`).
