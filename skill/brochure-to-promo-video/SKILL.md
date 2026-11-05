---
name: brochure-to-promo-video
description: Turns an uploaded brochure, flyer, one-pager or deck, plus any supporting information about a product, program or ministry, into a finished vertical promo or donor-appeal video. It produces a researched claims register that separates verified facts from the organization's own claims and from creative choices, a script, narration made with the open-source VoiceStudio, HyperFrames visuals (HTML rendered to video, not cartoon animation) in the brochure's own fonts and colours, captions, sound effects, and a 4K plus 1080p render with the editable project. Use this whenever the user uploads or points to a brochure, flyer, one-pager, product sheet or deck and wants a promo, intro, explainer, appeal, launch or "video version of this", or says "make one like the Zogreo video", even if they never name HyperFrames or VoiceStudio.
---

# Brochure to promo video

Makes a 45 to 90 second vertical (9:16) video from a brochure and whatever else the user supplies, using local
open-source tools: **HyperFrames** (HTML rendered to video) for visuals and **VoiceStudio** for the voice. No paid
services, no cartoon animation. It was first built for Zogreo; `examples/zogreo/` is the worked example.

`$SKILL` below is the folder this file is in. Scripts are in `scripts/`; read a reference file when its phase comes up.

## Ground rules (and why)

1. **The brochure is the source of truth for words, brand and the ask.** Reuse its phrases, fonts, colours, logo,
   and the URL its QR code really points to. A video that looks like the brochure is trusted like the brochure.
2. **Keep three kinds of statement apart, in the file and in your message:** independently verified (you checked an
   outside source), supplied by the organization (used as given), and synthesized (your story, examples,
   translations, wording). Never invent a number, quote, beneficiary or testimonial; an example conversation is
   labelled illustrative. The user will pass this to leadership, who need to know which is which.
3. **You cannot hear audio.** The first Zogreo voice was picked by an automatic score, the whole film was rendered,
   and the user's verdict was "not natural at all." So a person approves the voice before anything is built on
   it (phase 5), and you never say a voice "sounds natural": say what you measured.
4. **Say what you could not do.** Blocked websites, a voice route that is not VoiceStudio, no music, an unverified
   figure, a translation nobody fluent has read: all go in the delivery note.
5. **Do not decide for the user:** accepting model licences (some VoiceStudio voices are non-commercial), posting
   anywhere, approvals. Never copy passwords or tokens you see in internal pages into any output.
6. **Scope each phase:** know its input and expected output before starting, run independent phases together, and
   match effort to the ask (a one-line tweak is not a six-phase run).

## The run

| # | Phase | In | Out | Runs alongside |
|---|---|---|---|---|
| 0 | Environment | repos, network | `~/promo-env/env.sh`, installs in background | everything below |
| 1 | Intake | brochure + other files | `brand/` (text, fonts, palette, QR, links, images) | 0 |
| 2 | Research and claims register | `brand/`, connectors, web | `RESEARCH.md` | 0 |
| 3 | Storylines and spec | 1, 2 | `STORYLINES.md`, `SPEC.md` | 0 |
| 4 | Script | 3 | `script.json` (lines, caption breaks, pronunciations) | 0 |
| 5 | **Voice gate** | script | audition mp3s, **the user's choice** | 6 |
| 6 | Scenes | spec, brand | `src/*.html`, `tools/build.mjs` | 5 |
| 7 | Narration and timing | choice, script | `assets/vo/vo.wav`, `build/timing.json` | |
| 8 | Build, QA, draft | 6, 7 | clean checks, read frames, draft mp4 | |
| 9 | Final render and delivery | 8 | 4K, 1080p, poster, zip, notes | |

The project is vertical (1080 x 1920) by default; `scaffold.sh <slug> --landscape` makes a 1920 x 1080 one, and `render.sh <project> final --preset landscape-4k`
delivers it at 4K with a matching 1080p copy. A second shape of an existing film is a new sibling project that reuses its narration, timing and
sound unchanged: only the scene layouts are redone (`references/authoring-notes.md`, "Making a 16:9 version").

