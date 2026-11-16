// Phase 3 reduce: merge the section manifests into storyboard.json + storyboard.md and check continuity.
//
//   node tools/reduce.mjs            writes storyboard.json, storyboard.md, prints a check report, exits 1 on hard failures
//
// Checks
//   - every one of the 89 lines appears exactly once (hook manifest covers all three hooks)
//   - literalisation budget: unique literal lines across the film 27..33 (a recurring hook gag counts once);
//     also reports the on-screen count (each hook occurrence counted)
//   - duplicate gags: same gag name or same main glyph used as a literal gag in two sections
//   - holds: every literal gag holds >= 26 frames (2 beats) and its hold overlaps its line
//   - tabs and confetti at section boundaries match src/data/contract.ts
//   - forbidden edits: changes outside src/sections/<id>/ since the Phase 1 commit
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {execSync} from 'node:child_process';

const T = JSON.parse(readFileSync('timing.json', 'utf8'));
const folders = ['intro', 'verse1', 'hook', 'verse2', 'prehook', 'bridge', 'verse3', 'outro'];
const hard = [];
const soft = [];

// ---- contract values, parsed from the TS source so this script needs no TS toolchain
const contract = readFileSync('src/data/contract.ts', 'utf8');
const table = (name) => {
  const m = contract.match(new RegExp(`export const ${name}[^=]*=\\s*\\{([\\s\\S]*?)\\};`));
  const out = {};
  for (const [, k, a, b] of m[1].matchAll(/(\w+):\s*\[([\d.]+),\s*([\d.]+)\]/g)) out[k] = [Number(a), Number(b)];
  return out;
};
const TABS = table('TABS');
const CONF = table('CONFETTI');

// ---- load manifests
const manifests = {};
for (const f of folders) {
  const p = `src/sections/${f}/manifest.json`;
  if (!existsSync(p)) {
    hard.push(`missing ${p}`);
    continue;
  }
  try {
    manifests[f] = JSON.parse(readFileSync(p, 'utf8'));
  } catch (e) {
    hard.push(`${p} is not valid JSON: ${e.message}`);
  }
}

// ---- line coverage
const lineById = Object.fromEntries(T.lines.map((l) => [l.id, l]));
const entries = [];
for (const [f, m] of Object.entries(manifests)) {
  for (const g of m.gags ?? []) {
    if (!lineById[g.lineId]) {
      hard.push(`${f}: unknown line id ${g.lineId}`);
      continue;
    }
    entries.push({folder: f, ...g});
  }
}
// The hook manifest may list one hook's lines (e.g. h1.xx) as the pattern for all three: expand it.
const hookEntries = entries.filter((e) => e.folder === 'hook');
const hookIds = new Set(hookEntries.map((e) => e.lineId));
for (const e of [...hookEntries]) {
  const idx = e.lineId.split('.')[1];
  for (const h of ['h1', 'h2', 'h3']) {
    const id = `${h}.${idx}`;
    if (!hookIds.has(id)) {
      const l = lineById[id];
      const shift = l.startFrame - lineById[e.lineId].startFrame;
      entries.push({...e, lineId: id, holdFrames: e.holdFrames ? e.holdFrames.map((x) => x + shift) : undefined, expanded: true});
      hookIds.add(id);
    }
  }
}
const seen = {};
for (const e of entries) seen[e.lineId] = (seen[e.lineId] ?? 0) + 1;
for (const l of T.lines) {
  if (!seen[l.id]) hard.push(`line ${l.id} "${l.text}" is in no manifest`);
  else if (seen[l.id] > 1) hard.push(`line ${l.id} appears in ${seen[l.id]} manifest entries`);
}

// ---- budget
const literal = entries.filter((e) => e.treatment === 'literal');
const uniqueLiteral = new Set(literal.map((e) => (e.lineId.startsWith('h') ? `hook.${e.lineId.split('.')[1]}` : e.lineId)));
const onScreen = literal.length;
if (uniqueLiteral.size < 27 || uniqueLiteral.size > 33) hard.push(`literal budget: ${uniqueLiteral.size} unique literal lines (target 27..33)`);

