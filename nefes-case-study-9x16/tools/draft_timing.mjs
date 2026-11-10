#!/usr/bin/env node
// DEVELOPMENT ONLY. Writes an ESTIMATED build/timing.json so the scenes can be laid out and checked before
// the narration exists. It is marked "provisional": tools/build.mjs then leaves the voice track out and prints a
// warning. The real file comes from the narration itself:
//
//   python tools/el_scenes.py                                             # the takes (ElevenLabs, Jason)
//   $TOOLS_PY -I <skill>/scripts/vo.py take --script tools/script.json --audio el-scenes/take.wav
//
// The estimate uses Jason's measured pace in the intro film (about 3 words a second inside a line) and the same
// gaps tools/el_scenes.py puts between the takes.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
if (fs.existsSync(path.join(ROOT, "build/timing.json"))) {
  const cur = JSON.parse(fs.readFileSync(path.join(ROOT, "build/timing.json"), "utf8"));
  if (!cur.provisional) throw new Error("build/timing.json is a real take; refusing to overwrite it with an estimate");
}
const script = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/script.json"), "utf8"));
const RATE = 3.0; // words per second
const GAP_AFTER = { L2: 1.0, L5: 1.15, L7: 1.15, L10: 1.25 }; // el_scenes.py gaps plus the trimmed edges of each take
const IN_TAKE = { L1: 0.75, L9: 0.75 }; // the [pause] tags
const r2 = (x) => Math.round(x * 100) / 100;

let t = 0.45;
const lines = script.lines.map((l) => {
  const toks = l.text.split(/\s+/);
  const weight = (w) => (/^[\d.]+$/.test(w.replace(/[.,:]$/, "")) ? 4 : Math.min(2, Math.max(0.55, w.replace(/[^A-Za-z]/g, "").length / 4.6)));
  const start = t;
  const words = toks.map((w) => {
    const d = weight(w) / RATE;
    const o = { w, start: r2(t), end: r2(t + d * 0.92) };
    t += d + (/[.?!:]$/.test(w) ? 0.32 : /,$/.test(w) ? 0.14 : 0);
    return o;
  });
  const end = words[words.length - 1].end;
  t = end + (GAP_AFTER[l.id] ?? IN_TAKE[l.id] ?? 0.4);
  return { id: l.id, text: l.text, start: r2(start), end: r2(end), words };
});
const out = {
  provisional: true,
  engine: "ESTIMATE (tools/draft_timing.mjs); no narration has been recorded",
  voice: "none yet",
  duration: r2(lines[lines.length - 1].end + 0.7),
  lines,
};
fs.mkdirSync(path.join(ROOT, "build"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "build/timing.json"), JSON.stringify(out, null, 1) + "\n");
console.log(`ESTIMATED timing: ${out.duration}s · ` + lines.map((l) => `${l.id} ${l.start}-${l.end}`).join(" · "));
