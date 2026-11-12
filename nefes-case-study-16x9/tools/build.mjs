#!/usr/bin/env node
// Builds the NEFES case-study film from one timing file: every scene cue and sound is stamped from the
// voiceover's word times in build/timing.json, so a new take is one `node tools/build.mjs` away.
// Same method as zogreo-intro-9x16/tools/build.mjs (W() word lookup, peak-aligned sound, cut-the-curve ledger).
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
const sfxMeta = JSON.parse(rd("build/sfx_meta.json"));
const script = JSON.parse(rd("tools/script.json"));
const outline = JSON.parse(rd("build/turkey-outline.json"));
const PROVISIONAL = !!timing.provisional; // an estimate from tools/draft_timing.mjs: no narration yet
const L = Object.fromEntries(timing.lines.map((l) => [l.id, l]));
const norm = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
function W(id, word, occ = 1) {
  let n = 0;
  for (const w of L[id].words) if (norm(w.w) === norm(word) && ++n === occ) return w.start;
  throw new Error(`"${word}" not found in ${id}`);
}
// a scene turn: hold after the last word, but always before the next line starts
const cutAfter = (id, next, hold) => Math.min(L[id].end + hold, L[next].start - 0.15);

// ── cues ────────────────────────────────────────────────────────────────────
// 1 · before: the responder's own words, the volume, the country, the team of two
const SMIN = 0.182; // the camera's widest view: the country is 1300 px across the wide frame
const before = {};
before.words = L.L1.words.map((w) => w.start);
before.s0 = 0.9; // a slow drift back while the quote is read
before.sMin = SMIN;
before.sEnd = SMIN * 1.07;
before.attr = L.L1.end + 0.1;
before.pullStart = Math.max(before.attr + 1.0, W("L2", "responder")); // the attribution is read at full size first
before.pullEnd = before.pullStart + 1.9;
before.quoteOut = before.pullStart + 0.5;
before.attrOut = before.pullStart + 0.7;
before.mapIn = before.pullStart + 0.45;
before.label = before.pullStart + 1.25;
before.chip = Math.max(W("L2", "field"), before.pullEnd - 0.5); // the team lands as it is named
before.two = Math.max(before.chip + 0.55, W("L2", "two"));
const cutA = Math.max(cutAfter("L2", "L3", 0.75), Math.min(before.two + 0.9, L.L3.start - 0.15));
before.exit = cutA - 0.32;

// 2 · pilot: three Bible studies, then the hand-off (times from here on are relative to their scene's cut)
const pilot = {};
pilot.travel = Math.max(1.4, L.L4.start - cutA - 0.2); // the camera starts down the path as "Our AI leads" begins
pilot.travelDur = 1.1;
pilot.c1 = pilot.travel + 0.4; // the three studies come into view as the camera travels
pilot.c2 = pilot.travel + 0.58;
pilot.c3 = pilot.travel + 0.76;
pilot.dotIn = Math.max(pilot.travel + 0.8, W("L4", "person") - cutA);
pilot.n1 = Math.max(pilot.dotIn + 0.5, W("L4", "three") - cutA); // one person, study by study, on "three Bible studies"
pilot.n2 = Math.max(pilot.n1 + 0.26, W("L4", "Bible") - cutA);
pilot.n3 = Math.max(pilot.n2 + 0.26, W("L4", "studies,") - cutA);
pilot.answers = Math.max(pilot.n3 + 0.45, W("L4", "answers") - cutA);
pilot.follows = Math.max(pilot.answers + 0.6, W("L4", "follows") - cutA);
pilot.finish = Math.max(pilot.follows + 0.6, W("L5", "finish,") - cutA);
pilot.obey = Math.max(pilot.finish + 0.55, W("L5", "obey") - cutA);
pilot.handed = Math.max(pilot.obey + 0.7, W("L5", "handed") - cutA); // a beat of stillness, then the hand-off
pilot.impact = pilot.handed + 0.42;
const cutB = cutAfter("L5", "L6", 1.5); // the hand-off holds
pilot.exit = cutB - 0.32 - cutA;