Scenes (6) depend on the story, not on which voice is chosen, so author them while the user listens to
auditions. Cues and render wait for the real timing.

### 0. Environment: start first, it is slow
```bash
bash $SKILL/scripts/setup_env.sh start      # add --no-voicestudio if you will use an external take or --via direct
source ~/promo-env/env.sh                   # TOOLS_PY, HF_CLI, VS_PY, PROMO_MODELS ...
bash $SKILL/scripts/setup_env.sh status     # later: what has finished, what failed
```
It finds the two repos (attach `jroll12/hyperframes` and `jroll12/VoiceStudio`, or clone them, if missing),
probes the network, builds HyperFrames, and installs VoiceStudio's environment (about an hour in a throttled
sandbox) and the voice and speech-recognition models in the background. If it reports a blocked host you will
need (huggingface.co for better voices, the product's website), tell the user which domain to allow, once, now.
Details and traps: `references/sandbox-notes.md`.

### 1. Intake
```bash
$TOOLS_PY -I $SKILL/scripts/extract_brochure.py <brochure and other files> --out brand
```
Run it from the folder where the project will live (scaffold copies `./brand` into the project). Read `brand/summary.md` and `brand/text.txt`, and **look at** `brand/pages/*.png` (palette roles are a guess;
sample exact hex from a flat region). It gives the real fonts, the QR target, links and embedded images. Read
whatever else the user points to through connectors (Drive logos, Confluence brand pages, Slack decisions),
read-only. Ask the user only what the brochure cannot answer and you cannot default: who must approve it, the goal
(donate, book a call, sign up), and how the product name is pronounced. Defaults to state, not ask: 9:16,
60 to 80 s, the brochure's own call to action.

### 2. Research and claims register
Fill `RESEARCH.md` (template: `templates/RESEARCH.md`). Check every outside fact at its source (scripture
wording, definitions, statistics, dates) and cite the link; list the organization's own claims with their file;
list conflicts between the organization's documents (use the brochure's figure, flag the conflict). Note what was
unreachable. If the product is an Apologist Project one, read `references/house-rules.md` (approval tiers,
"never lead with the product", separate brands) and run the theological claim check.

### 3. Storylines and spec
Write three different films in `STORYLINES.md`, recommend one, take it unless the user chose another
(`references/scene-patterns.md` for devices by product type). Then `SPEC.md`: every adjective becomes a number
(hex, px, frames), and the banned defaults are named. The brochure's order (need, mechanism, proof, ask) is
usually the right order; open on a person or moment, not on the product.

### 4. Script
`script.json`, using the template's shape. One idea per line, sayable in a breath; 130 to 180 words for a
60 to 80 s film; about 19 words per scene; plain wording from the brochure; no hype words, no em dashes on screen,
no number the brochure lacks. Author caption phrase breaks (`"cap": "a / b / c"`, 3 to 6 words each) and the
pronunciation respellings. Frame 0 must already show the hook.

### 5. Voice gate
```bash
$TOOLS_PY -I $SKILL/scripts/voice_audition.py --script script.json --out auditions   # Piper + Kokoro, level-matched mp3s
```
Send the clips (`SendUserFile`), say which engines could not run and why, and wait for the user's pick. Do not rank
them yourself. Options, licences and traps (OmniVoice needs huggingface.co and an accepted non-commercial
licence; the user may prefer to record or generate the voice on their own machine): **`references/voice.md`,
read it now.** If the user said "no stops", choose, build, and flag the voice as unheard.

### 6. Scenes
```bash
bash $SKILL/scripts/scaffold.sh <slug> --parent <dir>      # vertical project + lib + templates + GSAP + sound effects
cd <slug>-promo
$TOOLS_PY -I $SKILL/scripts/fonts.py --from-fonts-json brand/fonts.json   # brochure fonts as local @font-face (scaffold copies ./brand in)
```
Write `src/<scene>.html` and edit `tools/build.mjs` (see `examples/zogreo/`; patterns in
`references/scene-patterns.md`; lessons in `references/authoring-notes.md`). Use the brochure's real logo, photos
and a QR regenerated from the decoded URL (`segno`), then decode it again from a rendered frame. The HyperFrames
skills in `$HF_REPO/skills/` and `.claude/skills/motion-doctrine` are the authority on the render contract; read
`skills/hyperframes/SKILL.md` and `references/types/vertical.md` before writing scenes.

