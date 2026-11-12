#!/usr/bin/env node
// Apologist AI promo ("Anyone who asks"), revision 2: every cue is a spoken word's time from build/timing.json.
// Three scenes: chat (L1-L7, full-screen conversation), proof (L8-L9), cta (L10-L12 + held end card).
//
//   node tools/build.mjs [projectRoot]
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createProject, r3 } from "./cues.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(here, "..");

// captions: one band near the bottom, bigger, on every line (revision 2 feedback)
const p = createProject(ROOT, {
  width: 1920,
  height: 1080,
  preset: "landscape",
  ground: "#111828",
  captionFont: '"Inter PV"',
  captionTop: 966,
  captionSize: 46,
  captionWeight: 700,
  captionMaxWidth: 1500,
  captionBg: "rgba(17, 24, 40, 0.88)",
  captionInk: "#FFFFFF",
});
const { L, W } = p;
const max = Math.max;
const min = Math.min;

// ── scene 1 "chat": the 2 a.m. question, the verse, the stream of questions, generic AI, the agent, the handoff ──
const QUESTION = "Is there any hope for someone like me?";
const chat = {};
chat.pre = 0; // the box starts empty: the whole question types in as the line is spoken
chat.send = W("L1", "ask");
chat.typeStart = max(1.0, chat.send - 0.3 - QUESTION.length * 0.095); // about 0.095 s per character, sent on "ask"
chat.typeStep = (chat.send - 0.3 - chat.typeStart) / (QUESTION.length - chat.pre);
chat.blinks = [];
for (let t = 0.5; t < chat.typeStart - 0.2; t += 0.5) chat.blinks.push(t);
chat.verseIn = L.L2.start - 0.45;
chat.verse = L.L2.words.map((w) => w.start);
chat.ref = chat.verse[0] + 0.8; // the reference is read alongside the verse
chat.verseOut = L.L3.start - 0.3;
chat.qIn = L.L3.start - 0.2;
chat.qBut = max(W("L3", "But"), chat.qIn + 1.0);
chat.qFrom = 1000; // column offset: the first card enters near the bottom of the frame
chat.qMid = -380; // constant-speed stream until "But"
chat.qTo = -620; // then it slows and settles
chat.qSettle = 1.4;
chat.team = max(W("L3", "team"), chat.qBut + 0.15);
chat.wait = max(W("L3", "answer"), chat.team + 0.35);
chat.qOut = max(L.L4.start - 0.25, chat.wait + 0.9);
chat.gen = chat.qOut + 0.45;
chat.hedges = max(W("L4", "hedges"), chat.gen + 0.45);
chat.misquotes = max(W("L4", "misquotes"), chat.hedges + 0.35, chat.gen + 0.6);
chat.contradicts = max(W("L4", "contradicts"), chat.misquotes + 0.35, chat.gen + 0.75);
chat.genOut = max(L.L5.start - 0.2, chat.contradicts + 0.7);
chat.logo = max(W("L5", "Apologist") - 0.05, chat.genOut + 0.3);
chat.eyebrow = max(W("L5", "faithful"), chat.logo + 0.45);
chat.logoOut = max(W("L5", "chatbot") + 0.05, chat.eyebrow + 0.7, chat.logo + 1.3);
chat.launch = max(W("L5", "ministry's") - 0.05, chat.logoOut + 0.3); // the launcher pops onto the site
chat.reskin = chat.logoOut + 0.2; // the ministry chat opens straight after the logo
chat.seekAgain = chat.reskin; // the question is carried over into the chat
chat.typing = chat.reskin + 0.9;
chat.stream = 0.075; // seconds per word as the answer streams in
chat.reply = max(W("L6", "answers"), chat.typing + 0.4);
chat.src = max(W("L6", "teaching"), chat.reply + 0.35);
chat.hour = max(W("L6", "hour"), chat.src + 0.2);
chat.lang = max(W("L6", "language"), chat.hour + 0.2);
chat.cites = max(W("L6", "cites"), chat.lang + 0.3);
chat.hand = max(W("L7", "real") - 0.15, chat.cites + 0.4);
chat.scrollHand = 370;
chat.press = max(W("L7", "passes") - 0.05, chat.hand + 0.55);
chat.connected = chat.press + 0.45;
const cutA = r3(max(min(L.L7.end + 0.7, L.L8.start - 0.05), chat.connected + 1.3)); // the connected state holds before the cut
chat.exit = cutA - 0.32;

