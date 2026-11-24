# 3 a.m. Question (9:16)

Year-end giving film for The Apologist Project. 1080x1920, 30 fps, 21.9 s, H.264 + AAC.

## Build

```bash
node tools/render.mjs video          # -> build/3am-question-9x16.mp4 (about 2 min)
node tools/render.mjs stills <dir> 1.25 6.6 8.5 15.5 20      # check frames
node tools/render.mjs frames <dir> 7.2 21.9 --nobg            # stillness test frames (no blob, no grain)
python3 tools/make_qr.py             # regenerate assets/brand/qr-give.svg
```

`src/film.html` is a pure function of time: `renderAt(t)`. Every frame renders exactly the same way each time.
Timeline constants are in the `T` object at the top of the script.

## Timeline (seconds)

| Scene | Span | Events (beat-snapped; beat about 0.4235 s, music enters 1.14) |
|---|---|---|
| 1 The hour | 0.0 to 3.2 | 2:59 rolls to 3:00 at 1.14 (music entry), slow push |
| 2 The question | 3.2 to 10.7 | box 3.26, typing 3.9 to about 6.1, send 6.65, dots 7.49 |
| 3 Don't make them wait | 10.7 to 16.9 | headline 1 10.87, headline 2 12.99, sub 14.26 |
| 4 Give | 16.9 to 21.9 | Give at 17.0, QR 17.4, URL 17.9, logo 18.4 |

Music: Jarret's Suno track "Warm Hope" (`assets/music/song-source.m4a`, from his screen recording), delayed 1.1 s so the
big hit lands at 16.90 s (measured in the final mix: +11 dB jump at 16.9).

## Claims and links (supplied, not verified here)

- $50,000 dollar-for-dollar match from Steve, through Dec 31, 2026 (film says only "Donations double through Dec 31.").
- Give link `https://secure.qgiv.com/for/theapologistproject`: supplied by Jarret, still to be confirmed with the team.
- "South Korea, 3:00 a.m." and the question are presented as a real question; source not checked here.

## Assets

- Logo: `assets/brand/apologist-ai.svg`, the dark-background logo SVG served on apologist.ai (paths unchanged).
- Fonts: Outfit 600/700 (Fontsource, Google Fonts files), Inter 400/500.
