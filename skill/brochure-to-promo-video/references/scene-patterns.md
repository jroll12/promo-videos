# Scene patterns and choosing a story device

The finished Zogreo film (`examples/zogreo/`) is the worked example: three scenes, 75 s, built with
`lib/cues.mjs`. Read `examples/zogreo/build.mjs` first (cues from word times), then the scene it drives. Copy a
pattern's structure, never its content.

## Choosing the story (phase 3)

Write three storylines that are three different films (a device and a form each), recommend one, and keep the
rest in STORYLINES.md. Start from the brochure's job: what must a viewer understand, believe, and do?

| If the product is... | Devices that tend to work | Watch out for |
| --- | --- | --- |
| Software or an AI service | A moment in someone's day that creates the need; the product's own screens doing the task; one real input carried through | Mock UIs must look like the real product (use brochure screenshots if any); a fake conversation or user is "illustrative", say so |
| A ministry, nonprofit program or appeal | One person's situation, then the scale of need, then the mechanism, proof, and the ask (the Zogreo shape) | Never invent a beneficiary, quote or statistic; testimonials only verbatim from the brochure; ask exactly as the brochure asks |
| A physical product | The product doing its job in a real setting, from the brochure's own photography | Do not draw a product that has photos; do not claim specs the brochure lacks |
| An event or course | A countdown or a day-in-the-life; the one date, place and registration link on a held end card | Dates and prices only from the brochure; verify they are current |
| A data-heavy offer | One real number earned by a scene, then made physical | One number per shot; no chart you cannot source |

The brochure's order is usually the order a donor or buyer needs: need, mechanism, proof, ask. Keep it, but
open on a person or a moment, not on the product (see house-rules if the organization says "never lead with the product").

## Patterns in the Zogreo example (where to look)

| Pattern | What it does | File |
| --- | --- | --- |
| Phone lock screen + notification stack | Frame-0 hook that shows the real question; cards pour in on the narration; "waiting" tags ripple; a toggle flips | `src/night.html` (#nt-lock, #nt-stack, #nt-ad) |
| Hook camera on a phone | Slow push on the first object, a second push on the next spoken beat, pull out as more arrive | `night.html` (#nt-hook; `hookA/hookB` cues) |
| Pull back to a field | One message becomes one of hundreds: a seeded generated SVG field, camera scale tweened in log space | `night.html`, `build.mjs` `fieldSvg()` |
| Type over a field, word by word | A verse arrives on the spoken words over a scrim; a reference line after | `night.html` (#nt-verse, #nt-scrim) |
| Name reveal | Letter by letter on the spoken name, pronunciation guide on the next word, definition on the next | `night.html` (#nt-name, #nt-pron, #nt-def) |
| Chat thread with a language toggle | The AI's reply in the seeker's language; the toggle flips the whole thread to English | `night.html` (#nt-thread, #nt-lang) |
| Count-up stat with objects arriving | 1.00x to 3.73x while 22 more bubbles pop in; a riser crests on the word | `src/proof.html` |
| Connection lines drawing from a source | "It multiplies them": a dash-offset line from the team to every seeker | `proof.html` (.pf-l) |
| Held CTA card | Logo wipe, tagline, give button, book-a-call pill, QR, org line; holds 3 s | `src/give.html` |
| Cut-the-curve seams | Exit accelerates left, entry continues left; second seam goes up | end of each scene file; `ledger.json` |

## Building a new scene

1. Write the scene as `src/<name>.html` inside `<template>`: styles first (with `/*{{FONTS}}*/`), markup, then a
   script that builds one paused timeline and registers `window.__timelines["<name>"]`. Put every cue the script
   needs in `const T = /*{{T}}*/ {};`.
2. In `tools/build.mjs`, compute `T` from word times (`W("L3", "ads")`) and call `p.writeScene("<name>", T)`.
3. Scene roots are `#root`, sized with `inset: 0`; ids unique across the film (prefix per scene); `fromTo`, not `from`.
4. Anything that must be on screen at the cut belongs in the scene from its first frame.
5. Generated artwork (fields, rings, links) comes from a seeded generator (`rng`) so builds are repeatable.
