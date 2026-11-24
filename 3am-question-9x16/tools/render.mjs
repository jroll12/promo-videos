// Frame-exact renderer: src/film.html exposes renderAt(t); Playwright captures each frame.
//   node tools/render.mjs stills <outdir> t1 t2 ...        PNG stills at given seconds
//   node tools/render.mjs frames <outdir> t0 t1 [--nobg]   every frame in [t0, t1)
//   node tools/render.mjs video                            4 scene segments -> concat -> mux music
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright'); // global install (NODE_PATH)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FPS = 30, W = 1080, H = 1920;
const SCENES = [['s1', 0, 96], ['s2', 96, 321], ['s3', 321, 507], ['s4', 507, 657]]; // frame ranges, 657 = 21.9 s
const TYPES = { '.html': 'text/html', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.js': 'text/javascript' };

function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (!p.startsWith(ROOT) || !fs.existsSync(p)) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(rsp);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}

async function open(nobg) {
  const srv = await serve();
  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => { console.error('[page error]', e); process.exitCode = 1; });
  await page.goto(`http://127.0.0.1:${srv.address().port}/src/film.html${nobg ? '?nobg' : ''}`);
  const ok = await page.evaluate(() => window.ready);
  const faces = await page.evaluate(() => [...document.fonts].map(f => `${f.family} ${f.weight} ${f.status}`));
  if (!ok || faces.some(f => !f.endsWith('loaded'))) throw new Error('fonts not loaded: ' + faces.join(', '));
  const cdp = await page.context().newCDPSession(page);
  const shot = async t => {
    await page.evaluate(t => window.renderAt(t), t);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
    return Buffer.from(data, 'base64');
  };
  return { shot, close: async () => { await browser.close(); srv.close(); } };
}

function encoder(out) {
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', c => c ? rej(new Error('ffmpeg ' + c)) : res()));
  return { write: b => new Promise(r => ff.stdin.write(b) ? r() : ff.stdin.once('drain', r)), end: () => { ff.stdin.end(); return done; } };
}

const [mode, ...rest] = process.argv.slice(2);
const nobg = rest.includes('--nobg');
const args = rest.filter(a => a !== '--nobg');

if (mode === 'stills' || mode === 'frames') {
  const out = path.resolve(args[0]); fs.mkdirSync(out, { recursive: true });
  const r = await open(nobg);
  const times = mode === 'stills' ? args.slice(1).map(Number)
    : (() => { const a = Math.round(+args[1] * FPS), b = Math.round(+args[2] * FPS); return Array.from({ length: b - a }, (_, i) => (a + i) / FPS); })();
  for (const t of times) {
    const f = Math.round(t * FPS);
    fs.writeFileSync(path.join(out, mode === 'stills' ? `t${t.toFixed(2)}.png` : `f${String(f).padStart(4, '0')}.png`), await r.shot(t));
  }
  await r.close(); console.log(`${times.length} images -> ${out}`);
} else if (mode === 'video') {
  const B = path.join(ROOT, 'build'); fs.mkdirSync(B, { recursive: true });
  const r = await open(false);
  const list = [];
  for (const [name, a, b] of SCENES) {
    const f = path.join(B, `seg-${name}.mp4`); const enc = encoder(f); const t0 = Date.now();
    for (let i = a; i < b; i++) await enc.write(await r.shot(i / FPS));
    await enc.end(); list.push(`file '${f}'`); console.log(`${name}: ${b - a} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  await r.close();
  fs.writeFileSync(path.join(B, 'concat.txt'), list.join('\n') + '\n');
  const run = (...a) => execFileSync(a[0], a.slice(1), { stdio: 'inherit' });
  run('ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(B, 'concat.txt'), '-c', 'copy', path.join(B, 'video-only.mp4'));
  run(path.join(ROOT, 'tools/music.sh'));
  const final = path.join(B, '3am-question-9x16.mp4');
  run('ffmpeg', '-v', 'error', '-y', '-i', path.join(B, 'video-only.mp4'), '-i', path.join(B, 'music-aligned.wav'),
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', '21.9', '-movflags', '+faststart', final);
  console.log('done ->', final);
} else {
  console.error('usage: render.mjs stills|frames|video ...'); process.exit(2);
}
