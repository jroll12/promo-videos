// Global background layer: one canvas under every scene, drawn from the film time alone (hf-seek).
// Riso-print look: flat colour flood per section (flipping on chorus hits), a halftone dot field whose
// dots breathe with the kick drum (baked envelope), seeded confetti bursts, and moving paper grain.
(function () {
  const B = window.__BG; // injected by build.mjs
  const cv = document.getElementById("bg-canvas");
  const W = B.W, H = B.H;
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  // paper grain tile, generated once from a fixed seed
  const GT = 384, grain = document.createElement("canvas");
  grain.width = grain.height = GT;
  { const gg = grain.getContext("2d"), im = gg.createImageData(GT, GT), r = mulberry(7);
    for (let i = 0; i < GT * GT; i++) { const v = (r() * 255) | 0; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
    gg.putImageData(im, 0, 0); }

  // confetti: per burst, a fixed set of particles from a seed
  const CONF = ["#FF48B0", "#FFE14D", "#0078BF", "#00A95C", "#FF6C2F", "#765BA7", "#F4EEDF"];
  const bursts = B.bursts.map((b, i) => {
    const r = mulberry(1000 + i), n = b.n || 140, parts = [];
    for (let k = 0; k < n; k++) {
      const side = b.from === "center" ? 0 : (k % 2 ? 1 : -1);
      const x0 = b.from === "center" ? W / 2 + (r() - 0.5) * W * 0.1 : (side < 0 ? -20 : W + 20);
      const y0 = b.from === "center" ? H * 0.55 : H * (0.75 + r() * 0.3);
      const ang = b.from === "center" ? r() * Math.PI * 2 : (side < 0 ? -Math.PI / 2 + 0.25 + r() * 0.75 : -Math.PI / 2 - 0.25 - r() * 0.75);
      const sp = (b.from === "center" ? 0.6 + r() * 1.1 : 1.1 + r() * 1.0) * Math.max(W, H);
      parts.push({ x0, y0, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, w: 10 + r() * 16, h: 6 + r() * 10, rot: r() * 6.28, spin: (r() - 0.5) * 14, flip: 4 + r() * 8, c: CONF[(r() * CONF.length) | 0], circ: r() < 0.25, life: 2.6 + r() * 1.4 });
    }
    return { t: b.t, parts };
  });

  const secAt = (t) => { for (let i = B.sections.length - 1; i >= 0; i--) if (t >= B.sections[i].start) return B.sections[i]; return B.sections[0]; };
  const flipAt = (t, s) => { let c = null; for (const f of B.flips) { if (f.t > t) break; if (f.t >= s.start) c = f; } return c; };
  const env = (arr, t) => { const i = Math.min(arr.length - 1, Math.max(0, Math.round(t * B.fps))); return arr[i]; };
  function shade(hex, k) { // k<0 darker, k>0 lighter
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
    const f = (c) => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k);
    return `rgb(${f(r)},${f(gg)},${f(b)})`;
  }

  function renderAt(t) {
    const s = secAt(t), fl = flipAt(t, s);
    const base = fl ? fl.c : s.base;
    g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
    g.fillStyle = base; g.fillRect(0, 0, W, H);

    // halftone field: dots grow toward the edges and breathe with the kick
    const bass = env(B.bass, t), sp = Math.round(Math.max(W, H) / 40);
    const dot = s.dot || shade(base, s.light ? -0.1 : 0.14);
    g.fillStyle = fl ? shade(base, -0.1) : dot;
    const ox = (t * sp * 0.22) % sp, oy = (t * sp * 0.13) % sp;
    const cx = W / 2, cy = H / 2, rx = W * 0.55, ry = H * 0.55;
    const amp = (s.dotAmp ?? 1) * (0.5 + 0.75 * bass);
    g.beginPath();
    for (let y = -sp + oy; y < H + sp; y += sp) {
      for (let x = -sp + ox; x < W + sp; x += sp) {
        const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
        const e = Math.min(1, Math.max(0, (d - (s.clear ?? 0.45)) / 0.75));
        const r = sp * 0.5 * e * e * amp;
        if (r > 0.7) { g.moveTo(x + r, y); g.arc(x, y, r, 0, 6.2832); }
      }
    }
    g.fill();

    // confetti
    for (const b of bursts) {
      const dt = t - b.t;
      if (dt < 0 || dt > 4.2) continue;
      const k = 1.7, G = H * 1.1, e = 1 - Math.exp(-k * dt);
      for (const p of b.parts) {
        if (dt > p.life) continue;
        const x = p.x0 + (p.vx * e) / k, y = p.y0 + (p.vy * e) / k + (G / k) * (dt - e / k);
        if (y > H + 40 || x < -60 || x > W + 60) continue;
        g.save(); g.translate(x, y); g.rotate(p.rot + p.spin * dt);
        g.globalAlpha = Math.min(1, (p.life - dt) / 0.5);
        g.fillStyle = p.c;
        const sx = Math.cos(dt * p.flip);
        if (p.circ) { g.beginPath(); g.ellipse(0, 0, p.h * 0.7, p.h * 0.7 * Math.abs(sx) + 1, 0, 0, 6.2832); g.fill(); }
        else g.fillRect(-p.w / 2, (-p.h / 2) * Math.abs(sx), p.w, p.h * Math.abs(sx) + 1);
        g.restore();
      }
    }
    g.globalAlpha = 1;

    // paper grain, moved every frame
    const f = Math.floor(t * 30);
    g.globalAlpha = s.light || fl ? 0.09 : 0.06;
    g.globalCompositeOperation = "overlay";
    const gx = -((f * 131) % GT), gy = -((f * 197) % GT);
    for (let y = gy; y < H; y += GT) for (let x = gx; x < W; x += GT) g.drawImage(grain, x, y);
    g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
  }
  window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
  renderAt(0);
})();
