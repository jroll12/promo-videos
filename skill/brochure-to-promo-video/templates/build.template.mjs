#!/usr/bin/env node
// Product build: name each scene's cues from the narration's word times, generate artwork, place sound.
// Everything generic (captions, sound placement, index.html, ledger) comes from cues.mjs.
// See examples/zogreo/build.mjs in the skill for a finished three-scene build.
//
//   node tools/build.mjs [projectRoot]
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createProject, r3 } from "./cues.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(here, "..");

// ground = the opaque stage colour (prevents a white flash at cuts); captionFont = an alias from build/fonts-map.json
const p = createProject(ROOT, { ground: "#F7F4EC", captionFont: '"Inter PV"' });
const { L, W } = p;
const first = p.script.lines[0].id;

// ── cues: one object per scene, every time taken from a spoken word ────────
const intro = { words: L[first].words.map((w) => w.start) };
const total = r3(Math.max(...Object.values(L).map((l) => l.end)) + 3.2); // narration end + a held end card

// ── sound: every effect needs a cause on screen; names are in build/sfx_meta.json ──
p.sfx("pop", intro.words[0], 0.2);

// ── write ──────────────────────────────────────────────────────────────────
p.writeScene("intro", intro, { WORDS: L[first].text.split(" ").map((w) => `<span class="w">${w}</span>`).join(" ") });
const caps = p.writeCaptions();
p.writeIndex(total, [{ id: "intro", start: 0, dur: total }]);
p.writeCues(total, { intro });
// With 2+ scenes: p.writeLedger([...seams]) for the seam gate, and p.writeEvents({name: seconds}) for the pop scan.
p.writeEvents({});
console.log(`built: ${total}s · ${caps.length} caption groups · ${p.cues.length} sfx`);
