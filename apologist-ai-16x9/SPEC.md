# SPEC: Apologist AI promo ("Anyone who asks"), revision 2

GOAL:    a ministry leader feels the 2 a.m. question their team can't reach, sees a faithful, branded chatbot answer it from
         their own teaching and hand the person to their team, and books an intro call (or visits apologistai.com).
OUTPUT:  HyperFrames, 1080 x 1920 (delivered supersampled 2160 x 3840 + a 1080p copy), 30 fps, H.264 + AAC.
TIME:    the narration is the clock (ElevenLabs "Hale", 64.3 s) + an end card held about 3 s, for 66.9 s in all.
         Every cue is a spoken word's time from build/timing.json.

## LOOK (from the brochure; numbers, not adjectives)
- Grounds (sampled from flat areas):
  - navy #111828 (brochure top; flat, no drawn symbols)
  - indigo #1D1640 (stat band)
  - light #F7F6FB
  - lavender #ECE7FB (CTA band)
  - white #FFFFFF (message bubbles, cards)
- Ink:
  - on dark: white #FFFFFF, with #A9A8C6 and #D4D3E8 for secondary text
  - on light: #111828 headings, #3C3E51 body, #5E5F76 small print
  - light purple #A88BFF for eyebrows, references, "everyone who asks you" and "Christ made known."; stat labels #C9BFFB
- The one accent, purple #7137FF (the logo's cross), appears only on the cross, the "#1" and the "apologistai.com" button.
  Rose #FF80B5 appears only on the three generic-AI tags.
- Type:
  - "Inter PV" 800 for headlines, tracking −0.03em: verse 80 px, CTA 106 px, tagline 92 px, "#1" 480 px
  - Inter 600 to 700 uppercase labels, 28 to 30 px, tracked 0.16 to 0.22em
  - conversation text 42 to 46 px
  - "JetBrains Mono PV" 700 for the scripture reference, 34 px
- **Captions on every line:** Inter 700 56 px, white on rgba(17,24,40,0.88), top at y 1440, max width 900.
  Phrases are mostly 24 characters or fewer.
- **Frame use:** scene content spans y 180 to 1400, captions y 1440 to about 1540; below that is ground only (the
  platform's own interface covers it). No text right of x 940 below y 900, except the caption pill.

## OBJECTS
- **Agent bar** (y 188 to 300): avatar "YM", "Your Ministry", "Illustrative conversation", a language pill (rolls
  through 7 autonyms on "language"), a "2:07 AM" pill (lights up on "hour"). It re-skins to indigo after the logo beat.
- **Conversation**, full screen with no window:
  - an empty state at frame 0 ("Ask us anything.")
  - the composer (y 1196 to 1364) where the question is typed
  - the seeker's bubble (indigo)
  - the generic AI's three grey bubbles, with rose strike-throughs and tags
  - the ministry's answer: white bubble, intro line, Romans 5:8 (ESV) quote, chips "Romans 5:8 · ESV" and "Source: Your Ministry"
  - the handoff card ("Want to talk with someone from our team?", then "You're connected with our team.")
- **Question stream:** 14 cards (question, plus language and time), scrolling up the full frame. It slows on "But",
  then "Unanswered" ripples down the column and a "Your team" pill lands.
- **Proof:** "#1" with its label, method line and source line. Then a full-frame indigo stat band (2.5M+, 600K+, 205+,
  192, 19) and TRUSTED BY as a two-column list in the brochure's order.
- **End card:** logo, tagline, BOOK A QUICK INTRO CALL + calendly pill, the "apologistai.com" button, a QR code with
  SCAN TO VISIT and the price lines, and the footer "A program of The Apologist Project, a 501(c)(3) nonprofit."

## MOTION
- Arrivals expo.out 0.35 to 0.6 s; camera power2.inOut; exits power3.in, shorter than entries.
- Typeset lines ink in word by word on their spoken words. The question stream runs at constant speed, then settles
  with power2.out.
- Seams: cut-the-curve, 0.32 s, 8 px blur. chat → proof goes LEFT (the proof ground floods from navy).
  proof → cta goes UP (the proof ground turns indigo under the band first, so the exit doesn't wash out).
  Inside cta, the lavender ground floods to navy before the tagline.

## SHOTS
1. L1: frame 0 shows the empty state and "Is there any hope" typed. The rest types in, then sends on "ask".
2. L2: the conversation recedes under a scrim; the NIV verse inks in at 80 px with "1 PETER 3:15 (NIV)".
3. L3: the question stream fills the frame; "Your team" lands on "team"; "Unanswered" ripples on "answer".
4. L4: back in the conversation, the generic AI replies; HEDGES / NOT IN SCRIPTURE / NOT WHAT YOU TEACH land on their verbs.
5. L5: the logo wipes in, 900 px, with MISSIONAL AI ORCHESTRATION PLATFORM. It leaves after "website"; the bar re-skins.
6. L6: typing dots, then the answer. Chips land on "teaching" and "cites"; the clock lights on "hour"; the language rolls on "language".
7. L7: the handoff card appears and the thread scrolls up. "Yes, connect me" is pressed on "passes", then the connected state. Exit LEFT.
8. L8: "#1" lands on "one", then the label, method and source.
9. L9: the indigo band rises, the numbers count up, and the names light up in order (three on their spoken names, the rest on "and more"). Exit UP.
10. L10: the CTA headline inks in on lavender.
11. L11: the ground floods to navy and the tagline inks in.
12. L12: the tagline steps up under the logo; the call, site, QR and price lines arrive; the footer follows. The end card holds.

## BANNED
- **HyperFrames defaults:** dark void with floating dots, glow, particles, purple/blue gradients, three cards in a row,
  a docked logo, everything fading in, idle loops, bounce on UI, click rings.
- **For this film:**
  - drawn crosses or any clip-art symbol
  - invented numbers or testimonials, or partner logos
  - any UI claim the brochure doesn't make (no "Powered by" badge)
  - a red "error" palette
  - music made in code

## QA (frames read: 0, 2.6, 3.6, 4.7, 8.0, 11.8, 13.6, 14.6, 16.5, 19.0, 21.4, 23.2, 25.5, 29.6, 31.4, 33.0, 35.2, 37.0,
## 39.4, 43.0, 47.5, 50.2, 53.5/53.8, 55.4, 58.5, 62.5, 66.5 s, plus both seams)
- Frame 0 is the thumbnail: the question being typed is legible, along with "Your Ministry · 2:07 AM".
- Captions are in the band on every line and never cover content.
- Names light up in brochure order. The QR decodes to https://apologistai.com?ref=page from a rendered frame.
