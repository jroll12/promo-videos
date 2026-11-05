#!/usr/bin/env node
// Builds the Zogreo intro from one timing file: every scene cue, caption and sound
// is stamped from the voiceover's word times in build/timing.json, so a new take
// (or a different VoiceStudio voice) is one `node tools/build.mjs` away.
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
const L = Object.fromEntries(timing.lines.map((l) => [l.id, l]));
const norm = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
function W(id, word, occ = 1) {
  let n = 0;
  for (const w of L[id].words) if (norm(w.w) === norm(word) && ++n === occ) return w.start;
  throw new Error(`"${word}" not found in ${id}`);
}

// ── cues ────────────────────────────────────────────────────────────────────
const night = {};
night.hookA = W("L1", "ad,");
night.hookB = Math.max(W("L1", "asks"), night.hookA + 0.82); // the second move starts once the first has landed
night.hookOut = L.L2.start - 0.12;
const l2 = L.L2.end - L.L2.start;
night.arr = [0.02, 0.17, 0.33, 0.5, 0.67, 0.84].map((f) => L.L2.start + f * l2); // messages keep pouring in through "can answer"
night.stackPush = night.arr[5] + 0.3;
night.wait = W("L3", "wait");
night.adPush = Math.max(night.wait + 0.5, W("L3", "ministry") - 0.2);
night.off = W("L3", "off");
night.clockEnd = night.off - 0.1; // the clock runs while seekers wait, until the camera reaches the switch
night.door = W("L3", "door");
night.closes = W("L3", "closes");
night.pullStart = L.L3.end + 0.12;
night.pullEnd = Math.max(L.L4.start + 0.9, night.pullStart + 2.0);
night.verse = L.L4.words.map((w) => w.start);
night.few = W("L4", "few");
night.ref = W("L4", "but");
night.verseOut = Math.max(night.ref + 1.6, Math.min(W("L5", "Zogreo") - 0.35, L.L5.start + 0.6));
night.zogreo = W("L5", "Zogreo");
night.its = W("L5", "It's");
night.def = W("L5", "word");
night.catching = W("L5", "catching");
night.wake = night.catching + 0.3;
night.nameOut = L.L5.end + 0.15;
night.pushStart = L.L5.end + 0.22;
night.pushEnd = Math.max(L.L6.start + 0.2, night.pushStart + 1.3);
night.swap = night.pushStart + 0.6 * (night.pushEnd - night.pushStart);
night.typing = night.pushEnd + 0.02;
night.answers = Math.max(W("L6", "answers"), night.typing + 0.45);
night.heart = W("L6", "heart");
night.stream = Math.max(0.8, Math.min(1.8, night.heart - night.answers - 0.2)); // the Arabic reply streams in before "heart language"
night.toggle = Math.max(night.answers + 0.8, W("L6", "and") - 0.05); // after "heart language", not on it
night.m3 = Math.max(night.toggle + 0.45, W("L6", "honest") + 0.05);
night.m4 = Math.max(night.m3 + 0.6, W("L6", "hard"));
night.m4b = Math.max(night.m4 + 0.9, L.L6.end + 0.25);
night.m5 = Math.max(night.m4b + 0.5, L.L7.start);
night.ready = W("L7", "ready");
night.believer = W("L7", "believer");
night.climaxScroll = night.believer - 0.62; // settle, then a breath of stillness before the believer arrives
night.handoffPush = night.ready + 0.45;
const cutB = L.L7.end + 0.55;
night.exit = cutB - 0.32;
night.sMin = 0.14;
night.sEnd = 0.95; // the wide frame is 1080 px tall: the phone is a close-up, not full height
night.chatY = { start: 240, m3: 100, m4: 0, m4b: -200, m5: -350, ready: -440, climax: -760 }; // the chat starts low and rises as it grows (positions from night.html)

const proof = {};
proof.team = W("L8", "Turkey") - cutB; // the first ring of messages arrives as the place is named
proof.twoPerson = W("L8", "two-person") - cutB;
proof.serve = W("L8", "serve") - cutB;
proof.num = W("L8", "3.73") - cutB; // the count lands as the number is spoken
proof.times = W("L8", "times") - cutB;
proof.seekers = W("L8", "seekers") - cutB;
proof.replace = W("L9", "replace") - cutB;
proof.multiplies = W("L9", "multiplies") - cutB;
const cutC = L.L9.end + 0.6;
proof.exit = cutC - 0.32 - cutB;

