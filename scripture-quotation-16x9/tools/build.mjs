#!/usr/bin/env node
// Builds the Scripture Quotation explainer from one timing file: every scene cue, caption and sound is stamped
// from the narration's word times in build/timing.json (provisional estimate, or the real take from el_scenes.py).
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const rd = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => {
  fs.mkdirSync(path.dirname(path.join(ROOT, p)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, p), s);
};
const r3 = (x) => Math.round(x * 1000) / 1000;

const timing = JSON.parse(rd("build/timing.json"));
const script = JSON.parse(rd("tools/script.json"));
const sfxMeta = JSON.parse(rd("build/sfx_meta.json"));
const L = Object.fromEntries(timing.lines.map((l) => [l.id, l]));
const norm = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
function W(id, word, occ = 1) {
  let n = 0;
  for (const w of L[id].words) if (norm(w.w) === norm(word) && ++n === occ) return w.start;
  throw new Error(`"${word}" not found in ${id}`);
}
function WE(id, word, occ = 1) {
  let n = 0;
  for (const w of L[id].words) if (norm(w.w) === norm(word) && ++n === occ) return w.end;
  throw new Error(`"${word}" not found in ${id}`);
}

// ── scene boundaries ────────────────────────────────────────────────────────
const cut1 = W("L2", "model") - 0.3; // hook → engine on "A model writes"
const cut2 = Math.max(L.L4.start - 0.3, W("L3", "method") + 1.25); // engine → results, after "the method" has landed
const cut3 = L.L7.start - 0.3; // results → how
const cut4 = L.L9.start - 0.3; // how → end
const total = r3(L.L9.end + 2.6);

// ── cues (each relative to its own scene's start) ───────────────────────────
const hook = { wrong: W("L1", "wrong"), bug: W("L2", "bug"), exit: cut1 - 0.32 };

const e0 = cut1;
const engine = {
  writes: W("L2", "writes") - e0,
  likely: W("L2", "likely") - e0,
  guess: W("L2", "guess") - e0,
  drift: W("L2", "drift") - e0,
  fix: W("L3", "fix") - e0,
  smarter: W("L3", "smarter") - e0,
  settings: W("L3", "settings") - e0,
  method: W("L3", "method") - e0,
  exit: cut2 - 0.32 - e0,
};
engine.wordStep = Math.max(0.12, Math.min(0.3, (engine.likely - engine.writes - 0.2) / 5));
engine.smarter = Math.max(engine.smarter, engine.fix + 0.55);
engine.settings = Math.max(engine.settings, engine.smarter + 1.0);

const r0 = cut2;
const values = [32.6, 48.5, 93.0, 96.2, 100]; // English exact quotation, PDF p.2 and p.29 (see RESEARCH.md)
const results = {
  five: W("L4", "five") - r0,
  count: WE("L4", "33,000") - r0,
  ladder: L.L5.start - r0,
  fills: [W("L5", "Alone,"), W("L5", "web"), W("L5", "Handed"), W("L5", "lookup"), W("L6", "One")].map((t) => t - r0),
  tag: W("L6", "English") - r0,
  exit: cut3 - 0.32 - r0,
};
results.ladder = Math.max(results.ladder, results.count + 0.45);
results.fills[0] = Math.max(results.fills[0], results.ladder + 0.3);

const h0 = cut3;
const how = {
  placeholder: W("L7", "placeholder,") - h0,
  software: W("L7", "software") - h0,
  fills: W("L7", "fills") - h0,
  exact: W("L7", "exact") - h0,
  source: W("L7", "source.") - h0,
  fails: W("L8", "fails,") - h0,
  noverse: W("L8", "no") - h0,
  gap: W("L8", "gap") - h0,
  exit: cut4 - 0.32 - h0,
};
how.exact = Math.max(how.exact, how.fills + 0.75);

const d0 = cut4;
const end = { read: W("L9", "Read") - d0, url: W("L9", "apologist.ai.") - d0, total: total - d0 };
const round = (o) => JSON.parse(JSON.stringify(o, (k, v) => (typeof v === "number" ? r3(v) : v)));