// ── scene 2 "proof": #1 on the TGC benchmark, the stat band, trusted by (in the brochure's order) ──
// spoken first, in the order said; the others are on screen but not named aloud (they light up together on "and more")
const NAMES = ["Got Questions", "Apologetics Canada", "Dare 2 Share", "Ligonier", "Radical", "Sightline", "Jesus Film"];
const proof = {};
const A = (t) => t - cutA;
proof.one = max(A(W("L8", "one")), 0.45);
proof.label = max(A(W("L8", "Christian")), proof.one + 0.25);
proof.method = proof.label + 0.6;
proof.source = proof.method + 0.6;
proof.band = max(A(L.L9.start) - 0.3, proof.source + 0.8);
const spoken = [W("L9", "Got"), W("L9", "Apologetics"), W("L9", "Dare")].map(A).map((t, i) => max(t, proof.band + 0.9 + i * 0.25));
const more = max(A(W("L9", "and")), spoken[2] + 0.3);
proof.nameAt = [...spoken, ...[0, 1, 2, 3].map((k) => more + k * 0.1)]; // the other four ink in order on "and more"
const cutB = r3(max(min(L.L9.end + 0.6, L.L10.start - 0.05), cutA + proof.nameAt[6] + 0.5));
proof.exit = cutB - cutA - 0.32;

// ── scene 3 "cta": the promise, the tagline, the ask ──
const cta = {};
const B = (t) => t - cutB;
cta.head = L.L10.words.map((w) => max(B(w.start), 0.2));
cta.flood = max(B(L.L11.start) - 0.3, cta.head[cta.head.length - 1] + 0.4);
cta.tag = L.L11.words.map((w) => max(B(w.start), cta.flood + 0.25));
cta.settle = max(B(L.L12.start) - 0.35, cta.tag[cta.tag.length - 1] + 0.4);
cta.book = max(B(W("L12", "Book")), cta.settle + 0.3);
cta.visit = max(B(W("L12", "visit")), cta.book + 0.35);
cta.site = max(B(W("L12", "apologistai.com")), cta.visit + 0.3);
cta.foot = cta.site + 0.5; // one line above the caption band, with the rest of the end card
const total = r3(max(L.L12.end + 3.2, cutB + cta.foot + 3.0));

// ── markup slots ──
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const typed = '<i id="ct-c0"></i>' + [...QUESTION].map((c) => `<span>${esc(c)}</span>`).join("");
const QS = [
  ["¿Quién es Jesús realmente?", "Español", "2:11 AM"],
  ["Можно ли доверять Библии?", "Русский", "2:14 AM"],
  ["Why does God allow pain?", "English", "2:19 AM"],
  ["هل يسمع الله صلواتي؟", "العربية", "2:26 AM"],
  ["मरने के बाद क्या होता है?", "हिन्दी", "2:31 AM"],
  ["É tarde demais para mim?", "Português", "2:40 AM"],
  ["Nianzie wapi?", "Kiswahili", "3:02 AM"],
  ["Jésus est-il ressuscité ?", "Français", "3:09 AM"],
  ["Ligtas ba magtanong dito?", "Tagalog", "3:17 AM"],
  ["¿Por qué me perdonaría Dios?", "Español", "3:24 AM"],
  ["Wer schrieb die Evangelien?", "Deutsch", "3:31 AM"],
  ["How do I start praying?", "English", "3:40 AM"],
  ["Насколько надёжна Библия?", "Русский", "3:52 AM"],
  ["Minha vida importa?", "Português", "4:05 AM"],
];
const RTL = new Set(["العربية"]);
const cards = QS.map(
  ([qq, lang, time], i) =>
    `<div class="ct-q" id="ct-q${i}" style="top: ${i * 152}px"><div class="ct-q-t"><bdi${RTL.has(lang) ? ' dir="rtl"' : ""}>${esc(qq)}</bdi></div><div class="ct-q-c"><div class="ct-q-l"><bdi>${esc(lang)}</bdi></div><div class="ct-q-h">${time}</div></div><div class="ct-q-w"><i></i>Unanswered</div></div>`,
).join("\n        ");
const vw = L.L2.words.map((w) => w.w);
const verse = vw
  .map((w, i) => {
    const t = (i === 0 ? "“" : "") + esc(w) + (i === vw.length - 1 ? "”" : "");
    const cls = i === 2 || i === 8 ? "w a" : "w"; // "prepared", "everyone"
    return `<span class="${cls}">${t}</span>` + ([6, 11, 15].includes(i) ? "<br />" : " ");
  })
  .join("");
const head = L.L10.words.map((w) => `<span class="w">${esc(w.w)}</span>`).join(" ");
const tag = L.L11.words.map((w, i) => `<span class="${i >= 4 ? "w a" : "w"}">${esc(w.w)}</span>` + ([1, 3].includes(i) ? "<br />" : " ")).join("");
const names = NAMES.map((n, i) => `<div class="pf-nm" id="pf-nm${i}" style="left: 1250px; top: ${300 + i * 86}px">${esc(n)}</div>`).join("\n        ");

