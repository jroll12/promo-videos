// Render stills of one section (or the whole film) at 540p, bundling once. Writes PNGs and a contact sheet.
//
//   node tools/stills.mjs <entry> <compositionId> <frames...> [--out dir] [--scale 0.5] [--no-lyrics]
//   node tools/stills.mjs src/sections/verse1/entry.ts verse1 0 40 80 120 --out out/verse1
//   frames are LOCAL to the composition (0 = first frame of the section). "every:20" renders every 20th frame.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, ensureBrowser} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import {mkdirSync, existsSync} from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (k, d) => {
  const i = args.indexOf(k);
  if (i < 0) return d;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const bool = (k) => {
  const i = args.indexOf(k);
  if (i < 0) return false;
  args.splice(i, 1);
  return true;
};
const outDir = flag('--out', 'out/stills');
const scale = Number(flag('--scale', '0.5'));
const noLyrics = bool('--no-lyrics');
const [entry, compId, ...frameArgs] = args;
if (!entry || !compId) {
  console.error('usage: node tools/stills.mjs <entry> <compositionId> <frames...> [--out dir] [--scale 0.5] [--no-lyrics]');
  process.exit(1);
}
const local = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const browserExecutable = process.env.REMOTION_BROWSER ?? (existsSync(local) ? local : null);
mkdirSync(outDir, {recursive: true});
const inputProps = noLyrics ? {showLyrics: false} : {};
const serveUrl = await bundle({entryPoint: path.resolve(entry)});
const composition = await selectComposition({serveUrl, id: compId, inputProps, browserExecutable});
let frames = [];
for (const f of frameArgs) {
  if (f.startsWith('every:')) {
    const step = Number(f.slice(6));
    for (let k = 0; k < composition.durationInFrames; k += step) frames.push(k);
  } else frames.push(Number(f));
}
frames = frames.filter((f) => f >= 0 && f < composition.durationInFrames);
const files = [];
for (const frame of frames) {
  const output = path.join(outDir, `${compId}-${String(frame).padStart(5, '0')}.png`);
  await renderStill({serveUrl, composition, frame, output, scale, inputProps, browserExecutable, imageFormat: 'png'});
  files.push(output);
  console.log(output);
}
if (files.length > 1) {
  const cols = Math.min(4, files.length);
  const sheet = path.join(outDir, `${compId}-sheet.png`);
  execFileSync('ffmpeg', [
    '-v', 'error', '-y',
    ...files.flatMap((f) => ['-i', f]),
    '-filter_complex',
    `${files.map((_, i) => `[${i}]scale=480:-1,drawtext=text='${frames[i]}':x=8:y=8:fontsize=22:fontcolor=black:box=1:boxcolor=white[s${i}]`).join(';')};${files.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % cols) ? Array.from({length: i % cols}, () => 'w0').join('+') : '0'}_${Math.floor(i / cols) ? Array.from({length: Math.floor(i / cols)}, () => 'h0').join('+') : '0'}`).join('|')}:fill=white`,
    sheet,
  ]);
  console.log('sheet', sheet);
}
