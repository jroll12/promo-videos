// Continuity and rules lint.
//
//   node tools/continuity.mjs            static checks on src/ (run any time; section agents run it too)
//   node tools/continuity.mjs --section verse1   only that section's folder
//
// Static checks:
//   - no hex colour literals in src/sections (use C from theme.ts)
//   - no Math.random / Date / performance.now anywhere in src (determinism)
//   - no fetch / XMLHttpRequest / remote URLs in src (no network at render time)
//   - no literal frame numbers passed to timing-sensitive props in sections (heuristic: from={123}, at={123}, frame === 123)
//   - each section folder has Section.tsx, entry.ts and, after Phase 2, manifest.json
// Manifest checks (when manifests exist) are in tools/reduce.mjs.
import {readFileSync, readdirSync, statSync, existsSync} from 'node:fs';
import path from 'node:path';

const only = process.argv.includes('--section') ? process.argv[process.argv.indexOf('--section') + 1] : null;
const root = path.resolve('src');
const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = path.join(d, f);
  return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|mjs|js)$/.test(f) ? [p] : [];
});
const files = walk(root).filter((f) => !only || f.includes(`${path.sep}sections${path.sep}${only}${path.sep}`));
const problems = [];
const add = (f, n, msg, text) => problems.push(`${path.relative('.', f)}:${n}  ${msg}  | ${text.trim().slice(0, 100)}`);

for (const f of files) {
  const inSections = f.includes(`${path.sep}sections${path.sep}`);
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((t, i) => {
    const code = t.replace(/\/\/.*$/, '');
    if (/Math\.random\s*\(/.test(code)) add(f, i + 1, 'Math.random (use rng/hash)', t);
    if (/\bnew Date\b|\bDate\.now\s*\(/.test(code)) add(f, i + 1, 'Date (non-deterministic)', t);
    if (/performance\.now\s*\(/.test(code)) add(f, i + 1, 'performance.now (non-deterministic)', t);
    if (/\bfetch\s*\(|XMLHttpRequest|https?:\/\//.test(code)) add(f, i + 1, 'network access', t);
    if (inSections) {
      if (/#[0-9a-fA-F]{3,8}\b/.test(code) && /['"`]#/.test(code)) add(f, i + 1, 'hex colour literal (use C.*)', t);
      if (/\b(rgb|hsl)a?\(/.test(code)) add(f, i + 1, 'rgb/hsl colour literal (use C.*)', t);
      if (/\b(from|at|startFrame|endFrame)=\{\s*\d{2,}\s*\}/.test(code)) add(f, i + 1, 'literal frame number (use timing helpers)', t);
      if (/frame\s*[<>=]=?=?\s*\d{3,}/.test(code)) add(f, i + 1, 'literal frame comparison (use timing helpers)', t);
      if (/fontFamily:\s*['"`]/.test(code)) add(f, i + 1, 'font family literal (use FONT.*)', t);
    }
  });
}

const sections = ['intro', 'verse1', 'hook', 'verse2', 'prehook', 'bridge', 'verse3', 'outro'].filter((s) => !only || s === only);
for (const s of sections) {
  for (const need of ['Section.tsx', 'entry.ts']) {
    if (!existsSync(path.join(root, 'sections', s, need))) problems.push(`src/sections/${s}/${need} missing`);
  }
}

if (problems.length) {
  console.log(`${problems.length} problem(s):`);
  problems.forEach((p) => console.log('  ' + p));
  process.exit(1);
}
console.log(`continuity lint: ${files.length} files clean`);
