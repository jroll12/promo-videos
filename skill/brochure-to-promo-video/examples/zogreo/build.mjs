#!/usr/bin/env node
// WORKED EXAMPLE (Zogreo, 75 s, three scenes). Shows the product-specific half of a build:
// name each scene's cues from the narration's word times, generate artwork, place sound.
// Everything generic (captions, sound placement, index.html, ledger) comes from cues.mjs.
//
//   node tools/build.mjs [projectRoot]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(here, "..");
const { createProject, rng, pack, r3 } = await import(fs.existsSync(path.join(here, "cues.mjs")) ? "./cues.mjs" : "../../lib/cues.mjs");

const p = createProject(ROOT, {
  scriptPath: fs.existsSync(path.join(ROOT, "script.json")) ? "script.json" : "tools/script.json",
  ground: "#0C1D0D",
  captionFont: '"ZG Inter"',
});
const { L, W } = p;

// ── cues, scene 1 "night": the 2 a.m. message ──────────────────────────────
const night = {};
night.hookA = W("L1", "ad,");
night.hookB = Math.max(W("L1", "asks"), night.hookA + 0.82); // the second move starts once the first has landed
night.hookOut = L.L2.start - 0.12;
const l2 = L.L2.end - L.L2.start;
night.arr = [0.02, 0.15, 0.28, 0.4, 0.51, 0.61].map((f) => L.L2.start + f * l2);
night.wait = W("L3", "wait");
night.off = W("L3", "off");
night.closing = W("L3", "closing");
night.pullStart = L.L3.end + 0.12;
night.pullEnd = Math.max(L.L4.start + 0.9, night.pullStart + 2.0);
night.verse = L.L4.words.map((w) => w.start);
night.workers = W("L4", "workers");
night.few = W("L4", "few");
night.ref = W("L4", "but");
night.verseOut = Math.max(night.ref + 1.6, Math.min(W("L5", "Zogreo") - 0.35, L.L5.start + 0.6));
night.zogreo = W("L5", "Zogreo");
night.named = W("L5", "named");
night.catching = W("L5", "catching");
night.def = W("L5", "word");
night.nameOut = L.L5.end + 0.15;
night.pushStart = L.L5.end + 0.22;
night.pushEnd = Math.max(L.L6.start + 0.2, night.pushStart + 1.3);
night.swap = night.pushStart + 0.6 * (night.pushEnd - night.pushStart);
night.typing = night.pushEnd + 0.02;
night.answers = Math.max(W("L6", "answers"), night.typing + 0.45);
night.heart = W("L6", "heart");
night.m3 = W("L6", "bluffing");
night.m4 = W("L6", "hard");
night.m5 = L.L7.start;
night.ready = W("L7", "ready");
night.believer = W("L7", "believer");
night.carries = W("L7", "carries");
const cutB = L.L7.end + 0.55;
night.exit = cutB - 0.32;
night.sMin = 0.14;
night.sEnd = 1.12;
night.scroll = [238, 352, 438, 522, 664]; // chat offsets, from the fixed bubble heights in night.html

// ── scene 2 "proof": the pilot number ──────────────────────────────────────
const proof = {};
proof.label = Math.max(0.2, W("L8", "weeklong") - cutB - 0.3);
proof.team = W("L8", "two-person") - cutB;
proof.serve = W("L8", "serve") - cutB;
proof.times = W("L8", "times") - cutB;
proof.seekers = W("L8", "seekers") - cutB;
proof.replace = W("L9", "replace") - cutB;
proof.multiplies = W("L9", "multiplies") - cutB;
const cutC = L.L9.end + 0.6;
proof.exit = cutC - 0.32 - cutB;

// ── scene 3 "give": the ask ────────────────────────────────────────────────
const give = {};
give.head = L.L10.words.map((w) => w.start - cutC);
give.headOut = L.L11.start - cutC - 0.25;
give.logo = L.L11.start - cutC - 0.05;
give.give = W("L11", "zogreo.org") - cutC - 0.05;
give.book = W("L11", "book") - cutC - 0.05;
const total = r3(L.L11.end + 3.2);