const give = {};
give.flip = L.L10.start - cutC + 0.35;
give.flipStep = Math.max(0.3, (W("L10", "safe") - cutC - give.flip) / 4); // five cards, the last on "safe"
give.phoneOut = L.L11.start - cutC - 0.3;
give.logo = L.L11.start - cutC - 0.05;
give.give = W("L11", "zogreo.org") - cutC - 0.05;
give.rest = give.give + 0.55;
const total = r3(L.L11.end + 3.2);
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

function fieldSvg() {
  const R = rng(20261031);
  const C = { x: 8000, y: 13000 };
  const keepOut = [{ x0: 7570 - 240, y0: 12110 - 240, x1: 8430 + 240, y1: 13890 + 240 }]; // her phone only: the field runs right up to it on every side
  const hits = (x, y) => keepOut.some((k) => x + 620 > k.x0 && x < k.x1 && y + 300 > k.y0 && y < k.y1);
  const cells = [];
  for (let y = 5200; y < 20400; y += 580)
    for (let x = 1100 + ((y / 580) % 2) * 430; x < 14900; x += 860) {
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
  const pack = (a) => a.reduce((o, x, i) => (i % 14 ? (o[o.length - 1] += x) : o.push(x), o), []);
  return [defs, `<g id="nt-seekers">`, ...pack(seekers), `</g>`, `<g id="nt-replies">`, ...pack(replies), `</g>`].join("\n          ");
}

function proofSvg() {
  const R = rng(373);
  const C = { x: 540, y: 300 };
  const pts = [];
  const ring = (n, rx, ry, cls, phase) => {
    for (let i = 0; i < n; i++) {
      const a = phase + (i / n) * Math.PI * 2 + (R() - 0.5) * 0.35;
      const k = 0.92 + R() * 0.16;
      pts.push({ x: C.x + Math.cos(a) * rx * k - 36, y: C.y + Math.sin(a) * ry * k - 28, cls, a });
    }
  };
  ring(8, 300, 185, "pf-s0", 0.2);
  ring(22, 470, 270, "pf-s1", 0.05);
  const keep = [{ x0: 288, y0: 242, x1: 792, y1: 362 }]; // the team chip: no seeker bubble may sit on it
  const hit = (p) => keep.some((k) => p.x + 72 > k.x0 && p.x < k.x1 && p.y + 56 > k.y0 && p.y < k.y1);
  for (const p of pts) {
    for (let step = 0; step < 6 && hit(p); step++) { p.x += Math.cos(p.a) * 40; p.y += Math.sin(p.a) * 26; }
  }
  const from = (cx) => (cx < C.x ? { x: 300, y: 302 } : { x: 780, y: 302 });
  const seekers = pts.map((p) => `<use class="pf-s ${p.cls}" href="#pf-bubble" x="${p.x.toFixed(0)}" y="${p.y.toFixed(0)}" width="72" height="56" />`);
  const links = pts.map((p) => {
    const cx = p.x + 36, cy = p.y + 28, f = from(cx);
    return `<line class="pf-l" x1="${f.x}" y1="${f.y}" x2="${cx.toFixed(0)}" y2="${cy.toFixed(0)}" stroke="#778B78" stroke-width="2.5" stroke-linecap="round" pathLength="100" stroke-dasharray="100 120" stroke-dashoffset="110" />`;
  });
  return { seekers: seekers.join("\n          "), links: links.join("\n          ") };
}

// the morning lock screen: the same people who were waiting, now answered (Layla's card on top)
function morningCards() {
  const icon = `<div class="gv-icon"><svg width="26" height="24" viewBox="0 0 26 24"><path d="M13 1C6.4 1 1 5.6 1 11.3c0 3.1 1.6 5.8 4.1 7.7L4 23l5-2.6c1.2.3 2.6.5 4 .5 6.6 0 12-4.6 12-10.3S19.6 1 13 1z" fill="#F7F4EC" /></svg></div>`;
  const people = [
    ["Layla", "Talking with a local believer", null],
    ["Omar", "Is anyone there?", "✓ answered"],
    ["Mehmet", "Can I ask you something?", "✓ answered"],
    ["Fatima", "I have a question about faith", "✓ answered"],
    ["Yusuf", "Who is Jesus to you?", "✓ answered"],
    ["Zeynep", "I saw your video. Can we talk?", "✓ answered"],
  ];
  return people
    .map(([name, prev, done], k) =>
      `<div class="gv-card" id="gv-k${k}" style="top:${k * 200}px"><div class="gv-row">${icon}MESSAGES<div class="gv-when">${done ? `<span class="gv-wait">waiting</span><span class="gv-done">${done}</span>` : `<span class="gv-live">● now</span>`}</div></div><div class="gv-name">${name}</div><div class="gv-prev">${prev}</div></div>`)
    .join("\n                ");
}

// ── captions ────────────────────────────────────────────────────────────────
function captionGroups() {
  // phrase breaks are authored in tools/script.json ("cap", split on " / ") and mapped onto word times by position
  const script = JSON.parse(rd("tools/script.json"));
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

// ── sound ───────────────────────────────────────────────────────────────────
const F = 1 / 30;
const cues = [];
const sfx = (f, at, vol, opts = {}) => {
  const m = sfxMeta[f];
  const ms = opts.mediaStart || 0;
  const dur = opts.duration || m.duration - ms;
  const start = at + F - (m.peak - ms);
  cues.push({ f, start: r3(Math.max(0, start)), ms: r3(ms), dur: r3(dur), vol });
};
const pops = ["pop", "pop-lo", "pop-hi"];
[0, 2, 4].forEach((i, k) => sfx(pops[k], night.arr[i] + 0.1, [0.16, 0.15, 0.13][k])); // three of the arrivals; no sound on the first word
sfx("click-soft", night.off + 0.02, 0.5); // the ad switch
sfx("whoosh-cinematic", night.pullStart + 0.5 * (night.pullEnd - night.pullStart), 0.18); // the pull-back; nothing under the verse
sfx("whoosh", night.pushStart + 0.5 * (night.pushEnd - night.pushStart), 0.2);
sfx("pop-lo", night.answers + 0.06, 0.16);
sfx("click-soft", night.toggle + 0.02, 0.4);
sfx("pop-hi", night.m4 + 0.06, 0.13);
sfx("pop", night.ready + 0.06, 0.13);
sfx("impact-bass-2", night.believer + 0.12, 0.14); // the hand-off: a soft swell that lands with the believer card
sfx("whoosh-short", cutB, 0.22);
sfx("pop", cutB + proof.num + 0.1, 0.16); // the number lands (no riser: the hand-off is the peak)
sfx("whoosh", cutC, 0.2);
sfx("click-soft", cutC + give.flip + 4 * give.flipStep + 0.08, 0.35); // the last waiting message turns to answered
sfx("whoosh-short", cutC + give.logo + 0.35, 0.15);
sfx("pop-hi", cutC + give.give + 0.1, 0.16);
// ── write ───────────────────────────────────────────────────────────────────
const FONTS = rd("src/fonts.css").trim().split("\n").join("\n    ");
const stamp = (src, T, extra = {}) => {
  let s = rd(src).replace("/*{{FONTS}}*/", FONTS).replace("/*{{T}}*/ {}", JSON.stringify(round(T)));
  for (const [k, v] of Object.entries(extra)) s = s.replace(`<!--{{${k}}}-->`, v);
  return s;
};
wr("compositions/night.html", stamp("src/night.html", night, { FIELD: fieldSvg() }));
const ps = proofSvg();
wr("compositions/proof.html", stamp("src/proof.html", proof, { SEEKERS: ps.seekers, LINKS: ps.links }));
wr("compositions/give.html", stamp("src/give.html", give, { CARDS: morningCards() }));

const caps = []; // captions removed at the user's request: no caption host, no captions.html
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
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
  .map((c, i) => `    <audio id="sfx-${String(i + 1).padStart(2, "0")}" class="clip" src="assets/sfx/${c.f}.mp3" data-start="${c.start}"${c.ms ? ` data-media-start="${c.ms}"` : ""} data-duration="${c.dur}" data-track-index="${c.track}" data-volume="${c.vol}" data-audio-group="sfx"></audio>`)
  .join("\n");
// a music bed is optional: put a licensed track at assets/music/bed.(mp3|wav|m4a) and rebuild; it sits at about 0.14 under the voice
const bedFile = ["mp3", "wav", "m4a"].map((e) => `assets/music/bed.${e}`).find((f) => fs.existsSync(path.join(ROOT, f)));
const music = bedFile
  ? `    <audio id="music" class="clip" src="${bedFile}" data-start="0" data-duration="${total}" data-track-index="3" data-volume="0.14" data-audio-group="music"></audio>`
  : "";
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
${host("night", 0, cutB, 1, "graphics")}
${host("proof", cutB, cutC - cutB, 1, "graphics")}
${host("give", cutC, total - cutC, 1, "graphics")}
${music}
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
const t2 = (x) => `${Math.floor(x / 60)}:${(x % 60).toFixed(1).padStart(4, "0")}`;
wr("MUSIC-CUES.md", `# Music cue sheet (generated by tools/build.mjs from the narration's word times)

The film is ${t2(total)} long and has no music yet. To add a bed later: put a licensed track at \`assets/music/bed.mp3\`
(or .wav / .m4a), run \`node tools/build.mjs\`, and render. It plays on its own track at about 0.14 under the voice.
Or add it in any editor using the stems in \`renders/stems/\` (narration, effects, mix).

**Brief:** sparse, warm piano or cello with a soft pad, about 70 bpm. No drums, no choir, no trailer build.
Keep its energy above 150 Hz where possible (phone speakers lose the low end). Night to morning: quiet and still
under the problem, opening up at the hand-off, resolving on the end card.

| Time | Picture and words | Music |
| --- | --- | --- |
| ${t2(0)} | 2 a.m. lock screen, Layla's message ("It's two in the morning...") | Enter very softly, or not at all |
| ${t2(L.L2.start)} – ${t2(night.closes)} | Messages pour in; seekers wait; the ad is switched off | Near silent, sparse; nothing that resolves |
| ${t2(night.closes)} – ${t2(L.L4.start)} | "...and the door closes": the screen goes dark around her card | Drop out completely |
| ${t2(L.L4.start)} – ${t2(L.L5.start)} | Pull back to the field; "The harvest is plentiful, but the workers are few" | Silence, or a single held note |
| ${t2(night.zogreo - 0.2)} | "That's why we built Zogreo" | Music returns here (first real phrase) |
| ${t2(night.pushStart)} – ${t2(night.believer)} | Into the conversation: answered in Arabic, the hard part, "ready for a real person" | Gentle build |
| ${t2(night.believer)} | **A local believer joins** (the film's peak) | The swell lands here, then holds |
| ${t2(cutB)} | Cut to the Turkey pilot | Steady, warm; let the voice lead |
| ${t2(cutB + proof.num)} | 3.73× lands | No hit (the peak was the hand-off) |
| ${t2(cutC)} | Cut to the same phone the next morning; every message answered | Brightens: morning |
| ${t2(cutC + give.logo)} | Logo and the ask ("Give today at zogreo.org") | Resolve |
| ${t2(L.L11.end)} – ${t2(total)} | End card holds | End on a bar line with a short fade by ${t2(total)} |
`);
wr("build/events.json", JSON.stringify(round({
  "cut night→proof": cutB, "cut proof→give": cutC, "lock→thread swap": night.swap, "push-in": (night.pushStart + night.pushEnd) / 2,
  "pull-back": (night.pullStart + night.pullEnd) / 2, "seekers wait, clock starts": night.wait, "clock stops at 3:42": night.clockEnd, "door closes": night.closes, "phone wakes": night.wake, "AR→EN switch": night.toggle,
  "verse out": night.verseOut, "name out": night.nameOut, "believer joins": night.believer, "phone steps back": cutC + give.phoneOut, "logo wipe": cutC + give.logo,
}), null, 2) + "\n");
wr("build/cues.json", JSON.stringify(round({ total, cutB, cutC, night, proof, give, captions: caps, sfx: cues }), null, 2));
// the vector ledger for the motion doctrine's seam gate: one row per scene boundary
wr(
  "ledger.json",
  JSON.stringify(
    {
      fps: 30,
      seams: [
        { id: "night→proof", cut: r3(cutB), technique: "cut-the-curve LEFT", exit: { selector: "#nt-stage", axis: "x", dir: -1 }, entry: { selector: "#pf-stage", axis: "x", dir: -1 } },
        { id: "proof→give", cut: r3(cutC), technique: "cut-the-curve UP", exit: { selector: "#pf-stage", axis: "y", dir: -1 }, entry: { selector: "#gv-stage", axis: "y", dir: -1 } },
      ],
    },
    null,
    2,
  ) + "\n",
);
console.log(`built: ${total}s · night 0–${r3(cutB)} · proof –${r3(cutC)} · give –${total} · ${caps.length} caption groups · ${cues.length} sfx`);