// ── generated markup ────────────────────────────────────────────────────────
function hookRows() {
  // the reply drawn as text bars; five segments (".drift") are the words that come back wrong
  const rows = [[130, 80, 180, 110, 130], [110, 190, 130, 170], [170, 110, 160, 140], [120, 150, 200, 100], [170, 140]].map((r) => r.map((w) => Math.round(w * 1.8))); // 16:9: rows under 1300 px // each row under 700 px (inner width 752)
  const drift = new Set(["0:3", "1:1", "2:2", "3:0", "3:2"]);
  return rows
    .map((segs, r) => {
      let x = 0;
      const s = segs.map((w, i) => {
        const el = `<div class="hk-seg${drift.has(`${r}:${i}`) ? " drift" : ""}" style="left:${x}px;width:${w}px"></div>`;
        x += w + 26;
        return el;
      });
      return `<div class="hk-row" style="top:${120 + r * 84}px">${s.join("")}</div>`;
    })
    .join("\n          ");
}
const names = [
  ["Model alone", "Unassisted, from memory"],
  ["Web search", "Open web search"],
  ["Handed the passage", "Simulated RAG, best case"],
  ["Lookup tool", "Tool calls to a Bible API"],
  ["Output transform", "Placeholder, then the exact text"],
];
const ladderRows = names
  .map(([n, s], i) => `<div class="rs-row" id="rs-r${i}" style="top:${140 + i * 126}px"><div class="rs-name">${n}</div><div class="rs-sub">${s}</div><div class="rs-val">0.0%</div><div class="rs-track"><div class="rs-fill" style="width:830px"></div></div></div>`)
  .join("\n        ");
const dots = [0, 1, 2, 3, 4].map((i) => `<div class="rs-dot" style="left:${i * 150}px"></div>`).join("");

// ── captions ────────────────────────────────────────────────────────────────
function captionGroups() {
  const groups = [];
  for (const line of script.lines) {
    const ws = L[line.id].words;
    let k = 0;
    for (const phrase of line.cap.split(" / ")) {
      const n = phrase.split(" ").length;
      const g = ws.slice(k, k + n);
      if (g.map((w) => w.w).join(" ") !== phrase) throw new Error(`caption "${phrase}" does not match the timed words of ${line.id}`);
      groups.push(g);
      k += n;
    }
    if (k !== ws.length) throw new Error(`caption phrases for ${line.id} cover ${k} of ${ws.length} words`);
  }
  return groups.map((g, i) => {
    const next = groups[i + 1];
    const start = g[0].start - 0.06;
    let end = g[g.length - 1].end + 0.35;
    if (next && next[0].start - 0.06 < end) end = next[0].start - 0.06;
    return { text: g.map((w) => w.w).join(" "), start: r3(Math.max(0, start)), end: r3(end) };
  });
}
const caps = captionGroups();

// ── sound ───────────────────────────────────────────────────────────────────
const F = 1 / 30;
const cues = [];
const sfx = (f, at, vol) => {
  const m = sfxMeta[f];
  cues.push({ f, start: r3(Math.max(0, at + F - m.peak)), dur: r3(m.duration), vol });
};
[cut1, cut2, cut3, cut4].forEach((c, i) => sfx(i % 2 ? "whoosh" : "whoosh-short", c, 0.16));
sfx("pop-lo", r0 + results.count, 0.15);
["pop", "pop-lo", "pop-hi", "pop"].forEach((f, i) => sfx(f, r0 + results.fills[i] + 0.7, 0.13));
sfx("pop-hi", r0 + results.fills[4] + 0.9, 0.16);
sfx("click-soft", h0 + how.placeholder + 0.05, 0.35);
sfx("click-soft", h0 + how.fails + 0.12, 0.3);