// ── generated artwork ──────────────────────────────────────────────────────
function fieldSvg() {
  const R = rng(20261031);
  const C = { x: 8000, y: 13000 };
  const keepOut = [
    { x0: 7570 - 240, y0: 12110 - 240, x1: 8430 + 240, y1: 13890 + 240 },
    { x0: 8700 - 240, y0: 12290 - 240, x1: 9560 + 240, y1: 14070 + 240 },
  ];
  const hits = (x, y) => keepOut.some((k) => x + 620 > k.x0 && x < k.x1 && y + 300 > k.y0 && y < k.y1);
  const cells = [];
  for (let y = 5200; y < 20400; y += 580)
    for (let x = 3500 + ((y / 580) % 2) * 430; x < 12500; x += 860) {
      const k = 0.8 + R() * 0.34;
      const bx = x + (R() - 0.5) * 420, by = y + (R() - 0.5) * 260;
      if (!hits(bx, by)) cells.push({ x: bx, y: by, k, flip: R() < 0.35, d: Math.hypot(bx + 310 - C.x, by + 150 - C.y) });
    }
  cells.sort((a, b) => a.d - b.d);
  const seekers = cells.map((c) => {
    const op = (0.96 - 0.38 * Math.min(1, c.d / 8000)).toFixed(2);
    return `<use href="${c.flip ? "#nt-sb2" : "#nt-sb"}" x="${c.x.toFixed(0)}" y="${c.y.toFixed(0)}" width="${(620 * c.k).toFixed(0)}" height="${(300 * c.k).toFixed(0)}" opacity="${op}" />`;
  });
  const replies = cells.map((c, i) => {
    const cls = i < 2 ? "nt-r nt-r-few" : "nt-r nt-r-wave";
    return `<use class="${cls}" href="#nt-sr" x="${(c.x + 330 * c.k).toFixed(0)}" y="${(c.y + 190 * c.k).toFixed(0)}" width="${(380 * c.k).toFixed(0)}" height="${(190 * c.k).toFixed(0)}" />`;
  });
  const defs = `<defs>
            <symbol id="nt-sb" viewBox="0 0 620 300"><path d="M90 0H530a90 90 0 0 1 90 90v70a90 90 0 0 1-90 90H150l-80 50 14-54A90 90 0 0 1 0 160V90A90 90 0 0 1 90 0z" fill="#F4F1E8" /><rect x="80" y="70" width="380" height="36" rx="18" fill="#C5CABB" /><rect x="80" y="136" width="250" height="36" rx="18" fill="#C5CABB" /></symbol>
            <symbol id="nt-sb2" viewBox="0 0 620 300"><path d="M530 0H90A90 90 0 0 0 0 90v70a90 90 0 0 0 90 90H470l80 50-14-54A90 90 0 0 0 620 160V90A90 90 0 0 0 530 0z" fill="#F4F1E8" /><rect x="80" y="70" width="320" height="36" rx="18" fill="#C5CABB" /><rect x="80" y="136" width="420" height="36" rx="18" fill="#C5CABB" /></symbol>
            <symbol id="nt-sr" viewBox="0 0 380 190"><path d="M60 0H320a60 60 0 0 1 60 60v40a60 60 0 0 1-60 60H96l-50 30 8-32A60 60 0 0 1 0 100V60A60 60 0 0 1 60 0z" fill="#A8C3A0" /><rect x="54" y="46" width="200" height="26" rx="13" fill="#1D3D1E" opacity="0.55" /><rect x="54" y="90" width="130" height="26" rx="13" fill="#1D3D1E" opacity="0.55" /></symbol>
          </defs>`;
  const w2 = `<g id="nt-w2"><rect x="8700" y="12290" width="860" height="1780" rx="124" fill="#0A150B" stroke="#E8E4E3" stroke-opacity="0.16" stroke-width="3" /><rect x="8714" y="12304" width="832" height="1752" rx="110" fill="#183519" /><rect x="8744" y="12756" width="772" height="300" rx="40" fill="#F4F1E8" opacity="0.95" /><rect x="8744" y="13080" width="772" height="185" rx="40" fill="#F4F1E8" opacity="0.95" /><rect x="8744" y="13280" width="772" height="185" rx="40" fill="#F4F1E8" opacity="0.95" /><rect id="nt-w2-dim" x="8714" y="12304" width="832" height="1752" rx="110" fill="#040904" opacity="0.94" /></g>`;
  return [defs, `<g id="nt-seekers">`, ...pack(seekers), `</g>`, w2, `<g id="nt-replies">`, ...pack(replies), `</g>`].join("\n          ");
}

