// Shared build library for brochure-to-promo-video projects.
//
// A product's build.mjs does only the product-specific part: it names its scene cues
// from the narration's word times and generates any artwork. Everything else lives
// here, so a new voice take (or a new product) is `node tools/build.mjs` away:
//
//   import { createProject } from "./cues.mjs";
//   const p = createProject(ROOT);              // reads build/timing.json, build/sfx_meta.json, script.json
//   const t = p.W("L3", "ads");                 // start time of a word, by line id
//   p.sfx("pop", t + 0.06, 0.2);                // sound placed so its peak lands one frame after the picture
//   p.writeScene("night", { T: night }, ...)    // stamp a scene template with cues
//   p.writeCaptions(); p.writeIndex(...); p.writeLedger(...); p.writeEvents(...);
//
// Templates a scene file may contain: `/*{{FONTS}}*/` (the @font-face block),
// `/*{{T}}*/ {}` (the scene's cue object, as JSON) and `<!--{{NAME}}-->` slots.
import fs from "node:fs";
import path from "node:path";

export const r3 = (x) => Math.round(x * 1000) / 1000;
export const round = (o) => JSON.parse(JSON.stringify(o, (k, v) => (typeof v === "number" ? r3(v) : v)));

/** Small seeded generator, so generated artwork is identical on every build. */
export function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Join generated markup into lines of `n` elements, so scene files stay readable and under the lint size. */
export const pack = (a, n = 14) => a.reduce((o, x, i) => (i % n ? (o[o.length - 1] += x) : o.push(x), o), []);

const norm = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");

