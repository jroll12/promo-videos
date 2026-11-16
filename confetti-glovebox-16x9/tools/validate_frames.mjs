// Phase 5: frames for the blind reviewer.
//
//   node tools/validate_frames.mjs [--only id,id,...]
//
// For every lyric line, renders 3 stills of the full film (at 25 %, 50 % and 75 % of the line) at 540p with
// showLyrics=false (no lyric cards), joins them into one strip, and saves the strip under an opaque id in a
// shuffled order: validation/frames/<id>.png. The key (opaque id -> line id) goes to analysis/out/validation-key.json,
// which is outside validation/ and never given to the reviewer. Deterministic shuffle (fixed seed).
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, writeFileSync, existsSync, rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';

const T = JSON.parse(readFileSync('timing.json', 'utf8'));
const onlyArg = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].split(',') : null;
const lines = T.lines.filter((l) => !onlyArg || onlyArg.includes(l.id));
const local = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const browserExecutable = process.env.REMOTION_BROWSER ?? (existsSync(local) ? local : null);
const outDir = 'validation/frames';
const tmp = 'analysis/out/validation-tmp';
if (!onlyArg) rmSync(outDir, {recursive: true, force: true});
mkdirSync(outDir, {recursive: true});
mkdirSync(tmp, {recursive: true});

const opaque = (id) => createHash('sha256').update(`confetti-validation-v1:${id}`).digest('hex').slice(0, 8);
const inputProps = {showLyrics: false};
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'Video', inputProps, browserExecutable});

const keyPath = 'analysis/out/validation-key.json';
const key = existsSync(keyPath) && onlyArg ? JSON.parse(readFileSync(keyPath, 'utf8')) : {};
for (const l of lines) {
  const span = Math.max(3, l.endFrame - l.startFrame);
  const frames = [0.25, 0.5, 0.75].map((q) => Math.min(T.durationInFrames - 1, Math.round(l.startFrame + q * span)));
  const files = [];
  for (const [i, frame] of frames.entries()) {
    const f = path.join(tmp, `${l.id}-${i}.png`);
    await renderStill({serveUrl, composition, frame, output: f, scale: 0.5, inputProps, browserExecutable, imageFormat: 'png'});
    files.push(f);
  }
  const id = opaque(l.id);
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap((f) => ['-i', f]), '-filter_complex', '[0][1][2]hstack=3,scale=1920:-1', path.join(outDir, `${id}.png`)]);
  key[id] = {line: l.id, frames};
  console.log(l.id, '->', id);
}
writeFileSync(keyPath, JSON.stringify(key, null, 1));
console.log(`${lines.length} strips in ${outDir}; key in ${keyPath}`);
