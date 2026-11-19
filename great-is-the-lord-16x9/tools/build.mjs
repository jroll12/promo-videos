#!/usr/bin/env node
// Builds the lyric video from build/timing.json (lyric lines + word times), build/beats.json and
// build/env.json: writes compositions/<section>.html (scene source + shared kit + that section's data)
// and index.html (song, background canvas, one host per section). Canvas size comes from project.json,
// so the 9:16 sibling is the same sources with a different project.json.
import fs from "node:fs";
import path from "node:path";

const ROOT = process.env.GL_ROOT || process.cwd(); // the project being built (the 9:16 sibling symlinks src/, tools/, assets/, build/)
const rd = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, p)), { recursive: true }); fs.writeFileSync(path.join(ROOT, p), s); };
const r3 = (x) => Math.round(x * 1000) / 1000;

const P = JSON.parse(rd("project.json"));
const { W, H } = P;
const T = JSON.parse(rd("build/timing.json"));
const BEATS = JSON.parse(rd("build/beats.json"));
const ENV = JSON.parse(rd("build/env.json"));
const LEAD = 0.05; // picture lands a frame or two before the voice
const FILM = r3(T.duration + 0.4);

const C = { paper: "#F4EEDF", ink: "#17142B", pink: "#FF48B0", yellow: "#FFE14D", blue: "#0078BF", green: "#00A95C", orange: "#FF6C2F", purple: "#765BA7", teal: "#4FD1C5", royal: "#33287E", forest: "#0E4D3B", night: "#100E1F" };

// look per section: background flood, scene source, variant, flip palette
const LOOK = {
  intro:          { scene: "intro",  base: C.night, dot: "#221E40", clear: 0.35 },
  "verse-1":      { scene: "verse-1", base: C.paper, light: true, dot: "#E6DBC2", clear: 0.5 },
  "pre-chorus":   { scene: "pre",    base: C.blue, dot: "#0A69A8", clear: 0.4 },
  chorus:         { scene: "chorus", variant: 1, base: C.yellow, light: true, flips: [C.yellow, C.pink, C.orange, C.teal], clear: 0.42 },
  "verse-2":      { scene: "verse-2", base: C.forest, dot: "#15634C", clear: 0.5 },
  "chorus-2":     { scene: "chorus", variant: 2, base: C.pink, light: true, flips: [C.pink, C.yellow, C.teal, C.orange], clear: 0.42 },
  "verse-3":      { scene: "verse-3", base: C.royal, dot: "#40349A", clear: 0.5 },
  bridge:         { scene: "bridge", base: C.night, dot: "#262150", clear: 0.3, dotAmp: 1.5 },
  "final-chorus": { scene: "chorus", variant: 3, base: C.orange, light: true, flips: [C.orange, C.yellow, C.pink, C.teal, C.paper], clear: 0.42 },
  outro:          { scene: "outro",  base: C.paper, light: true, flips: [C.yellow, C.pink, C.teal, C.paper], dot: "#E6DBC2", clear: 0.45 },
};

const sections = T.sections.map((s, k) => {
  const L = LOOK[s.id];
  if (!L) throw new Error("no look for section " + s.id);
  const start = s.start, end = s.end, dur = r3(end - start);
  const loc = (t) => r3(Math.max(0, t - LEAD - start));
  const lines = s.lines.map((l) => ({ id: l.id, text: l.text, t: loc(l.start), e: loc(l.end), se: loc(l.singEnd),
    w: l.words.map((w) => ({ w: w.w, t: loc(w.start), e: loc(w.end) })) }));
  const inSec = (arr) => arr.filter((t) => t >= start - 0.001 && t < end).map((t) => r3(t - start));
  return { id: s.id, name: s.name, k, start, end, dur, L, lines, beats: inSec(BEATS.beats), downs: inSec(BEATS.downbeats) };
});