### 7. Narration and timing
```bash
$TOOLS_PY -I $SKILL/scripts/vo.py render --via voicestudio --api http://127.0.0.1:8765   # after: vs_server.sh start --model-dir <piper voice>
$TOOLS_PY -I $SKILL/scripts/vo.py render --via direct --model-dir $PROMO_MODELS/kokoro-multi-lang-v1_0 --kokoro-sid 16
$TOOLS_PY -I $SKILL/scripts/vo.py take --audio their-take.wav                              # a recording you were given
```
Writes `assets/vo/vo.wav` and `build/timing.json` (every word's start and end, from speech recognition on the
audio itself), and `build/vo_report.json`. Read the report: lines over 0.25 word error and every `VERIFY BY EAR`
name flag go in your delivery note. If the voice is Kokoro (direct), say it did not go through VoiceStudio.
Stop the server with `vs_server.sh stop`, never `pkill`.
With an ElevenLabs account, use `scripts/el_takes.py` (one continuous take per scene; joins filled with the voice's own
pause tone), then `vo.py take`. Never butt single sentences together: it is the most audible "something's off" there is
(`references/voice.md`).

### 8. Build, QA, draft
```bash
node tools/build.mjs                                  # stamps every cue, caption and sound from timing.json
bash $SKILL/scripts/qa.sh .                           # lint, check, seam gate, snapshot sheets
(bash $SKILL/scripts/render.sh . draft > render.log 2>&1 &); until grep -q 'RENDER DONE\|RENDER FAILED' render.log; do sleep 5; done
bash $SKILL/scripts/qa.sh . --video renders/draft.mp4 # pop scan, loudness, file facts
```
Passing checks is not done. Measure the draft's stillness (target: under 35% of frames fully still, no hold over 2 s before
the end card) and open the sheets `qa.sh` prints and describe each beat as a stranger would; fix P0
(unreadable, wrong, broken) and worthwhile P1 (dead stretch, jump at a cut). `references/authoring-notes.md`
lists the defects that passed every check last time. Re-run `build.mjs` after any change to timing.

### 9. Final render and delivery
```bash
(bash $SKILL/scripts/render.sh . final > render.log 2>&1 &); until grep -q 'RENDER DONE\|RENDER FAILED' render.log; do sleep 10; done
```
About 10 minutes for 75 s on CPU. With no music yet, also write stems (`scripts/stems.py --video <render>`: narration,
effects, mix, matched to the rendered level) and a music cue sheet. It writes the 2160 x 3840 master, a 1080p copy, a poster frame and a project
zip. Verify the file (size, fps, frame count, audio as long as the picture, a still end card, the QR scans from a
frame), then send: master, 1080p, poster, `RESEARCH.md`, the project zip. Environments are ephemeral, so the zip
is the copy to keep.

## The delivery message

Short, in this order: what needs the user's decision or a human's eyes (approvals, a translation, a conflicting
figure, the voice), then what you chose, then verified versus supplied versus synthesized (point at `RESEARCH.md`),
then what you measured versus only looked at (sound was measured, not heard), then limits. Write `REVIEW.md` with
the same content for the next session. Offer a shareable page of the claims register if others will review it.

## When something breaks

| Symptom | Go to |
|---|---|
| Install stalled, host unreachable, a command hangs or kills your shell | `references/sandbox-notes.md` |
| Voice not natural, pronunciation wrong, engine will not load, licence prompt | `references/voice.md` |
| A check or lint finding, a blank frame at a cut, text clipped, a popping frame | `references/authoring-notes.md` |
| Which story device, how a pattern was built | `references/scene-patterns.md` |
| Organization rules, approvals | `references/house-rules.md` |

Add a line to the matching reference whenever a run teaches something new; these files are how the next run starts smarter.
`scripts/selftest.sh` runs the quick sanity checks after you edit a script.