// ── sound: every effect has a cause on screen ──
const sfx = p.sfx;
[0.05, 1.4, 2.7].forEach((d, i) => sfx("typing", chat.typeStart + d, [0.13, 0.12, 0.11][i]));
sfx("pop", chat.send + 0.05, 0.22);
sfx("whoosh-cinematic", chat.verseIn + 0.7, 0.1);
sfx("whoosh", chat.qIn + 0.1, 0.12);
["pop", "click-soft", "pop", "click-soft", "pop", "click-soft"].forEach((f, i) => sfx(f, chat.qIn + 0.2 + i * ((chat.qBut - chat.qIn) / 6), [0.11, 0.13, 0.09, 0.12, 0.1, 0.12][i]));
sfx("pop", chat.team + 0.1, 0.16);
sfx("click-soft", chat.wait + 0.06, 0.3);
sfx("whoosh-short", chat.qOut + 0.05, 0.14);
sfx("pop", chat.gen + 0.12, 0.16);
sfx("pop", chat.gen + 0.44, 0.12);
[chat.hedges, chat.misquotes, chat.contradicts].forEach((t) => sfx("click-soft", t + 0.1, 0.42));
sfx("whoosh-short", chat.genOut, 0.12);
sfx("whoosh", chat.logoOut + 0.15, 0.14);
sfx("whoosh-short", chat.reskin + 0.2, 0.15);
sfx("pop", chat.reply + 0.06, 0.2);
sfx("click-soft", chat.src + 0.06, 0.35);
sfx("click-soft", chat.hour + 0.06, 0.25);
[0, 0.24, 0.48, 0.72].forEach((d) => sfx("key-press", chat.lang + 0.12 + d, 0.16));
sfx("click-soft", chat.cites + 0.06, 0.35);
sfx("pop", chat.hand + 0.06, 0.14);
sfx("click", chat.press, 0.38);
sfx("click-soft", chat.connected + 0.06, 0.3);
sfx("whoosh-short", cutA, 0.22);
sfx("pop", cutA + proof.one + 0.12, 0.18);
sfx("whoosh-short", cutA + proof.band + 0.1, 0.14);
sfx("pop", cutA + proof.band + 0.55, 0.12);
proof.nameAt.slice(0, 3).forEach((t) => sfx("click-soft", cutA + t + 0.04, 0.22));
sfx("whoosh-short", cutB, 0.22);
sfx("whoosh", cutB + cta.flood + 0.1, 0.14);
sfx("whoosh-short", cutB + cta.settle + 0.15, 0.12);
sfx("pop", cutB + cta.book + 0.08, 0.16);
sfx("pop", cutB + cta.visit + 0.08, 0.18);
sfx("click-soft", cutB + cta.site + 0.06, 0.25);

// ── write ──
p.writeScene("chat", chat, { TYPED: typed, CARDS: cards, VERSE: verse });
p.writeScene("proof", proof, { NAMES: names });
p.writeScene("cta", cta, { HEAD: head, TAG: tag });
const caps = p.writeCaptions();
p.writeIndex(total, [
  { id: "chat", start: 0, dur: cutA },
  { id: "proof", start: cutA, dur: r3(cutB - cutA) },
  { id: "cta", start: cutB, dur: r3(total - cutB) },
]);
p.writeCues(total, { cutA, cutB, chat, proof, cta });
p.writeLedger([
  { id: "chat→proof", cut: r3(cutA), technique: "cut-the-curve LEFT", exit: { selector: "#ct-stage", axis: "x", dir: -1 }, entry: { selector: "#pf-stage", axis: "x", dir: -1 } },
  { id: "proof→cta", cut: r3(cutB), technique: "cut-the-curve UP", exit: { selector: "#pf-stage", axis: "y", dir: -1 }, entry: { selector: "#cta-stage", axis: "y", dir: -1 } },
]);
p.writeEvents({
  "message sent": chat.send,
  "verse pull-back": chat.verseIn + 0.5,
  "verse out": chat.verseOut,
  "questions stream": chat.qIn + 0.3,
  "stream slows": chat.qBut + 0.3,
  "back to the conversation": chat.qOut + 0.3,
  "generic out": chat.genOut,
  "logo wipe": chat.logo,
  "logo out": chat.logoOut + 0.15,
  "chatbot arrives": chat.reskin + 0.3,
  "answer arrives": chat.reply,
  "language roll": chat.lang + 0.4,
  "handoff scroll": chat.hand + 0.3,
  "connected": chat.connected,
  "cut chat→proof": cutA,
  "#1 lands": cutA + proof.one,
  "band rises": cutA + proof.band + 0.2,
  "cut proof→cta": cutB,
  "colour flood": cutB + cta.flood + 0.2,
  "tagline settles": cutB + cta.settle + 0.25,
});
console.log(`built: ${total}s · cuts ${r3(cutA)} / ${r3(cutB)} · ${caps.length} caption groups · ${p.cues.length} sfx`);
