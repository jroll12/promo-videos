// Phase 5 join: score the blind reviewer's report against the storyboard.
//
//   node tools/join_validation.mjs validation/review-*.json [--out validation/report-round1.md]
//
// The reviewer saw only lyrics.txt and the shuffled lyric-free strips. For each strip it reported what it sees, the
// gag it perceived (or null) and the lyric line it thinks the strip shows (exact text from lyrics.txt, or null).
// Rules (agreed with the owner):
//   - literal line: PASS if the reviewer matched it to this line's text, or to a line with the same gag;
//     FAIL if it perceived nothing, or matched a different line
//   - any line: FAIL if the reviewer reports the frames as broken or empty
//   - non-literal lines otherwise pass; how they were read is reported for information
// Hook lines repeat word for word in three hooks, so matching is by normalised text, not by id.
import {readFileSync, writeFileSync} from 'node:fs';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const out = outIdx >= 0 ? args.splice(outIdx, 2)[1] : 'validation/report.md';
const key = JSON.parse(readFileSync('analysis/out/validation-key.json', 'utf8'));
const story = JSON.parse(readFileSync('storyboard.json', 'utf8'));
const reviews = args.flatMap((f) => JSON.parse(readFileSync(f, 'utf8')));

const norm = (s) => (s ?? '').toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();
const byLine = Object.fromEntries(story.lines.map((l) => [l.id, l]));
const textToIds = {};
for (const l of story.lines) (textToIds[norm(l.text)] ??= []).push(l.id);

const rows = [];
for (const r of reviews) {
  const k = key[r.strip];
  if (!k) {
    rows.push({strip: r.strip, line: '?', verdict: 'FAIL', why: 'unknown strip id'});
    continue;
  }
  const l = byLine[k.line];
  const matchedIds = r.matches_line ? textToIds[norm(r.matches_line)] ?? [] : [];
  const sameText = matchedIds.some((id) => norm(byLine[id].text) === norm(l.text));
  const sameGag = l.gag && matchedIds.some((id) => byLine[id].treatment === 'literal' && byLine[id].gag === l.gag);
  let verdict = 'PASS';
  let why = '';
  if (r.broken) {
    verdict = 'FAIL';
    why = 'reviewer reports broken or empty frames';
  } else if (l.treatment === 'literal') {
    if (!r.gag_perceived && !r.matches_line) {
      verdict = 'FAIL';
      why = 'perceived nothing';
    } else if (sameText || sameGag) {
      why = sameText ? 'matched its line' : 'matched a line of the same gag';
    } else {
      verdict = 'FAIL';
      why = r.matches_line ? `matched a different line: "${r.matches_line}"` : 'perceived a gag but matched no line';
    }
  } else {
    why = sameText ? 'read as its line (non-literal)' : 'non-literal';
  }
  rows.push({strip: r.strip, line: l.id, treatment: l.treatment, text: l.text, gag: l.gag, sees: r.sees, perceived: r.gag_perceived, matched: r.matches_line, confidence: r.confidence, verdict, why});
}
const covered = new Set(rows.map((r) => r.line));
for (const id of Object.values(key).map((k) => k.line)) if (!covered.has(id)) rows.push({line: id, verdict: 'FAIL', why: 'no review for this strip', text: byLine[id].text, treatment: byLine[id].treatment});
rows.sort((a, b) => story.lines.findIndex((l) => l.id === a.line) - story.lines.findIndex((l) => l.id === b.line));

const lit = rows.filter((r) => r.treatment === 'literal');
const fails = rows.filter((r) => r.verdict === 'FAIL');
const md = [
  `# Blind validation report`,
  '',
  `Reviewer saw only lyrics.txt and ${rows.length} shuffled, lyric-free 3-frame strips. Joined to storyboard.json afterwards.`,
  '',
  `- Literal lines: ${lit.filter((r) => r.verdict === 'PASS').length} of ${lit.length} recognised.`,
  `- Non-literal lines read as their own line anyway: ${rows.filter((r) => r.treatment !== 'literal' && r.why.startsWith('read as')).length} of ${rows.filter((r) => r.treatment !== 'literal').length}.`,
  `- Failures: ${fails.length}.`,
  '',
  '| line | treatment | verdict | why | lyric | reviewer saw | reviewer matched |',
  '|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.line} | ${r.treatment ?? ''} | ${r.verdict} | ${r.why} | ${r.text ?? ''} | ${(r.sees ?? '').replace(/\|/g, '/').slice(0, 160)} | ${r.matched ?? '-'} |`),
];
writeFileSync(out, md.join('\n') + '\n');
console.log(`literal recognised ${lit.filter((r) => r.verdict === 'PASS').length}/${lit.length}; failures ${fails.length}`);
for (const f of fails) console.log(`  FAIL ${f.line} (${f.treatment}) ${f.why} | ${f.text}`);
console.log('report:', out);