// 3 · result: 3.73 times as many, at about the same rate
const result = {};
result.count0 = Math.max(0.5, W("L6", "same") - cutB);
result.num = Math.max(result.count0 + 0.8, W("L6", "3.73") - cutB); // the count lands as the number is spoken
result.cap = result.count0 + 0.15; // the caption is there to be read while the number counts
result.nudge = Math.max(result.num + 1.5, L.L7.start - cutB - 0.3);
result.leaders = result.nudge + 0.45; // the second finding is on screen for the whole of its line
result.foot = result.leaders + 0.45;
result.same = Math.max(result.leaders + 0.5, W("L7", "same") - cutB - 0.05);
const cutC = cutAfter("L7", "L8", 1.5);
result.exit = cutC - 0.32 - cutB;

// 4 · relief: the hostile messages, absorbed; then the responder again
const relief = {};
relief.many = Math.max(0.45, W("L8", "Many") - cutC);
relief.hostile = Math.max(relief.many + 0.9, W("L8", "hostile,") - cutC);
relief.take = Math.max(relief.hostile + 0.6, W("L8", "take") - cutC);
relief.pilot = Math.max(relief.take + 1.05, L.L9.start - cutC);
relief.our = Math.max(relief.pilot + 0.45, W("L9", "our") - cutC);
relief.took = Math.max(relief.our + 0.3, W("L9", "took") - cutC);
relief.answered = Math.max(relief.took + 0.7, W("L9", "answered") - cutC);
relief.pass = relief.answered + 0.8;
relief.stats = relief.pilot + 0.35;
relief.quoteIn = Math.max(relief.pass + 0.9, L.L10.start - cutC - 0.2);
relief.attr = relief.quoteIn + 0.3;
relief.qwords = L.L10.words.slice(4).map((w) => w.start - cutC); // the quotation starts after "In the responder's words:"
const cutD = cutAfter("L10", "L11", 1.5); // the finished quotation holds
relief.exit = cutD - 0.32 - cutC;

// 5 · close: the same country, answered; then the ask
const close = {};
close.sMin = SMIN;
close.replace = Math.max(0.5, W("L11", "replace") - cutD);
close.mult = Math.max(close.replace + 0.6, W("L11", "multiplies") - cutD);
close.fieldOut = Math.max(close.mult + 1.1, L.L12.start - cutD - 0.35);
close.logo = close.fieldOut + 0.25;
close.call = Math.max(close.logo + 0.4, W("L12", "call,") - cutD - 0.05);
close.give = Math.max(close.call + 0.3, W("L12", "give,") - cutD - 0.05);
close.url = Math.max(close.give + 0.3, W("L12", "zogreo.org.") - cutD - 0.05);
close.rest = close.url + 0.55;
const total = r3(Math.max(L.L12.end + 3.2, cutD + close.rest + 3.4));
const round = (o) => JSON.parse(JSON.stringify(o, (k, v) => (typeof v === "number" ? r3(v) : v)));