function proofSvg() {
  const R = rng(373);
  const team = { x: 540, y: 262 };
  const pts = [];
  const ring = (n, rx, ry, cls, phase) => {
    for (let i = 0; i < n; i++) {
      const a = phase + (i / n) * Math.PI * 2 + (R() - 0.5) * 0.35;
      const k = 0.92 + R() * 0.16;
      pts.push({ x: team.x + Math.cos(a) * rx * k - 36, y: team.y + Math.sin(a) * ry * k - 28, cls });
    }
  };
  ring(8, 230, 165, "pf-s0", 0.2);
  ring(22, 450, 225, "pf-s1", 0.05);
  const seekers = pts.map((q) => `<use class="pf-s ${q.cls}" href="#pf-bubble" x="${q.x.toFixed(0)}" y="${q.y.toFixed(0)}" width="72" height="56" />`);
  const links = pts.map((q) => {
    const cx = q.x + 36, cy = q.y + 28;
    const from = cx < team.x ? { x: 478, y: 236 } : { x: 602, y: 236 };
    return `<line class="pf-l" x1="${from.x}" y1="${from.y}" x2="${cx.toFixed(0)}" y2="${cy.toFixed(0)}" stroke="#778B78" stroke-width="2.5" stroke-linecap="round" pathLength="100" stroke-dasharray="100 120" stroke-dashoffset="110" />`;
  });
  return { seekers: seekers.join("\n          "), links: links.join("\n          ") };
}

// ── sound: every effect has a cause on screen ──────────────────────────────
const sfx = p.sfx;
sfx("notification", 0.1, 0.3);
["notification", "pop", "ping", "notification", "pop", "ping"].forEach((f, i) => sfx(f, night.arr[i] + 0.1, [0.18, 0.28, 0.15, 0.16, 0.26, 0.13][i]));
sfx("click-soft", night.off + 0.02, 0.55);
sfx("whoosh-cinematic", night.pullStart + 0.5 * (night.pullEnd - night.pullStart), 0.2);
sfx("pop", night.few + 0.08, 0.2);
sfx("pop", night.few + 0.26, 0.16);
sfx("whoosh", night.pushStart + 0.5 * (night.pushEnd - night.pushStart), 0.22);
sfx("pop", night.answers + 0.06, 0.22);
sfx("click-soft", night.heart + 0.02, 0.5);
sfx("pop", night.m3 + 0.06, 0.18);
sfx("pop", night.m4 + 0.06, 0.18);
sfx("pop", night.m5 + 0.06, 0.16);
sfx("ping", night.ready + 0.1, 0.16);
sfx("notification", night.believer + 0.06, 0.18);
sfx("whoosh-short", cutB, 0.24);
sfx("riser", cutB + proof.times + 0.12, 0.14, { mediaStart: 1.0, duration: 3.3 }); // the riser's envelope builds 1.0–3.47 s in the file
sfx("pop", cutB + proof.times + 0.14, 0.18);
sfx("whoosh", cutC, 0.22);
sfx("whoosh-short", cutC + give.logo + 0.35, 0.16);
sfx("pop", cutC + give.give + 0.1, 0.18);
sfx("pop", cutC + give.book + 0.1, 0.16);

// ── write ──────────────────────────────────────────────────────────────────
p.writeScene("night", night, { FIELD: fieldSvg() });
const ps = proofSvg();
p.writeScene("proof", proof, { SEEKERS: ps.seekers, LINKS: ps.links });
p.writeScene("give", give);
const caps = p.writeCaptions();
p.writeIndex(total, [
  { id: "night", start: 0, dur: cutB },
  { id: "proof", start: cutB, dur: cutC - cutB },
  { id: "give", start: cutC, dur: total - cutC },
]);
p.writeCues(total, { cutB, cutC, night, proof, give });
p.writeLedger([
  { id: "night→proof", cut: r3(cutB), technique: "cut-the-curve LEFT", exit: { selector: "#nt-stage", axis: "x", dir: -1 }, entry: { selector: "#pf-stage", axis: "x", dir: -1 } },
  { id: "proof→give", cut: r3(cutC), technique: "cut-the-curve UP", exit: { selector: "#pf-stage", axis: "y", dir: -1 }, entry: { selector: "#gv-stage", axis: "y", dir: -1 } },
]);
p.writeEvents({
  "cut night→proof": cutB,
  "cut proof→give": cutC,
  "lock→thread swap": night.swap,
  "push-in": (night.pushStart + night.pushEnd) / 2,
  "pull-back": (night.pullStart + night.pullEnd) / 2,
  "screen off": night.closing,
  "screen wakes": night.catching + 0.3,
  "AR→EN switch": night.heart,
  "verse out": night.verseOut,
  "name out": night.nameOut,
  "headline out": cutC + give.headOut,
  "logo wipe": cutC + give.logo,
});
console.log(`built: ${total}s · ${caps.length} caption groups · ${p.cues.length} sfx`);
