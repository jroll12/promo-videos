# Authoring notes: lessons from the first build

Read before writing scenes (phase 6) and again before QA (phase 8). The HyperFrames skills in its repo
(`skills/hyperframes/SKILL.md` and its `references/`, `.claude/skills/motion-doctrine`) are the authority on the
render contract; this file is what the first full film taught about using them.

## Look at the frames: checks pass things that are wrong

`hyperframes check`, the seam gate and the pop scan all passed on a film that still had these defects, found
only by reading contact sheets (`qa.sh` prints their paths; open the .jpg files):

| Defect that passed every automatic check | What to do (and whether the first run fixed it) |
| --- | --- |
| Arabic text clipped at the edge of a card (`content-box` padding) | `#root * { box-sizing: border-box }`, Arabic line-height 1.5+, a font with Arabic glyphs |
| "3.73" showed as "3·73" (the serif's default old-style figures) | `font-variant-numeric: lining-nums` |
| Both scene cuts landed on a blank frame | the incoming scene must already carry content when the cut lands: let its label and first object ride in with the stage, not fade in afterwards |
| An 8 s opening that never changed | fixed: camera moves on spoken words, new content every 2 to 4 s (add story, not wobble) |
| A caption sat on top of UI text | **Not fixed in the Zogreo film** (captions overlay the phone's notification stack at about 11 to 16 s; the overlap checks were silenced). Next time put the caption band over the emptiest part of the frame, or let the UI recede under it |
| A chat screen with one bubble on it for seconds (the weakest shot) | **Not fixed in the Zogreo film** (listed as its weakest shot). Next time keep the conversation moving and put the next beat on the frame sooner |
| Labels on screen too briefly to read | reading time is 0.5 s plus 0.3 s per word; last line at least 2 s |

Always render a draft (about 2 minutes for 75 s) and read frames at every beat before the 4K render.

## Frame 0 is the thumbnail and the hook

Frame 0 must already show real content (the question, the product, the result), not a fade from empty
(`first_frame_empty`). The template scene trips this warning on purpose until replaced.

## Checks you will meet and what they mean

- `gsap_timeline_set_initial_hide`: initial hidden states go in `gsap.set(...)`, not `tl.set(..., 0)`.
- `overlapping_gsap_tweens`: two moves on one wrapper overlap. Start the second after the first lands
  (`Math.max(word time, first + duration)`); with real word times, cues drift closer than your plan assumed.
- `text_occluded` under a scrim or a dim: the checker treats an opaque layer as covering the text beneath. Either
  make what is beneath leave (fade the screen to black) or mark the scrim `data-layout-allow-occlusion`.
- Captions need `data-layout-allow-overlap data-layout-allow-occlusion` (`lib/cues.mjs` writes them).
- `text_below_floor`: nothing meant to be read under 28 px at 1080 wide. Small UI that is only texture, because
  the camera is far away, may stay; say so.
- `line_unread`: a deliberate quick glance (a language toggle, a repeated line) can stay; say why in REVIEW.md.
- `panel_out_of_canvas`: a deliberate close-up that crops a phone's edge can stay.
- `duplicate_audio_track`: overlapping sound effects need separate tracks (`writeIndex` allocates them).
- `contrast_aa_failure`: raise the colour; `suggestedColor` is in the report.
- A white flash at a cut means the stage root is not opaque: set `ground` in `createProject`.

## Motion and structure that worked

- One continuous camera across several beats (pull back from a phone to a whole field of messages, then push
  into the next phone) carries a story better than cuts. Tween scale in log space so zooms feel even, on a
  wrapper, never on a timed clip.
- Cut-the-curve seams (exit accelerates, entry continues the same direction, 0.32 s, `power4.in` / `power4.out`,
  8 px blur) between scenes, in one direction per film; the seam gate (`qa.sh`) enforces it. Write `ledger.json`
  through `writeLedger`.
- Type over a busy field needs a scrim (radial, 0.9+ opacity at the centre). A word arriving on the spoken word
  (blur 6 px to 0, 0.16 s) beats a fade-and-slide.
- Shots where a count lands: the number counts up while its objects arrive, a riser (only its audible part) crests
  on the word. Hold 0.3 to 0.75 s before the payoff.
- Show real things: the brochure's logo (SVG), its QR (re-generated from the decoded URL, then decoded again
  from the rendered frame to prove it scans), its photos from `brand/images/`. Draw only what has no source.
- Other scripts on screen (Arabic, Greek) need their own font files with `unicode-range`, `direction: rtl` for
  RTL, and a translation checked by a native speaker (mark it in RESEARCH.md as synthesized).

## Sound

- A film over about 15 s that tells something gets sound on its visible actions. Without a music source (no
  HeyGen sign-in, no local music model) deliver without music and say so; do not synthesise music in code.
- Every effect has a cause on screen (notification on a message, click on a toggle, whoosh on a camera move or cut,
  pop on a landing, riser into the one payoff). Volumes 0.13 to 0.3 under the voice; rotate two or three takes.
- `lib/cues.mjs` places each file so its loudest point lands one frame after the picture. The manifest's
  descriptions are loose (the 10 s riser is audible only from 1.0 to 4.2 s); `sfx_meta.py` measures the truth.

## Numbers

- Narration: 2.2 to 2.8 words per second; keep a scene to about 19 spoken words; a 60 to 80 s film is 130 to 180
  words. A spoken number like "3.73" takes four words of time.
- Captions: phrase breaks authored in `script.json` (`cap`, split on " / "), 3 to 6 words, one group visible,
  44 px, inside 168 to 1330 px vertically on 1080 x 1920 (the platform's UI covers the rest).
- Delivery: render 1080 x 1920 and supersample (`--resolution portrait-4k`) for the 2160 x 3840 master; derive a
  1080p copy with ffmpeg (`render.sh final` does both).

## The Zogreo review: what "good, but not great" turned out to be (2026-11-02)

Measured on the delivered render, then fixed:
- **Frozen picture.** 68% of frames were completely still and 70% of the runtime sat in holds of 1 s or more (longest
  6.5 s). Movement came in bursts, so it read as slides. After the fix: 19% still, 15% in holds, longest hold 3.0 s.
  - Measure it on every draft with the frame-difference scan in `popscan.py`'s method.
  - Fill holds with a route that means something, not wobble: a slow camera travel toward the next subject, the UI doing
    what the line says (a clock running while people wait, a reply streaming in), or a push that continues across a beat.
- **The story dropped its person before the payoff.** The film cut away while the believer was typing and never came back.
  - Make the hand-off (the organization's own impact marker) the climax: big, a beat of stillness first, the camera
    settling in.
  - Close the loop by returning to the opening's home stage (the same lock screen, the next morning, everyone answered).
- **The problem beat was invisible without the voice** ("waiting" tags at 24 px). Show it at reading size: the clock runs
  forward, the camera pushes onto the paused switch.
- **A caption band left behind.** Scenes laid out to clear captions stay top-heavy after the captions are removed;
  re-centre them in the 168-1330 band.
- **Picture against words.** The chat switched away from Arabic on the very words "heart language", and a count-up showed
  2.72x while "3.73" was spoken. Read each beat's frame against its words.
- **A scrim over the subject.** The verse's dark scrim dimmed the one lit card the shot was about. Cut a soft hole in the
  scrim (`mask-image: radial-gradient(...)`) around the subject.
- **Seek-safe camera moves.** Never tween `transformOrigin`: seeking back renders the tween's start state at earlier times
  with the wrong pivot. Scale about the fixed CSS pivot and add a `y` offset: (pivot_new - pivot) * (1 - scale).
- **Sound.** Chimes and pings are banned by the house sound guide, and a single pop file repeated is a tell. Make two
  pitch-shifted takes (`ffmpeg -af asetrate=44100*0.89,aresample=44100`). Put nothing under scripture or the first word,
  and give the riser to the real peak or drop it.
- **A second opinion helps.** An unanchored reviewer given only the contact sheets, the words with timings and a
  description of the sound converged on the same core problems and added sharp, specific ones.

## Making a 16:9 version of a vertical film (learned on Zogreo, 2026-11-05)

Re-compose, never crop (a 16:9 crop of a 9:16 frame keeps a third of it) and never pillarbox. What carried over unchanged was
everything that is not geometry: the narration, `timing.json`, every sound cue, the cue logic in `build.mjs`, the brand assets.
So the audio needs no new spend and no new check, and the stems are the same files.
- **New sibling project**, copied from the vertical one (leave the master alone). Change the canvas literals (about 34 lines),
  `data-resolution="landscape"`, and render with `--preset landscape-4k`.
- **Keep a scene's world in its authored coordinates** and let the camera shift it: `gsap.set(layer, { x: 420, y: ty })` puts a
  1080-wide world in the middle of a 1920-wide frame. A tiny helper `hy(worldY, k)` gives the hook `y` that puts a world point at the
  screen centre at scale k, so camera beats are aimed, not guessed.
- **A tall phone becomes a close-up**: a 1080-px-tall window on its 1780-px height, with the camera panning to the action. Keep text
  at about natural size (28 px floor). Check the window never crops a clock or header in half.
- **Wide frames show far more of a pulled-back field**: widen the generated field to cover the window at the smallest scale.
- **Stacked layouts become two columns** (diagram left, number right; logo and buttons left, QR right). Re-check the left edge
  after any push-in scale: a 1.08 push moves a left-edge bubble 65 px outward.
- **Stills and frames**: use one contact-sheet round, fix, one more round on only the changed moments.

