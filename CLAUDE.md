# promo-videos: how to work here (read this first, keep replies short)

Skill: `.claude/skills/brochure-to-promo-video` (loads automatically). Zogreo is spoken as **"Zo-GRAY-oh"** (stress on GRAY, light "oh" at the end), set by Jarret's reference clip `zogreo-intro-9x16/assets/brand/pronunciation/`. Send exactly that respelling to ElevenLabs (`spoken_elevenlabs` in `tools/script.json`), every video, every scene that says the name.

## Layout
- `zogreo-intro-9x16/`, `zogreo-intro-16x9/`: finished film, both shapes. Brand assets (logo, fonts, QR, palette) are in `zogreo-intro-9x16/assets/brand` and `assets/fonts`: reuse them, do not re-extract.
- `nefes-case-study-9x16/`: the NEFES case-study film (no phone UI; scenes built from a map, a study path, dot charts and quotations). Its `tools/vo_take.py` times the narration take by take; use it instead of plain `vo.py take` when a narration is longer than about 30 s.
- `nefes-case-study-16x9/`: its 16:9 sibling (same audio and timing; scenes re-composed in two columns).
- New video = new folder `<name>-9x16/` (copy the nearest existing project, then change scenes and script). 16:9 is a second sibling reusing the same audio.
- Never commit `.env*`, renders or key material. Final mp4s go to Drive; send them with SendUserFile.

## Cheapest path for a new video (about 30 to 60 s, same look and voice)
1. Input: script text + (optional) new brochure. Voice: ElevenLabs Jason `ILP9IN5fT2Jr2fSfmoNh`, plain direction `[warm, natural, conversational]`, one continuous take per scene (`tools/el_scenes.py`). Needs `ELEVENLABS_API_KEY` in the environment secrets.
2. Claims: any product claim not in the flyer or script is "supplied", not verified. List them in `RESEARCH.md`; do not invent numbers.
3. Reuse, do not rebuild: `tools/build.mjs`, scene templates in `src/`, seam and cue logic. Write only new scenes.
4. One draft render, read frames once, fix, then one final render (4K plus 1080p).
5. Do the 16:9 only if asked, as a sibling project.
6. Commit and push the source (no renders) at the end of each video.
7. End every reply with a one-line model and effort recommendation for the next step.