export function createProject(root, opts = {}) {
  const o = {
    width: 1080,
    height: 1920,
    preset: "portrait", // HyperFrames data-resolution
    ground: "#0C1D0D", // opaque stage ground: prevents a white flash at seams
    fps: 30,
    scriptPath: "script.json",
    fontsPath: "src/fonts.css",
    captionTop: 1198, // px from the top; inside the 168..1330 band that vertical platforms leave free
    captionFont: '"ZG Inter"',
    captionSize: 44,
    captionWeight: 600,
    captionMaxWidth: 940,
    captionBg: "rgba(10, 23, 11, 0.78)",
    captionInk: "#F7F4EC",
    sfxTrackBase: 5,
    ...opts,
  };
  const rd = (p) => fs.readFileSync(path.join(root, p), "utf8");
  const wr = (p, s) => {
    fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true });
    fs.writeFileSync(path.join(root, p), s);
  };

  const timing = JSON.parse(rd("build/timing.json"));
  const sfxMeta = JSON.parse(rd("build/sfx_meta.json"));
  const script = JSON.parse(rd(o.scriptPath));
  const L = Object.fromEntries(timing.lines.map((l) => [l.id, l]));
  if (timing.provisional) console.warn("WARNING: build/timing.json is provisional (not from a real narration take).");

  /** Start time of the `occ`-th occurrence of `word` in line `id`. Matches ignoring case and punctuation. */
  function W(id, word, occ = 1) {
    if (!L[id]) throw new Error(`no line "${id}" in timing.json`);
    let n = 0;
    for (const w of L[id].words) if (norm(w.w) === norm(word) && ++n === occ) return w.start;
    throw new Error(`"${word}" (#${occ}) not found in ${id}: ${L[id].words.map((w) => w.w).join(" ")}`);
  }
  /** End time of a word. */
  function Wend(id, word, occ = 1) {
    let n = 0;
    for (const w of L[id].words) if (norm(w.w) === norm(word) && ++n === occ) return w.end;
    throw new Error(`"${word}" not found in ${id}`);
  }

  // ── fonts and scene stamping ──────────────────────────────────────────────
  const FONTS = fs.existsSync(path.join(root, o.fontsPath)) ? rd(o.fontsPath).trim().split("\n").join("\n    ") : "";
  function stamp(src, T = {}, slots = {}) {
    let s = rd(src).replace("/*{{FONTS}}*/", FONTS).replace("/*{{T}}*/ {}", JSON.stringify(round(T)));
    for (const [k, v] of Object.entries(slots)) s = s.replace(`<!--{{${k}}}-->`, v);
    return s;
  }
  /** Stamp src/<name>.html with its cue object and write compositions/<name>.html. */
  function writeScene(name, T, slots) {
    wr(`compositions/${name}.html`, stamp(`src/${name}.html`, T, slots));
  }

  // ── captions: phrase breaks are authored in script.json ("cap", phrases split on " / ") ──
  function captionGroups() {
    const groups = [];
    for (const line of script.lines) {
      if (!line.cap) continue;
      const ws = L[line.id].words;
      let k = 0;
      for (const phrase of line.cap.split(" / ")) {
        const n = phrase.split(" ").length;
        groups.push(ws.slice(k, k + n));
        k += n;
      }
      if (k !== ws.length) throw new Error(`caption phrases for ${line.id} cover ${k} of ${ws.length} words`);
    }
    return groups.map((g, i) => {
      const next = groups[i + 1];
      const start = g[0].start - 0.06;
      let end = g[g.length - 1].end + 0.35;
      if (next && next[0].start - 0.06 < end) end = next[0].start - 0.06;
      return { text: g.map((w) => w.w).join(" "), start: r3(Math.max(0.12, start)), end: r3(end) };
    });
  }
  let caps = [];
  function writeCaptions() {
    caps = captionGroups();
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    wr(
      "compositions/captions.html",
      `<template>
  <style>
    ${FONTS}
    #root { position: absolute; inset: 0; overflow: visible; }
    .cap { position: absolute; left: 0; top: ${o.captionTop}px; width: ${o.width}px; text-align: center; overflow: visible; }
    .cap span { display: inline-block; max-width: ${o.captionMaxWidth}px; padding: 12px 28px 14px; border-radius: 22px; background: ${o.captionBg}; color: ${o.captionInk}; font: ${o.captionWeight} ${o.captionSize}px/1.28 ${o.captionFont}; }
  </style>
  <div id="root" data-composition-id="captions" data-width="${o.width}" data-height="${o.height}">
${caps.map((c, i) => `    <div class="cap" id="cap-${i}" data-layout-allow-overlap data-layout-allow-occlusion><span>${esc(c.text)}</span></div>`).join("\n")}
  </div>
  <script>
    (function () {
      const G = ${JSON.stringify(caps.map((c) => [c.start, c.end]))};
      const tl = gsap.timeline({ paused: true });
      gsap.set(".cap", { autoAlpha: 0 });
      G.forEach(([s, e], i) => {
        const g = "#cap-" + i;
        tl.fromTo(g, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.14, ease: "power2.out" }, s);
        tl.to(g, { autoAlpha: 0, duration: 0.12, ease: "power2.in" }, e - 0.12);
        tl.set(g, { autoAlpha: 0 }, e);
      });
      window.__timelines["captions"] = tl;
    })();
  </script>
</template>
`,
    );
    return caps;
  }

  // ── sound: place a file so its loudest point lands one frame after the picture ──
  const F = 1 / o.fps;
  const cues = [];
  function sfx(f, at, vol, opt = {}) {
    const m = sfxMeta[f];
    if (!m) throw new Error(`sfx "${f}" is not in build/sfx_meta.json (run scripts/sfx_meta.py)`);
    const ms = opt.mediaStart || 0;
    const dur = opt.duration || m.duration - ms;
    const start = at + F - (m.peak - ms);
    cues.push({ f, start: r3(Math.max(0, start)), ms: r3(ms), dur: r3(dur), vol });
  }

  // ── index.html: scene hosts, narration, sound effects on non-overlapping tracks ──
  const host = (id, start, dur, track, kind) =>
    `    <div id="${id}" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${r3(start)}" data-duration="${r3(dur)}" data-track-index="${track}" data-track-kind="${kind}" data-width="${o.width}" data-height="${o.height}"${id === "captions" ? ' style="z-index: 10"' : ""}></div>`;
  /** scenes: [{ id, start, dur }] in order; the captions host spans the whole film. */
  function writeIndex(total, scenes) {
    const trackEnd = [];
    for (const c of cues) {
      let k = trackEnd.findIndex((e) => e <= c.start - 0.01);
      if (k < 0) k = trackEnd.push(0) - 1;
      trackEnd[k] = c.start + c.dur;
      c.track = o.sfxTrackBase + k;
    }
    const audio = cues
      .map((c, i) => `    <audio id="sfx-${String(i + 1).padStart(2, "0")}" class="clip" src="assets/sfx/${c.f}.mp3" data-start="${c.start}"${c.ms ? ` data-media-start="${c.ms}"` : ""} data-duration="${c.dur}" data-track-index="${c.track}" data-volume="${c.vol}" data-audio-group="sfx"></audio>`)
      .join("\n");
    wr(
      "index.html",
      `<!doctype html>
<html lang="en" data-resolution="${o.preset}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${o.width}, height=${o.height}" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      html, body { margin: 0; width: ${o.width}px; height: ${o.height}px; overflow: hidden; background: ${o.ground}; }
      #root { position: relative; width: ${o.width}px; height: ${o.height}px; overflow: hidden; background: ${o.ground}; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${o.width}" data-height="${o.height}">
${scenes.map((s) => host(s.id, s.start, s.dur, 1, "graphics")).join("\n")}
${host("captions", 0, total, 2, "captions")}
    <audio id="vo" class="clip" src="assets/vo/vo.wav" data-start="0" data-duration="${r3(timing.duration)}" data-track-index="4" data-volume="1" data-audio-group="voiceover"></audio>
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
  }

  /** Dump every cue for review; `extra` is the per-scene cue objects. */
  function writeCues(total, extra) {
    wr("build/cues.json", JSON.stringify(round({ total, ...extra, captions: caps, sfx: cues }), null, 2));
  }
  /** Vector ledger for the motion doctrine's seam gate: one row per scene boundary. */
  function writeLedger(seams) {
    wr("ledger.json", JSON.stringify({ fps: o.fps, seams }, null, 2) + "\n");
  }
  /** Named moments (seconds) that the pop scan treats as intended jumps: cuts, swaps, camera moves. */
  function writeEvents(events) {
    wr("build/events.json", JSON.stringify(round(events), null, 2) + "\n");
  }

  return { root, o, rd, wr, timing, script, L, W, Wend, stamp, writeScene, writeCaptions, sfx, cues, writeIndex, writeCues, writeLedger, writeEvents, r3, round };
}
