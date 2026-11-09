# Voice: choosing it, making it, and not fooling yourself about it

Read this before the voice gate (phase 5) and again before rendering narration (phase 7).

## The rule that matters most

**You cannot hear audio, so a person must approve the voice before anything is built on it.** In the first
Zogreo run the voice was picked with an automatic naturalness score (UTMOS), the whole film was built and
rendered at 4K (about 10 minutes of CPU), and only then did the user listen: "not natural at all." The score had
ranked that Piper voice joint-best; the person heard flat, synthetic speech. The voice was not slowed or
damaged (verified: same duration and pitch as the raw model, 0.0 ms drift through the video mixer); it was
simply a weak voice that I had presented as the most natural. Do not repeat either mistake:

- Run `voice_audition.py`, send the mp3s, and wait. It does not rank voices on purpose.
- You may meanwhile author scenes (they depend on the story, not the voice). Do not stamp cues or render.
- If the user has said "no stops", pick the most natural-sounding option you can justify, build, and say
  prominently in the delivery note that the voice was chosen unheard and which clips they can swap in.

## What VoiceStudio can do here

VoiceStudio (jroll12/VoiceStudio, open-source, runs locally) exposes many engines, but only some load in a
sandbox:

| Engine | Needs | Notes |
| --- | --- | --- |
| `sherpa-onnx` (Piper voices) | GitHub release downloads only | Works offline once a voice folder exists. Loads ONE voice, chosen at server start (`vs_server.sh start --model-dir`). Piper "medium" voices are clear but flat. This is what the Zogreo video used. |
| `omnivoice` (VoiceStudio's flagship) | huggingface.co **and an accepted licence** | VoiceStudio refuses with `model_licence_required` until someone accepts the licences in Model Catalogue. It lists CC-BY-NC, Higgs Audio 2 and Meta Llama 3 and flags them non-commercial. Whether a nonprofit promo counts as non-commercial is a decision for the user (or their counsel), not for you. Never accept a model licence on their behalf. |
| `supertonic3`, `kittentts`, `pockettts`, others | huggingface.co | Fail with a weights-download error when the host is blocked. `voice_audition.py --api ... --vs-engines a,b` reports each failure with the reason. |
| `mlx-audio` (Kokoro, Apple Silicon only) | a Mac | Not usable in a Linux sandbox. On the user's Mac it is likely the easiest good voice. |

Kokoro v1.0 (Apache-2.0 model, 54 voices, 24 kHz) runs from the same GitHub downloads through sherpa-onnx,
but VoiceStudio's sherpa engine only builds Piper/VITS configs, so Kokoro runs `--via direct` in `vo.py`
(no VoiceStudio server). Say so in the delivery note: that part of the pipeline is not VoiceStudio.

Piper voices worth knowing (licence is in each model card; `voice_audition.py` prints it):
`en_US-joe-medium` CC0, `en_US-bryce-medium` public domain, `en_US-john-medium` public domain; `en_US-ryan-high`
and `en_US-hfc_male-medium` are CC BY-NC-SA (non-commercial); avoid them for fundraising or commercial use.
Kokoro speaker ids come from the model file (`voice_audition.py` reads them): e.g. am_michael 16, am_adam 11,
am_eric 13, af_heart 3.

## Three ways to get the narration

1. **Render here** (`vo.py render --via voicestudio|direct`). Fastest; voice quality is limited by what loads.
2. **The user records it** (a person, or VoiceStudio/OmniVoice/Kokoro-mlx on their own Mac). They give you one
   audio file of the whole script; `vo.py take --audio take.wav` aligns it and writes the same
   `build/timing.json`, so nothing downstream changes. This is the best-sounding route for a donor appeal.
   Give them `script.json`'s text and tell them the pronunciation you need. Verified: aligning the shipped
   Zogreo narration as if it were an external take matched the word times the film was built from within a median
   of 34 ms after a constant 30 ms offset (95th percentile 122 ms, worst word 371 ms): fine for captions.
3. **Allow the model host.** If huggingface.co is blocked, tell the user which domain to add under the
   environment's network settings (Allowed domains). Do not work around the block.

## Pace, pauses, effects

- Pace: narration reads at 2.2 to 2.8 words per second. The slowest Piper voice auditioned (2.58 w/s) felt
  drawn out once 1 s pauses were added between separately rendered sentences. Prefer voices at 2.8+ w/s or
  raise `--speed` to 1.1 to 1.2 (check the clip, it can start to sound rushed). Keep pauses to what the story needs.
- Each line is rendered on its own, so intonation does not carry across sentences. Write lines that stand alone,
  and avoid sentences that depend on the previous one for emphasis.
- Effects: `--effect-preset raw` (default) is untouched model output. VoiceStudio's `broadcast` preset adds
  about +5 dB, a +2 dB treble lift and a gentle leveler: measured, mild, but it made a bright voice brighter.
  Use it only if the clip with it sounds better to the user.
- Loudness: `vo.py` normalises to -16 LUFS / -1.5 dBTP. Music (if any) sits near 0.14 volume under it.

## Pronunciation

- Put respellings in `script.json` `"pronunciation"`. In VoiceStudio mode they go into VoiceStudio's own
  dictionary (`POST /pronunciation`); in direct mode they are applied to the text. Numbers are left to each
  engine's text normaliser ("3.73" becomes "three point seven three").
- Check what an engine will really say: `espeak-ng` phonemes are what Piper and Kokoro use. A spelling that
  looks right can read wrong ("Dz..." is read as the letter D: "dee-zoh"; English words cannot begin with /dz/
  in espeak). Try 3 or 4 respellings and listen; if the exact sound is unreachable, say what you delivered.
  (Zogreo wanted "dzoh-GRAY-oh"; the reachable result was "zoh-GRAY-oh". It was disclosed, not hidden.)
- **A reference recording beats a respelling.** The user can record the word on their phone. You cannot hear it, but you can measure it:
  transcribe it, then compare syllable peaks (intensity maxima), the gap between them, which syllable carries the pitch peak, and the
  total length against 3 or 4 respellings rendered by the same voice. Send those renderings for the user to pick by ear. Zogreo's result:
  **"Zo-GRAY-oh"** (stress on GRAY, light "oh"), chosen by Jarret on 2026-11-09. Then re-take every scene that says the name; a new
  respelling is a full re-take of those scenes, not a patch. Keep the clip in the repo (`assets/brand/pronunciation/`). Measurements show
  rhythm and stress, never vowel quality: the user's ear decides.
- `vo.py` prints `VERIFY BY EAR` when the recogniser transcribes a product name very differently from the
  script. A recogniser's spelling of a rare name is weak evidence either way; treat the flag as "listen here".
- On-screen text can state the intended pronunciation ("DZOH · GRAY · OH") even when the voice cannot.

## Verifying a take without ears

`build/vo_report.json` has, per line: what Parakeet heard, word error rate against the script, seconds, words per
second, and name checks. Lines with WER above 0.25 are listed. Also compare pace across lines for oddities, and
confirm the final file with `ffmpeg -af ebur128=peak=true`. None of this tells you the voice sounds good; it
tells you the words are right and the levels are sane. Say exactly that in the delivery note.

## ElevenLabs (when the organization has an account)

Set up in the Zogreo project on 2026-11-01; not yet used to make audio. Facts, as found:
- `npx -y @elevenlabs/cli@latest onboard init` writes `.env.local` and a `.gitignore` entry, then stops and tells the
  agent to ask the user to add a key by hand when no browser can reach the machine (as in a cloud sandbox). It forbids
  opening or printing the env file, asking for a key in chat, or trying speech before the user agrees.
- `elevenlabs.io` and `api.elevenlabs.io` were blocked by the sandbox's network policy. The user must allow
  `api.elevenlabs.io` and put the key in the environment as `ELEVENLABS_API_KEY` (a new session picks it up, and a new
  session starts without the project: upload the project zip). A secret in the environment is safer than `.env.local`:
  files in the project can be zipped or published, and `render.sh` now excludes `.env*` from its zip.
- Current model id is `eleven_v4` (released late September 2026; inline audio tags, 90+ languages). Whether its
  pronunciation controls can reach an unusual name was not documented in what was found; test with a sample.
- Auditioning voices spends credits and makes speech: ask first, send level-matched clips, wait for the user's pick.

## Continuous takes, never stitched sentences (learned on the Zogreo review, 2026-11-02)

The Hale (ElevenLabs) cut sounded "good, but not great, something's off". The measured causes:
- **11 separate requests, butted together.** Between sentences the narration dropped to exact digital silence for 0.4-1.2 s,
  while inside sentences the voice kept its own pause tone. The ear hears the room switch off.
- **Each sentence restarted as its own read.** Every line was a full ad-style pitch arc (12-19 semitones), and lines
  restarted 9-15 semitones above where the last one ended.
- **The hushed opening was read fastest** (3.0-3.2 words/s).

What fixed it:
- `scripts/el_takes.py`: one request per scene, with plain v4 direction tags (`[warm, natural, conversational]`, `[warmly]`).
  Joins are filled with tone taken from the voice's own pauses at their median level (-86 dBFS for Hale; the voice's
  breathy pauses run 25 dB louder and would hiss at the joins).