// ---- duplicates (gag names and glyphs across sections; hooks recur by design)
const norm = (s) => (s ?? '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
const byGag = {};
for (const e of literal) {
  if (e.folder === 'hook' && e.expanded) continue;
  const k = norm(e.gag);
  (byGag[k] ??= []).push(e);
}
for (const [k, es] of Object.entries(byGag)) {
  const fs = [...new Set(es.map((e) => e.folder))];
  if (fs.length > 1) soft.push(`gag "${k}" literal in ${fs.join(', ')}`);
}
const byGlyph = {};
for (const e of literal) {
  if (e.expanded || !e.tab?.glyph) continue;
  (byGlyph[e.tab.glyph] ??= new Set()).add(e.folder);
}
for (const [g, fs] of Object.entries(byGlyph)) if (fs.size > 1) soft.push(`glyph "${g}" is the main prop of literal gags in ${[...fs].join(', ')}`);

// ---- holds
for (const e of literal) {
  const l = lineById[e.lineId];
  if (!e.holdFrames || e.holdFrames.length !== 2) {
    hard.push(`${e.folder} ${e.lineId}: literal gag without holdFrames`);
    continue;
  }
  const [a, b] = e.holdFrames;
  if (b - a < 26) hard.push(`${e.folder} ${e.lineId}: hold ${b - a} frames < 26 (2 beats)`);
  if (b < l.startFrame - 13 || a > l.endFrame + 13) soft.push(`${e.folder} ${e.lineId}: hold [${a},${b}] does not overlap its line [${l.startFrame},${l.endFrame}]`);
}

// ---- continuity at boundaries
const secIdsFor = (f) => (f === 'hook' ? ['hook1', 'hook2', 'hook3'] : [f]);
for (const [f, m] of Object.entries(manifests)) {
  for (const id of secIdsFor(f)) {
    const [ta, tb] = TABS[id];
    if (m.tabs && f !== 'hook' && (m.tabs.start !== ta || m.tabs.end !== tb)) soft.push(`${f}: manifest tabs ${m.tabs.start}->${m.tabs.end}, contract ${ta}->${tb}`);
    const [ca, cb] = CONF[id];
    if (m.confetti && f !== 'hook' && (Math.abs(m.confetti.start - ca) > 0.02 || Math.abs(m.confetti.end - cb) > 0.02))
      soft.push(`${f}: manifest confetti ${m.confetti.start}->${m.confetti.end}, contract ${ca}->${cb}`);
  }
}

// ---- forbidden edits since Phase 1
let changed = [];
try {
  const base = execSync(`git log --format=%H --grep="Phase 1 style bible" -n 1`, {encoding: 'utf8'}).trim();
  changed = execSync(`git diff --name-only ${base} -- . && git ls-files --others --exclude-standard .`, {encoding: 'utf8'})
    .split('\n')
    .filter(Boolean)
    .map((p) => p.replace(/^confetti-glovebox-16x9\//, ''));
} catch {
  soft.push('could not read git history for the forbidden-edit check');
}
const allowed = (p) =>
  /^src\/sections\/(intro|verse1|hook|verse2|prehook|bridge|verse3|outro)\//.test(p) ||
  /^(storyboard\.(md|json)|PROGRESS\.md|tools\/|validation\/|README\.md|src\/sections\/AGENT_BRIEF\.md)/.test(p);
for (const p of changed) if (!allowed(p)) soft.push(`edited outside section folders since Phase 1: ${p} (check who changed it)`);

// ---- storyboard
const sectionOf = (id) => T.sections.find((s) => s.id === lineById[id].section);
const rows = T.lines.map((l) => {
  const e = entries.find((x) => x.lineId === l.id) ?? {};
  return {
    id: l.id,
    section: l.section,
    start: l.start,
    end: l.end,
    startFrame: l.startFrame,
    endFrame: l.endFrame,
    text: l.text,
    owner: e.folder ?? null,
    treatment: e.treatment ?? null,
    gag: e.gag ?? null,
    description: e.description ?? null,
    tab: e.tab ?? null,
    holdFrames: e.holdFrames ?? null,
    lyricType: e.lyricType ?? null,
  };
});
const story = {
  generated: 'tools/reduce.mjs',
  totals: {lines: T.lines.length, literalUnique: uniqueLiteral.size, literalOnScreen: onScreen},
  sections: T.sections.map((s) => ({id: s.id, startFrame: s.startFrame, endFrame: s.endFrame, tabs: TABS[s.id], confetti: CONF[s.id]})),
  lines: rows,
  manifests: Object.fromEntries(Object.entries(manifests).map(([f, m]) => [f, {localProps: m.localProps ?? [], promotionCandidates: m.promotionCandidates ?? [], notes: m.notes ?? ''}])),
};
writeFileSync('storyboard.json', JSON.stringify(story, null, 1) + '\n');

const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
const md = [
  '# Storyboard (reduced)',
  '',
  `Generated by \`tools/reduce.mjs\` from the section manifests. ${T.lines.length} lines; ${uniqueLiteral.size} literal gags (unique; a hook gag that recurs counts once), ${onScreen} literal moments on screen.`,
  '',
];
for (const s of T.sections) {
  md.push(`## ${s.id} (${fmt(s.start)} to ${fmt(s.end)}, tabs ${TABS[s.id].join(' -> ')}, confetti ${CONF[s.id].join(' -> ')})`, '');
  md.push('| line | time | lyric | treatment | what is on screen |', '|---|---|---|---|---|');
  for (const r of rows.filter((x) => x.section === s.id)) {
    md.push(`| ${r.id} | ${fmt(r.start)} | ${r.text} | ${r.treatment ?? '?'} | ${(r.treatment === 'literal' ? `**${r.gag}**: ` : '') + (r.description ?? '').replace(/\|/g, '/')} |`);
  }
  md.push('');
}
writeFileSync('storyboard.md', md.join('\n'));

console.log(`lines covered: ${Object.keys(seen).length}/${T.lines.length}`);
console.log(`literal: ${uniqueLiteral.size} unique, ${onScreen} on screen`);
for (const f of folders) {
  const m = manifests[f];
  if (!m) continue;
  const lit = (m.gags ?? []).filter((g) => g.treatment === 'literal').map((g) => g.lineId);
  console.log(`  ${f.padEnd(8)} literal ${lit.length}: ${lit.join(' ')}`);
}
if (soft.length) console.log(`\nwarnings (${soft.length}):\n  ` + soft.join('\n  '));
if (hard.length) {
  console.log(`\nFAIL (${hard.length}):\n  ` + hard.join('\n  '));
  process.exit(1);
}
console.log('\nreduce: OK');