// ── generated artwork ───────────────────────────────────────────────────────
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const typo = (s) => s.replace(/'/g, "’"); // the page's own apostrophes

// The two-person field team: the object the eye follows from scene to scene. One drawing, used by every scene.
function chip(id, { compact = false } = {}) {
  const w = compact ? 480 : 660, h = compact ? 112 : 132, r = h / 2 - 2, cy = h / 2;
  const person = (x, ring) =>
    `<g transform="translate(${x} ${cy})"><g class="zg-p"><circle r="${compact ? 30 : 34}" fill="#1D3D1E"${ring ? ' stroke="#F7F4EC" stroke-width="5"' : ""} /><circle cy="${compact ? -8 : -9}" r="${compact ? 9.5 : 10.5}" fill="#F7F4EC" /><path d="M${compact ? "-17.5 19c0-11 7-16.5 17.5-16.5s17.5 5.5 17.5 16.5z" : "-19.5 21c0-12 8-18.5 19.5-18.5s19.5 6.5 19.5 18.5z"}" fill="#F7F4EC" /></g></g>`;
  const text = compact
    ? `<text x="172" y="${cy + 11}" font-family="ZG Inter" font-weight="600" font-size="31" letter-spacing="1.2" fill="#1D3D1E">FIELD TEAM OF 2</text>`
    : `<text x="186" y="59" font-family="ZG Inter" font-weight="600" font-size="32" letter-spacing="1.2" fill="#1D3D1E">FIELD TEAM OF 2</text>
        <text x="186" y="100" font-family="ZG Inter" font-weight="500" font-size="28" letter-spacing="0.8" fill="#4B5245">1 WORKER · 1 SUPERVISOR</text>`;
  return `<svg id="${id}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
        <rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="${r}" fill="#F7F4EC" stroke="#1D3D1E" stroke-width="4" />
        ${person(compact ? 70 : 78)}${person(compact ? 114 : 128, true)}
        ${text}
      </svg>`;
}

// A quotation as word spans (so each lights on its spoken word), broken into lines; `em` italicises the last lines.
function quoteSpans(words, breaks, emFrom = Infinity) {
  let k = 0;
  return breaks
    .map((n, li) => {
      const line = words.slice(k, k + n).map((w) => `<span class="w">${esc(typo(w))}</span>`).join(" ");
      k += n;
      return li >= emFrom ? `<em>${line}</em>` : line;
    })
    .join("<br />\n          ");
}

// The country and the messages across it. World units: the camera pivot is the centre of the country's bounding box.
const WC = { x: 4000, y: 2000 };
const PIV = 520; // the camera pivot on screen (px from the top): the centre of the quotation and of the country
function pip(x, y, r) {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function country() {
  const R = rng(792);
  const CW = 1300 / SMIN, CH = CW * outline.aspect, X0 = WC.x - CW / 2, Y0 = WC.y - CH / 2;
  const rings = outline.rings.map((r) => r.map(([u, v]) => [X0 + u * CW, Y0 + v * CW]));
  const inside = (x, y) => rings.some((r) => pip(x, y, r));
  let dots = "", row = 0;
  for (let y = Y0 + 30; y < Y0 + CH; y += 100, row++)
    for (let x = X0 + (row % 2 ? 58 : 0); x < X0 + CW; x += 116) if (inside(x, y)) dots += `M${x.toFixed(0)} ${y.toFixed(0)}h0`;
  const edge = rings.map((r) => "M" + r.map((p) => `${p[0].toFixed(0)} ${p[1].toFixed(0)}`).join("L") + "Z").join("");
  // message bubbles on a staggered grid, kept off the quotation (and the attribution under it) at the centre
  const keep = { x0: WC.x - 960, x1: WC.x + 960, y0: WC.y - 320, y1: WC.y + 250 };
  const label = { x0: WC.x - 320, x1: WC.x + 320, y0: WC.y - (PIV - 40) / 0.9, y1: WC.y - (PIV - 110) }; // the eyebrow at the top of the screen while the quotation is read
  const cells = [];
  row = 0;
  for (let gy = Y0 - 40; gy < Y0 + CH; gy += 232, row++)
    for (let gx = X0 - 60 + (row % 2) * 178; gx < X0 + CW; gx += 356) {
      const k = 0.82 + R() * 0.3, w = 260 * k, h = 126 * k;
      const x = gx + (R() - 0.5) * 84, y = gy + (R() - 0.5) * 60, cx = x + w / 2, cy = y + h / 2;
      if (!inside(cx, cy)) continue;
      const hole = x + w > keep.x0 && x < keep.x1 && y + h > keep.y0 && y < keep.y1;
      const late = x + w > label.x0 && x < label.x1 && y + h > label.y0 && y < label.y1;
      cells.push({ x, y, w, h, cx, cy, hole, late, flip: R() < 0.4, d: Math.hypot(cx - WC.x, cy - WC.y) });
    }
  const defs = `<defs>
            <symbol id="zg-ba" viewBox="0 0 620 300"><path d="M90 0H530a90 90 0 0 1 90 90v70a90 90 0 0 1-90 90H150l-80 50 14-54A90 90 0 0 1 0 160V90A90 90 0 0 1 90 0z" fill="#F4F1E8" /><rect x="80" y="70" width="380" height="36" rx="18" fill="#C5CABB" /><rect x="80" y="136" width="250" height="36" rx="18" fill="#C5CABB" /></symbol>
            <symbol id="zg-bb" viewBox="0 0 620 300"><path d="M530 0H90A90 90 0 0 0 0 90v70a90 90 0 0 0 90 90H470l80 50-14-54A90 90 0 0 0 620 160V90A90 90 0 0 0 530 0z" fill="#F4F1E8" /><rect x="80" y="70" width="320" height="36" rx="18" fill="#C5CABB" /><rect x="80" y="136" width="420" height="36" rx="18" fill="#C5CABB" /></symbol>
            <symbol id="zg-br" viewBox="0 0 380 190"><path d="M60 0H320a60 60 0 0 1 60 60v40a60 60 0 0 1-60 60H96l-50 30 8-32A60 60 0 0 1 0 100V60A60 60 0 0 1 60 0z" fill="#A8C3A0" /><rect x="54" y="46" width="200" height="26" rx="13" fill="#1D3D1E" opacity="0.55" /><rect x="54" y="90" width="130" height="26" rx="13" fill="#1D3D1E" opacity="0.55" /></symbol>
          </defs>`;
  const map = `<g id="ID-map"><path d="${edge}" fill="rgba(232,228,227,0.035)" stroke="rgba(232,228,227,0.34)" stroke-width="11" stroke-linejoin="round" /><path d="${dots}" fill="none" stroke="rgba(232,228,227,0.26)" stroke-width="34" stroke-linecap="round" /></g>`;
  return { defs, map, cells };
}
const use = (c, cls, extra = "") =>
  `<use class="${cls}" href="${c.flip ? "#zg-bb" : "#zg-ba"}" x="${c.x.toFixed(0)}" y="${c.y.toFixed(0)}" width="${c.w.toFixed(0)}" height="${c.h.toFixed(0)}"${extra} />`;
const pack = (a, n = 10) => a.reduce((o, x, i) => (i % n ? (o[o.length - 1] += x) : o.push(x), o), []);
const land = country();

// scene 1: the bubbles land faster and faster around the quotation, then the whole country fills as the camera pulls back
function beforeField() {
  const s0 = before.s0;
  const near = land.cells.filter((c) => !c.hole && !c.late && Math.abs(c.cx - WC.x) < 960 / s0 + c.w / 2 && c.cy - WC.y > -PIV / s0 - c.h / 2 && c.cy - WC.y < (1080 - PIV) / s0 + c.h / 2);
  const nearSet = new Set(near);
  near.sort((a, b) => b.d - a.d); // the outer ones first: the messages close in on the words
  const t0 = L.L1.start + 0.75, t1 = W("L1", "volume.") + 0.1;
  const first = near.filter((c) => Math.abs(c.cx - WC.x) < 960 && c.cy - WC.y > -PIV && c.cy - WC.y < 1080 - PIV).slice(0, 4);
  const rest = near.filter((c) => !first.includes(c));
  first.forEach((c) => (c.t = -1)); // already there on frame 0
  rest.forEach((c, i) => (c.t = t0 + (t1 - t0) * Math.pow(i / Math.max(1, rest.length - 1), 0.62)));
  const late = land.cells.filter((c) => c.late && !c.hole); // under the top label: these wait until the camera has moved off it
  late.forEach((c, i) => (c.t = before.pullStart + 0.6 + i * 0.04));
  const far = land.cells.filter((c) => !c.hole && !c.late && !nearSet.has(c)).sort((a, b) => a.d - b.d);
  far.forEach((c, i) => (c.t = before.pullStart + 0.15 + (before.pullEnd - before.pullStart) * 0.72 * Math.pow(i / Math.max(1, far.length - 1), 0.75)));
  const hole = land.cells.filter((c) => c.hole).sort((a, b) => b.d - a.d);
  hole.forEach((c, i) => (c.t = before.quoteOut + 0.45 + i * 0.05)); // once the words are gone, the messages cover where they were
  const all = [...near, ...far, ...late, ...hole];
  const uses = all.map((c) => use(c, c.t < 0 ? "bf-b bf-b0" : "bf-b", ` data-t="${r3(c.t)}"`));
  before.counts = { onFrame0: first.length, duringQuote: rest.length, duringPull: far.length + late.length, overTheQuote: hole.length };
  return [land.defs, land.map.replace("ID-map", "bf-map"), `<g id="bf-bubbles">`, ...pack(uses), `</g>`].join("\n          ");
}

// scene 5: the same country, and every message has an answer
function closeField() {
  const cells = [...land.cells].sort((a, b) => a.d - b.d);
  const uses = cells.map((c) => use(c, "cl-b"));
  const replies = cells.map((c) => `<use class="cl-r" href="#zg-br" x="${(c.x + c.w * 0.5).toFixed(0)}" y="${(c.y + c.h * 0.55).toFixed(0)}" width="${(c.w * 0.7).toFixed(0)}" height="${(c.h * 0.7).toFixed(0)}" />`);
  return [land.defs, land.map.replace("ID-map", "cl-map"), `<g id="cl-bubbles">`, ...pack(uses), `</g>`, `<g id="cl-replies">`, ...pack(replies), `</g>`].join("\n          ");
}

// scene 3: one block of 100 dots for the team alone; 373 of 400 for the team with the AI agent. A picture of the ratio:
// the case study publishes the ratio, not counts.
function resultDots() {
  const P = 22, R = 7.5;
  const block = (bx, n, cls, start = 0) => {
    let s = "";
    for (let i = 0; i < 100; i++) {
      const cx = bx + (i % 10) * P + R, cy = Math.floor(i / 10) * P + R;
      s += `<circle class="${i < n ? cls : cls + " rs-off"}" data-i="${start + i}" cx="${cx}" cy="${cy}" r="${R}" />`;
    }
    return s;
  };
  const a = block(0, 100, "rs-da");
  const b = [0, 1, 2, 3].map((k) => block(k * 245, 100, "rs-db", k * 100)).join("\n          ");
  return { a, b };
}

// scene 4: who is around the team. Positions are the places each message stops (screen px, the team at 540, 760).
function reliefBubbles() {
  const OFF = (a) => a.map(([x, y]) => [x + 60, y - 200]);
  const C = { x: 600, y: 560 };
  const hostile = OFF([
    [150, 656], [128, 776], [166, 898], [930, 656], [952, 776], [914, 898], [212, 530], [868, 530], [300, 990], [780, 990],
  ]);
  const sincere = OFF([[540, 1092], [396, 1078], [684, 1078]]);
  const dock = OFF([[540, 880], [402, 876], [678, 876]]); // inside the line, beside the team
  const spike = (() => {
    // a jagged burst: the shape, not the colour, says this one is hostile
    const pts = [];
    const n = 11;
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
      const rx = i % 2 ? 44 : 62, ry = i % 2 ? 30 : 44;
      pts.push(`${(Math.cos(a) * rx).toFixed(1)} ${(Math.sin(a) * ry).toFixed(1)}`);
    }
    return "M" + pts.join("L") + "Z";
  })();
  const round = `<path d="M-52 -34h104a16 16 0 0 1 16 16v30a16 16 0 0 1-16 16h-78l-22 16 4-17a16 16 0 0 1-24-15v-30a16 16 0 0 1 16-16z" fill="#F4F1E8" /><rect x="-40" y="-18" width="62" height="9" rx="4.5" fill="#C5CABB" /><rect x="-40" y="-1" width="40" height="9" rx="4.5" fill="#C5CABB" />`;
  const h = hostile.map(([x, y], i) => {
    const a = Math.atan2(y - C.y, x - C.x), fx = x + Math.cos(a) * 560, fy = y + Math.sin(a) * 560;
    return `<g class="rf-h" id="rf-h${i}" data-x="${x}" data-y="${y}" data-fx="${fx.toFixed(0)}" data-fy="${fy.toFixed(0)}"><g class="rf-hr">${round}</g><g class="rf-hs"><path d="${spike}" fill="#0A150B" stroke="#E8E4E3" stroke-width="3.5" stroke-linejoin="round" /><path d="M-30 -8l10 -9 10 9 10 -9 10 9 10 -9M-22 12l9 -8 9 8 9 -8 9 8" fill="none" stroke="#E8E4E3" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" /></g></g>`;
  });
  // the gracious reply to each hostile message sits on its inner corner
  const rep = hostile.map(([x, y], i) => `<g class="rf-rep" id="rf-rep${i}" transform="translate(${y < 400 ? x + (x < C.x ? -8 : 8) : x + (x < C.x ? 46 : -46)} ${y < 400 ? y + 50 : y + 32})"><path d="M-36 -24h72a12 12 0 0 1 12 12v20a12 12 0 0 1-12 12h-52l-16 12 3-13a12 12 0 0 1-19-11v-20a12 12 0 0 1 12-12z" fill="#A8C3A0" /><rect x="-26" y="-12" width="42" height="7" rx="3.5" fill="#1D3D1E" opacity="0.55" /><rect x="-26" y="1" width="26" height="7" rx="3.5" fill="#1D3D1E" opacity="0.55" /></g>`);
  const s = sincere.map(([x, y], i) => `<g class="rf-s" id="rf-s${i}" data-x="${x}" data-y="${y}" data-dx="${dock[i][0]}" data-dy="${dock[i][1]}">${round}</g>`);
  return [...h, ...rep, ...s].join("\n          ");
}

// ── sound ───────────────────────────────────────────────────────────────────
// House rules: every effect has a cause on screen, no chimes, pops rotated across three takes, nothing under the first
// words, one soft swell (the hand-off) and no riser on the statistic.
const F = 1 / 30;
const cues = [];
const sfx = (f, at, vol, opts = {}) => {
  const m = sfxMeta[f];
  const ms = opts.mediaStart || 0;
  const dur = opts.duration || m.duration - ms;
  const start = at + F - (m.peak - ms);
  cues.push({ f, start: r3(Math.max(0, start)), ms: r3(ms), dur: r3(dur), vol });
};
const wb = (id, word) => W(id, word);
sfx("pop-lo", wb("L1", "messages") + 0.1, 0.13); // messages landing, well after the first words
sfx("pop", wb("L1", "busy,") + 0.1, 0.13);
sfx("pop-hi", wb("L1", "volume.") + 0.05, 0.14);
sfx("whoosh-cinematic", before.pullStart + 0.5 * (before.pullEnd - before.pullStart), 0.18); // the pull-back
sfx("pop-lo", before.chip + 0.08, 0.15); // the team lands
sfx("whoosh-short", cutA, 0.2);
sfx("whoosh", cutA + pilot.travel + 0.5 * pilot.travelDur, 0.16); // down the path
sfx("click-soft", cutA + pilot.answers + 0.04, 0.3);
sfx("click-soft", cutA + pilot.follows + 0.04, 0.3);
sfx("impact-bass-2", cutA + pilot.impact + 0.1, 0.14); // the hand-off: the one soft swell
sfx("whoosh", cutB, 0.2);
sfx("pop", cutB + result.num + 0.1, 0.16); // the number lands (no riser)
sfx("whoosh-short", cutB + result.nudge + 0.25, 0.13);
sfx("whoosh-short", cutC, 0.2);
sfx("pop-lo", cutC + relief.take + 0.2, 0.15); // the abuse lands on the team
sfx("pop", cutC + relief.take + 0.56, 0.13);
sfx("click-soft", cutC + relief.pilot + 0.62, 0.34); // the line closes around the team
sfx("pop-hi", cutC + relief.answered + 0.08, 0.13); // the replies
sfx("whoosh", cutD, 0.2);
sfx("whoosh-short", cutD + close.logo + 0.35, 0.15);
sfx("pop-hi", cutD + close.call + 0.1, 0.15);
sfx("pop", cutD + close.give + 0.1, 0.15);

// ── write ───────────────────────────────────────────────────────────────────
const FONTS = rd("src/fonts.css").trim().split("\n").join("\n    ");
const stamp = (src, T, extra = {}) => {
  let s = rd(src).replace("/*{{FONTS}}*/", FONTS).replace("/*{{T}}*/ {}", JSON.stringify(round(T)));
  for (const [k, v] of Object.entries(extra)) {
    if (!s.includes(`<!--{{${k}}}-->`)) throw new Error(`${src} has no {{${k}}} slot`);
    s = s.replace(`<!--{{${k}}}-->`, v);
  }
  const left = s.match(/\{\{[A-Z0-9]+\}\}/);
  if (left) throw new Error(`${src}: unfilled slot ${left[0]}`);
  return s;
};
const l1 = script.lines.find((l) => l.id === "L1").text.split(/\s+/);
const l10 = script.lines.find((l) => l.id === "L10").text.split(/\s+/).slice(4);
const fieldSvg = beforeField(); // also sets each bubble's landing time
wr("compositions/before.html", stamp("src/before.html", before, { FIELD: fieldSvg, QUOTE: quoteSpans(l1, [9, 10, 7]), CHIP: chip("bf-chip") }));
wr("compositions/pilot.html", stamp("src/pilot.html", pilot, { CHIP: chip("pl-chip") }));
const rd3 = resultDots();
wr("compositions/result.html", stamp("src/result.html", result, { DOTSA: rd3.a, DOTSB: rd3.b }));
wr("compositions/relief.html", stamp("src/relief.html", relief, { BUBBLES: reliefBubbles(), CHIP: chip("rf-chip", { compact: true }), QUOTE: quoteSpans(l10, [7, 8, 5, 4], 2) }));
wr("compositions/close.html", stamp("src/close.html", close, { FIELD: closeField(), CHIP: chip("cl-chip") }));

const host = (id, start, dur) =>
  `    <div id="${id}" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${r3(start)}" data-duration="${r3(dur)}" data-track-index="1" data-track-kind="graphics" data-width="1920" data-height="1080"></div>`;
const trackEnd = [];
for (const c of cues.sort((a, b) => a.start - b.start)) {
  let k = trackEnd.findIndex((e) => e <= c.start - 0.01);
  if (k < 0) k = trackEnd.push(0) - 1;
  trackEnd[k] = c.start + c.dur;
  c.track = 5 + k;
}
const audio = cues
  .map((c, i) => `    <audio id="sfx-${String(i + 1).padStart(2, "0")}" class="clip" src="assets/sfx/${c.f}.mp3" data-start="${c.start}"${c.ms ? ` data-media-start="${c.ms}"` : ""} data-duration="${c.dur}" data-track-index="${c.track}" data-volume="${c.vol}" data-audio-group="sfx"></audio>`)
  .join("\n");
// a music bed is optional: put a licensed track at assets/music/bed.(mp3|wav|m4a) and rebuild; it sits at about 0.14 under the voice
const bedFile = ["mp3", "wav", "m4a"].map((e) => `assets/music/bed.${e}`).find((f) => fs.existsSync(path.join(ROOT, f)));
const music = bedFile
  ? `    <audio id="music" class="clip" src="${bedFile}" data-start="0" data-duration="${total}" data-track-index="3" data-volume="0.14" data-audio-group="music"></audio>`
  : "";
const hasVO = !PROVISIONAL && fs.existsSync(path.join(ROOT, "assets/vo/vo.wav"));
const vo = hasVO
  ? `    <audio id="vo" class="clip" src="assets/vo/vo.wav" data-start="0" data-duration="${r3(timing.duration)}" data-track-index="4" data-volume="1" data-audio-group="voiceover"></audio>`
  : `    <!-- no narration yet: build/timing.json is an estimate (tools/draft_timing.mjs). Record the takes, run vo.py take, rebuild. -->`;
wr(
  "index.html",
  `<!doctype html>
<html lang="en" data-resolution="landscape">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      html, body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #0C1D0D; }
      #root { position: relative; width: 1920px; height: 1080px; overflow: hidden; background: #0C1D0D; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="1920" data-height="1080">
${host("before", 0, cutA)}
${host("pilot", cutA, cutB - cutA)}
${host("result", cutB, cutC - cutB)}
${host("relief", cutC, cutD - cutC)}
${host("close", cutD, total - cutD)}
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

const t2 = (x) => `${Math.floor(x / 60)}:${(x % 60).toFixed(1).padStart(4, "0")}`;
wr("MUSIC-CUES.md", `# Music cue sheet (generated by tools/build.mjs from the narration's word times)
${PROVISIONAL ? "\n**These times are estimates: the narration has not been recorded yet.** Rebuild after `vo.py take`.\n" : ""}
The film is ${t2(total)} long and has no music. To add a bed later: put a licensed track at \`assets/music/bed.mp3\`
(or .wav / .m4a), run \`node tools/build.mjs\`, and render. It plays on its own track at about 0.14 under the voice.
Or add it in any editor using the stems in \`renders/stems/\` (narration, effects, mix).

**Brief:** sparse, warm piano or cello with a soft pad, about 70 bpm. No drums, no choir, no trailer build.
Keep its energy above 150 Hz where possible (phone speakers lose the low end). Weight first, then relief:
still under the responder's words, opening at the hand-off, steady for the numbers, resolving on the end card.

| Time | Picture and words | Music |
| --- | --- | --- |
| ${t2(0)} | The responder's words, messages landing around them | Enter very softly, or not at all |
| ${t2(before.pullStart)} – ${t2(cutA)} | Pull back to the whole country; the field team of two | A single held note; nothing that resolves |
| ${t2(cutA)} | "So at Zogreo, we ran a pilot" | Music returns here (first real phrase) |
| ${t2(cutA + pilot.travel)} – ${t2(cutA + pilot.handed)} | Down the path: three Bible studies | Gentle build |
| ${t2(cutA + pilot.impact)} | **Handed to the team on the ground** (the film's peak) | The swell lands here, then holds |
| ${t2(cutB)} | The results; 3.73× lands at ${t2(cutB + result.num)} | Steady, warm; no hit on the number |
| ${t2(cutC)} – ${t2(cutC + relief.pilot)} | Hostile messages reach the team | Thin out; a little tension, no menace |
| ${t2(cutC + relief.pilot)} – ${t2(cutC + relief.quoteIn)} | The line closes around the team; every hostile message gets a gracious answer | Ease |
| ${t2(cutC + relief.quoteIn)} – ${t2(cutD)} | The responder's words again | Warm and still; let the voice lead |
| ${t2(cutD)} | The country again, every message answered | Brightens |
| ${t2(cutD + close.logo)} | Logo and the ask ("Book a call, or give, at zogreo.org") | Resolve |
| ${t2(L.L12.end)} – ${t2(total)} | End card holds | End on a bar line with a short fade by ${t2(total)} |
`);
wr("build/events.json", JSON.stringify(round({
  "cut before→pilot": cutA, "cut pilot→result": cutB, "cut result→relief": cutC, "cut relief→close": cutD,
  "pull-back": (before.pullStart + before.pullEnd) / 2, "team lands": before.chip, "down the path": cutA + pilot.travel + pilot.travelDur / 2,
  "hand-off": cutA + pilot.impact, "3.73 lands": cutB + result.num, "second finding": cutB + result.nudge, "hostile": cutC + relief.hostile,
  "line closes": cutC + relief.pilot + 0.6, "quote in": cutC + relief.quoteIn, "field steps back": cutD + close.fieldOut, "logo wipe": cutD + close.logo,
}), null, 2) + "\n");
wr("build/cues.json", JSON.stringify(round({ provisional: PROVISIONAL, total, cutA, cutB, cutC, cutD, before, pilot, result, relief, close, sfx: cues }), null, 2));
// the vector ledger for the motion doctrine's seam gate: one row per scene boundary (LEFT = next beat, UP = a conclusion rises)
const seam = (id, cut, dir, a, b) => {
  const [axis, d, name] = dir === "LEFT" ? ["x", -1, "LEFT"] : ["y", -1, "UP"];
  return { id, cut: r3(cut), technique: `cut-the-curve ${name}`, exit: { selector: a, axis, dir: d }, entry: { selector: b, axis, dir: d } };
};
wr("ledger.json", JSON.stringify({ fps: 30, seams: [
  seam("before→pilot", cutA, "LEFT", "#bf-stage", "#pl-stage"),
  seam("pilot→result", cutB, "UP", "#pl-stage", "#rs-stage"),
  seam("result→relief", cutC, "LEFT", "#rs-stage", "#rf-stage"),
  seam("relief→close", cutD, "UP", "#rf-stage", "#cl-stage"),
] }, null, 2) + "\n");

// captions as a sidecar (nothing is burned into the picture): phrase breaks from tools/script.json mapped onto word times
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
const stampT = (x, sep) => {
  const ms = Math.round(x * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}${sep}${String(ms % 1000).padStart(3, "0")}`;
};
const caps = groups.map((g, i) => {
  const next = groups[i + 1];
  let end = g[g.length - 1].end + 0.35;
  if (next && next[0].start - 0.06 < end) end = next[0].start - 0.06;
  return { text: typo(g.map((w) => w.w).join(" ")), start: Math.max(0.1, g[0].start - 0.06), end };
});
if (PROVISIONAL) {
  for (const f of ["captions.vtt", "captions.srt"]) if (fs.existsSync(path.join(ROOT, f))) fs.rmSync(path.join(ROOT, f));
} else {
  wr("captions.vtt", "WEBVTT\n\n" + caps.map((c, i) => `${i + 1}\n${stampT(c.start, ".")} --> ${stampT(c.end, ".")}\n${c.text}\n`).join("\n"));
  wr("captions.srt", caps.map((c, i) => `${i + 1}\n${stampT(c.start, ",")} --> ${stampT(c.end, ",")}\n${c.text}\n`).join("\n"));
}
console.log(`built: ${total}s · before 0–${r3(cutA)} · pilot –${r3(cutB)} · result –${r3(cutC)} · relief –${r3(cutD)} · close –${total} · ${cues.length} sfx · bubbles ${JSON.stringify(before.counts)}`);
if (PROVISIONAL) console.log("WARNING: build/timing.json is an ESTIMATE (no narration yet). The voice track is left out; do not deliver this build.");