- **Re-take a single paragraph when one line misbehaves.** The hand-off came out at 3.8 words/s and was re-taken at
  3.1 by cutting the scene take at a pause and joining the new paragraph with room tone.
- **v4's `speed` setting barely moves the pace** (floor about 2.8 words/s). Direction tags change the pitch range a lot:
  the opening went from 12-15.5 to 7.5-12 semitones.
- **Test before the full take.** Render the first 20 s in two directions (about 300 characters each) and let the user
  choose first.
- **`vo.py take` must judge line ends against the whole take, not each tail.** With room tone (not digital silence) after
  a line, a tail-relative threshold ran the line's end into the next line and pushed a scene cut on top of the next
  sentence. Fixed in `vo.py`; check that every line ends in quiet.

## Do not direct the voice to fit the theme (learned on the Zogreo round 3, 2026-11-04)

The review pass asked ElevenLabs for "[softly, unhurried, late at night]" at speed 0.9, with "..." and a long pause, to match
the 2 a.m. story. The user's verdict: "creepy". Measured against the rest of the same film, the hushed opening had a
**median pitch of 100 Hz (the rest: 118-125)**, **1.3-1.6 dB less harmonics-to-noise (breathier: 6.7 against 8.0-8.3)** and a
**narrower pitch range**. A low, breathy, flat voice reads as menace, not intimacy.
- Direct the voice for the *speaker* (warm, natural, conversational), not for the *scene*. The picture carries the hour.
- Avoid whisper and hush cues, `speed` below 1, ellipses and "[long pause]" inside a take.
- Check the opening against the rest with `parselmouth` (median F0, mean harmonicity): if the opening is more than about
  15% lower in pitch or 1 dB breathier than the rest of the film, re-take it.
- When one paragraph misbehaves (here the hand-off line at 3.96 words/s), cut the scene take at a pause and re-take only
  that paragraph (see above); the joins are filled with the voice's own pause tone.
- To swap voices after delivery, change `voice_id` in `tools/el.py` and re-run `el_scenes.py` (about 1,000 characters).