// background cues: colour flips on every "Great is the LORD!" and on downbeats through long holds; confetti in the finale
const flips = [], bursts = [];
for (const s of sections) {
  if (!s.L.flips) continue;
  let n = 0;
  const pal = s.L.flips;
  s.lines.forEach((l, i) => {
    if (!/^great/i.test(l.text)) return;
    flips.push({ t: r3(s.start + l.t), c: pal[n++ % pal.length] });
    const next = s.lines[i + 1] ? s.lines[i + 1].t : s.dur;
    if (next - l.t > 2.6) s.downs.filter((d) => d > l.t + 1.0 && d < next - 0.5).forEach((d) => flips.push({ t: r3(s.start + d), c: pal[n++ % pal.length] }));
    if (s.id === "final-chorus") bursts.push({ t: r3(s.start + l.t), from: n % 2 ? "sides" : "center", n: 150 });
    if (s.id === "outro" && i === s.lines.length - 1) bursts.push({ t: r3(s.start + l.t), from: "center", n: 220 });
  });
  if (s.id === "final-chorus") {
    const fe = s.lines.find((l) => /^forever/i.test(l.text));
    if (fe) bursts.push({ t: r3(s.start + fe.t), from: "sides", n: 200 });
  }
}
flips.sort((a, b) => a.t - b.t);
bursts.sort((a, b) => a.t - b.t);

const kitCss = rd("src/kit.css"), kitJs = rd("src/kit.js");
for (const s of sections) {
  const sp = `src/scenes/${s.L.scene}.html`;
  const src = rd(fs.existsSync(path.join(ROOT, sp)) ? sp : "src/scenes/_generic.html");
  const data = { id: s.id, name: s.name, variant: s.L.variant || 1, W, H, start: r3(s.start), dur: s.dur, seed: s.k + 1, lines: s.lines, beats: s.beats, downs: s.downs,
    flips: flips.filter((f) => f.t >= s.start && f.t < s.end).map((f) => ({ t: r3(f.t - s.start), c: f.c })), bursts: bursts.filter((b) => b.t >= s.start && b.t < s.end).map((b) => r3(b.t - s.start)), C };
  const out = src
    .replaceAll("__ID__", s.id).replaceAll("__W__", String(W)).replaceAll("__H__", String(H))
    .replace("<!--KIT_CSS-->", `<style>\n${kitCss}</style>`)
    .replace("/*KIT_JS*/", kitJs)
    .replace("/*DATA*/", `const S = ${JSON.stringify(data)};`);
  wr(`compositions/${s.id}.html`, out);
}

const bg = { W, H, fps: ENV.fps, bass: ENV.bass, flips, bursts,
  sections: sections.map((s) => ({ id: s.id, start: r3(s.start), end: r3(s.end), base: s.L.base, dot: s.L.dot, light: !!s.L.light, clear: s.L.clear, dotAmp: s.L.dotAmp })) };
const hosts = sections.map((s) => `    <div id="${s.id}" data-composition-id="${s.id}" data-composition-src="compositions/${s.id}.html" data-start="${r3(s.start)}" data-duration="${s.k === sections.length - 1 ? r3(FILM - s.start) : s.dur}" data-track-index="2" data-track-kind="graphics" data-width="${W}" data-height="${H}" style="z-index:2"></div>`).join("\n");

wr("index.html", `<!doctype html>
<html lang="en" data-resolution="${W > H ? "landscape" : "portrait"}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <title>Great Is the LORD (Psalm 145)</title>
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: ${C.night}; }
      #root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: ${C.night}; }
      #bg { position: absolute; inset: 0; z-index: 0; }
      #bg-canvas { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${FILM}" data-width="${W}" data-height="${H}">
    <div id="bg" data-layout-ignore><canvas id="bg-canvas" width="${W}" height="${H}"></canvas></div>
${hosts}
    <audio id="song" class="clip" src="assets/audio/song.wav" data-start="0" data-duration="${r3(T.duration)}" data-track-index="4" data-volume="1" data-audio-group="music"></audio>
    </div>
    <script>window.__BG = ${JSON.stringify(bg)};</script>
    <script>
${rd("src/bg.js")}
    </script>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`);
console.log(`built ${sections.length} scenes, ${flips.length} flips, ${bursts.length} bursts, film ${FILM}s at ${W}x${H}`);