// ── write ───────────────────────────────────────────────────────────────────
const FONTS = rd("src/fonts.css").trim().split("\n").join("\n    ");
const KIT = rd("src/kit.css").trim().split("\n").join("\n    ");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const stamp = (src, T, extra = {}) => {
  let s = rd(src).replace("/*{{FONTS}}*/", FONTS).replace("/*{{KIT}}*/", KIT).replace("/*{{T}}*/ {}", JSON.stringify(round(T)));
  for (const [k, v] of Object.entries(extra)) s = s.split(k.startsWith("/*") ? k : `<!--{{${k}}}-->`).join(v);
  return s;
};
wr("compositions/hook.html", stamp("src/hook.html", hook, { ROWS: hookRows() }));
wr("compositions/engine.html", stamp("src/engine.html", engine));
wr("compositions/results.html", stamp("src/results.html", results, { ROWS: ladderRows, DOTS: dots, "/*{{V}}*/ []": JSON.stringify(values) }));
wr("compositions/how.html", stamp("src/how.html", how, { VERSE: esc(script.verse.text) }));
wr("compositions/end.html", stamp("src/end.html", end));
wr("compositions/captions.html", stamp("src/captions.html", { groups: caps, total },
  { CAPS: caps.map((c, i) => `<div class="cp" id="cp-${i}" data-layout-allow-overlap data-layout-allow-occlusion>${esc(c.text)}</div>`).join("\n      ") }));

const host = (id, start, dur, track, kind) =>
  `    <div id="${id}" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${r3(start)}" data-duration="${r3(dur)}" data-track-index="${track}" data-track-kind="${kind}" data-width="1920" data-height="1080"${id === "captions" ? ' style="z-index: 10"' : ""}></div>`;
const trackEnd = [];
for (const c of cues) {
  let k = trackEnd.findIndex((e) => e <= c.start - 0.01);
  if (k < 0) k = trackEnd.push(0) - 1;
  trackEnd[k] = c.start + c.dur;
  c.track = 5 + k;
}
const audio = cues
  .map((c, i) => `    <audio id="sfx-${String(i + 1).padStart(2, "0")}" class="clip" src="assets/sfx/${c.f}.mp3" data-start="${c.start}" data-duration="${c.dur}" data-track-index="${c.track}" data-volume="${c.vol}" data-audio-group="sfx"></audio>`)
  .join("\n");
const bedFile = ["mp3", "wav", "m4a"].map((e) => `assets/music/bed.${e}`).find((f) => fs.existsSync(path.join(ROOT, f)));
const music = bedFile
  ? `    <audio id="music" class="clip" src="${bedFile}" data-start="0" data-duration="${total}" data-track-index="3" data-volume="0.14" data-audio-group="music"></audio>`
  : "";
const vo = fs.existsSync(path.join(ROOT, "assets/vo/vo.wav")) && !timing.provisional
  ? `    <audio id="vo" class="clip" src="assets/vo/vo.wav" data-start="0" data-duration="${r3(timing.duration)}" data-track-index="4" data-volume="1" data-audio-group="voiceover"></audio>`
  : "    <!-- no narration yet: timing is provisional -->";
wr(
  "index.html",
  `<!doctype html>
<html lang="en" data-resolution="landscape">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      html, body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #111827; }
      #root { position: relative; width: 1920px; height: 1080px; overflow: hidden; background: #111827; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="1920" data-height="1080">
${host("hook", 0, cut1, 1, "graphics")}
${host("engine", cut1, cut2 - cut1, 1, "graphics")}
${host("results", cut2, cut3 - cut2, 1, "graphics")}
${host("how", cut3, cut4 - cut3, 1, "graphics")}
${host("end", cut4, total - cut4, 1, "graphics")}
${host("captions", 0, total, 2, "graphics")}
${music}
${vo}
${audio}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`,
);
wr("build/cues.json", JSON.stringify(round({ provisional: !!timing.provisional, total, cut1, cut2, cut3, cut4, hook, engine, results, how, end, captions: caps, sfx: cues }), null, 2));
const t2 = (x) => `${Math.floor(x / 60)}:${(x % 60).toFixed(1).padStart(4, "0")}`;
const busy = { "ladder full": r0 + results.fills[4] - 0.2, "100% + languages tag": r0 + results.tag + 0.8, "verse filled": h0 + how.exact + 0.6, "failure gap": h0 + how.gap + 0.4, "end card": total - 0.8 };
wr("build/busiest.json", JSON.stringify(round(busy), null, 2));
console.log(`built${timing.provisional ? " (PROVISIONAL timing)" : ""}: ${total}s · hook 0–${r3(cut1)} · engine –${r3(cut2)} · results –${r3(cut3)} · how –${r3(cut4)} · end –${total} · ${caps.length} captions · ${cues.length} sfx`);
console.log("busiest frames:", Object.entries(round(busy)).map(([k, v]) => `${k} @ ${t2(v)} (${v}s)`).join(" · "));
