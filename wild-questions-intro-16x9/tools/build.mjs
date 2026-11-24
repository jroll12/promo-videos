#!/usr/bin/env node
// Builds the "Wild Questions of the Week" intro from the song's own timing:
// every cue is stamped from the sung words and beat grid in tools/lyrics.json,
// so a new mix of the theme is one `node tools/build.mjs` away.
// The two sibling projects (16x9, 9x16) share src/wild.html and differ only in SHAPE below.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const rd = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => {
  fs.mkdirSync(path.dirname(path.join(ROOT, p)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, p), s);
};
const r3 = (x) => Math.round(x * 1000) / 1000;
const round = (o) => JSON.parse(JSON.stringify(o, (k, v) => (typeof v === "number" ? r3(v) : v)));
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── shape: everything that differs between 16x9 and 9x16 ─────────────────────
const SHAPE = {
  W: 1920, H: 1080, resolution: "landscape",
  css: { HASH: 760, CHIP: 40, L1GAP: 14, BIG: 250, MID: 170, STK: 84, WK: 150, LOGOASK: 56, PILLW: 1100, PILLH: 124, TYPE: 56, HUGE: 330, TITLE: 200, TAG: 54, TAGGAP: 40, LOGOTAG: 62 },
  // [x, y, rotation] from the centre
  hash: [0, -10, -8],
  storm: [[-520, -330, -7], [520, -290, 6], [-560, 300, 5], [540, 330, -6], [10, -420, 3], [-60, 430, -4], [600, 20, 8]],
  pileBand: { x0: -700, x1: 700, y0: 250, y1: 420 },
  l1: [0, 0, 0],
  ask: [0, 40, 0],
  they: [-520, -380, -10],
  the2: [-170, -390, 8],
  wa: [-400, -40, -8],
  wb: [420, 70, 7],
  title: [0, -30, 0],
  titleLines: [["hash", "wild", "questions"], ["of", "the", "week"]],
  conf: 46,
  shake: 1,
};

// ── content (illustrative placeholders: not real weekly questions) ───────────
const STORM = ["DidAdamHaveABellyButton", "WhoCleanedUpAfterTheArk", "HowLongWasMethuselahsBeard", "DidGoliathHitHisHeadOnDoorways", "DidNoahsAnimalsGetSeasick", "WhatSnacksDidMosesPack", "DidJonahNeedAShowerAfter"];
const PILE = ["DidElijahTipTheRavens", "WhoNamedTheHippo", "HowManyAnimalsSneezedOnTheArk", "DidZacchaeusNeedABoostSeat", "WasTheBurningBushWarm", "DidSamsonRegretTheHaircut", "WhatWasJonahsReviewOfTheFish", "DidBalaamsDonkeyHaveAnAccent"];
const TYPED = "#WasMannaGlutenFree";
const WORDS = { hash: "#", wild: "Wild", questions: "Questions", of: "Of", the: "The", week: "Week" };

// ── cues from the song ───────────────────────────────────────────────────────
const lyr = JSON.parse(rd("tools/lyrics.json"));
const Wd = Object.fromEntries(lyr.words.map((w) => [w.id, w.t]));
const total = 8.8; // song ends at 8.0; the end card holds 0.8 s past it (trim in the edit if it cuts straight into the segment)
const beats = [];
for (let b = lyr.grid.t0; b < total - 0.3; b += lyr.grid.period) beats.push(b);
const T = {
  total,
  beats,
  hashSlams: [beats[0], beats[1]],
  storm: STORM.map((_, k) => beats[0] + k * 0.11),
  blow: Wd.wild1 - 0.1,
  wild1: Wd.wild1, questions1: Wd.questions1, of1: Wd.of1, the1: Wd.the1, week1: Wd.week1,
  l1Out: Wd.week1 + 0.19,
  askIn: Wd.week1 + 0.2,
  typeStart: Wd.week1 + 0.32,
  typeStep: 0.021,
  send: beats[7] + 0.007, // the 3.59 beat, after typing finishes
  launch: beats[7] + 0.12,
  askOut: Wd.theyre - 0.08,
  theyre: Wd.theyre, the2: Wd.the2, wild2: Wd.wild2, wild3: Wd.wild3,
  pile: PILE.map((_, k) => Wd.theyre + 0.04 + k * 0.17),
  explode: Wd.questions2 + 0.01,
  questions2: Wd.questions2, of2: Wd.of2, the3: Wd.the3, week2: Wd.week2,
  hit1: lyr.hits[0], hit2: lyr.hits[1],
  float: lyr.hits[1] + 0.32,
};
T.shakes = [[beats[0], 14], [beats[1], 10], [Wd.wild1, 22], [Wd.week1, 16], [Wd.wild2, 16], [Wd.wild3, 18], [Wd.week2, 20], [lyr.hits[1], 14]].map(([t, a]) => [t, a * SHAPE.shake]);
if (T.typeStart + (TYPED.length - 1) * T.typeStep >= T.send) throw new Error("typing runs into the send press");
if (T.pile.at(-1) + 0.26 > T.explode) throw new Error("the last pile chip lands after the explosion");

// ── generated markup ─────────────────────────────────────────────────────────
const R = rng(20261124);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const chip = (id, cls, txt) => `<div id="${id}" class="c chip ${cls}" data-layout-allow-overflow data-layout-allow-occlusion><span class="h">#</span>${esc(txt)}</div>`;
const STORM_HTML = STORM.map((t, k) => chip(`wq-s${k}`, "wq-sc", t)).join("\n        ");
const { x0, x1, y0, y1 } = SHAPE.pileBand;
const pile = PILE.map((_, k) => {
  const f = (k + 0.5) / PILE.length;
  const x = x0 + ((k % 2 ? f : 1 - f) * (x1 - x0)) + (R() - 0.5) * 80;
  return [x, y0 + R() * (y1 - y0), (R() - 0.5) * 22];
});
const PILE_HTML = PILE.map((t, k) => chip(`wq-p${k}`, "wq-pc", t)).join("\n        ");
const TYPED_HTML = [...TYPED].map((ch, i) => `<span class="wq-ch${i === 0 ? " h" : ""}">${esc(ch)}</span>`).join("");
const TITLE_HTML = SHAPE.titleLines.map((line) => `<div class="tl">${line.map((w) => `<span id="wq-t-${w}" class="wq-tw${w === "wild" ? " grad" : ""}">${WORDS[w]}</span>`).join("")}</div>`).join("\n        ");
const { W, H } = SHAPE;
const BLOBS = [[0.18, 0.22, 0.55], [0.82, 0.3, 0.5], [0.5, 0.85, 0.6]]
  .map(([fx, fy, fs]) => { const s = Math.round(Math.max(W, H) * fs); return `<div class="blob" data-layout-allow-overflow data-layout-allow-occlusion style="left:${Math.round(fx * W - s / 2)}px;top:${Math.round(fy * H - s / 2)}px;width:${s}px;height:${s}px"></div>`; })
  .join("");
const confCols = ["#374151", "#3A129E", "#450FCA", "#1F2937"];
const confDrift = [];
const CONF = Array.from({ length: SHAPE.conf }, (_, i) => {
  const x = Math.round(R() * W), y = Math.round(R() * H), s = Math.round(48 + R() * 110), g = R() < 0.55 ? "#" : "?";
  confDrift.push([(R() - 0.5) * 120, -40 - R() * 140, (R() - 0.5) * 60, (R() - 0.5) * 140]);
  return `<span class="cf" aria-hidden="true" data-layout-allow-overflow data-layout-allow-occlusion style="left:${x}px;top:${y}px;font-size:${s}px;color:${confCols[i % confCols.length]}">${g}</span>`;
}).join("");

const L = { W, H, hash: SHAPE.hash, storm: SHAPE.storm, pile, l1: SHAPE.l1, ask: SHAPE.ask, they: SHAPE.they, the2: SHAPE.the2, wa: SHAPE.wa, wb: SHAPE.wb, title: SHAPE.title, confDrift };

// ── write ────────────────────────────────────────────────────────────────────
const FONTS = rd("src/fonts.css").trim().split("\n").join("\n    ");
let s = rd("src/wild.html").replace("/*{{FONTS}}*/", FONTS).replace("/*{{T}}*/ {}", JSON.stringify(round(T))).replace("/*{{L}}*/ {}", JSON.stringify(round(L)));
for (const [k, v] of Object.entries({ BLOBS, CONF, STORM: STORM_HTML, PILE: PILE_HTML, TYPED: TYPED_HTML, TITLE: TITLE_HTML })) s = s.replace(`<!--{{${k}}}-->`, v);
s = s.replaceAll("__W__", W).replaceAll("__H__", H);
for (const [k, v] of Object.entries(SHAPE.css)) s = s.replaceAll(`__${k}__`, v);
if (/__[A-Z0-9]+__|\{\{/.test(s)) throw new Error("unfilled placeholder in compositions/wild.html: " + s.match(/__[A-Z0-9]+__|\{\{[A-Z]+\}\}/)[0]);
wr("compositions/wild.html", s);

// quiet effects on their own track: easy to mute (the song is the soundtrack)
const F = 1 / 30;
const sfxMeta = JSON.parse(rd("build/sfx_meta.json"));
const SFX_VOL = 0.12;
const cues = [];
const sfx = (f, at, vol) => { const m = sfxMeta[f]; cues.push({ f, start: r3(Math.max(0, at + F - m.peak)), dur: r3(m.duration), vol }); };
sfx("whoosh-short", T.blow + 0.12, SFX_VOL); // the storm blows away
sfx("pop", T.send + 0.03, SFX_VOL); // send
sfx("whoosh", T.explode + 0.1, SFX_VOL); // the pile blows apart
const audio = cues.map((c, i) => `    <audio id="sfx-${i + 1}" class="clip" src="assets/sfx/${c.f}.mp3" data-start="${c.start}" data-duration="${c.dur}" data-track-index="${5 + i}" data-volume="${c.vol}" data-audio-group="sfx"></audio>`).join("\n");
const theme = r3(Number(lyr.themeDuration || 8.12));

wr("index.html", `<!doctype html>
<html lang="en" data-resolution="${SHAPE.resolution}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: #111827; }
      #root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: #111827; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
    <div id="wild" class="clip" data-composition-id="wild" data-composition-src="compositions/wild.html" data-start="0" data-duration="${total}" data-track-index="1" data-track-kind="graphics" data-width="${W}" data-height="${H}"></div>
    <audio id="theme" class="clip" src="assets/music/theme.wav" data-start="0" data-duration="${theme}" data-track-index="3" data-volume="1" data-audio-group="music"></audio>
${audio}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`);
wr("build/cues.json", JSON.stringify(round({ T, L: { ...L, confDrift: undefined }, sfx: cues }), null, 2) + "\n");
const ev = { "storm blow-away": T.blow, "#Wild": T.wild1, questions: T.questions1, week: T.week1, "ask pill": T.askIn, send: T.send, "They're": T.theyre, "wild,": T.wild2, wild: T.wild3, "title: #WildQuestions": T.questions2, Of: T.of2, The: T.the3, Week: T.week2, "asked to apologist AI": T.hit1, "# spin + confetti": T.hit2 };
wr("build/events.json", JSON.stringify(round(ev), null, 2) + "\n");
console.log(`built ${W}x${H}: ${total}s · ${beats.length} beats · ${cues.length} sfx · events: ${Object.entries(round(ev)).map(([k, v]) => `${k} ${v}`).join(" | ")}`);
