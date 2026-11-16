// Confetti system. Closed-form: every particle's position is a pure function of the global frame and its seed,
// so any frame can be rendered alone (Remotion renders frames out of order) and the result is identical every time.
//
//   <ConfettiField>  screen-space confetti in the air. Level from confettiLevelAt(frame) unless overridden.
//   <ConfettiBurst>  one-shot burst from a point (glovebox opening, a gag landing). Screen or world space.
//   <DebrisLayer>    settled debris (ledger in debris.ts), drawn in SCREEN space for a given camera pose,
//                    so render it AFTER <Camera> with the same pose. Handles the mural formation by itself.
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender} from 'remotion';
import {areFontsReady, fontsReady} from '../fonts';
import {CONFETTI_COLORS, C, FONT} from '../theme';
import {FPS} from '../../data/timing';
import {CONFETTI_MAX, Pose, confettiLevelAt, muralAt} from '../../data/contract';
import {hash} from '../rng';
import {DEBRIS, FALL_FRAMES} from './debris';
import {toScreen} from '../camera';

export {DEBRIS};

const useCanvas = (draw: (ctx: CanvasRenderingContext2D) => void, deps: unknown[]) => {
  const ref = useRef<HTMLCanvasElement>(null);
  // Hold the frame until fonts are in, then redraw, so canvas text never renders in a fallback font.
  const [fontsIn, setFontsIn] = useState(areFontsReady());
  const [handle] = useState(() => (areFontsReady() ? null : delayRender('canvas waits for fonts')));
  useEffect(() => {
    if (!fontsIn) fontsReady.then(() => setFontsIn(true));
  }, [fontsIn]);
  useLayoutEffect(() => {
    if (fontsIn && handle !== null) continueRender(handle);
  }, [fontsIn, handle]);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    draw(ctx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, fontsIn]);
  return ref;
};

const piece = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rot: number, flip: number, color: string) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(1, flip);
  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.restore();
};

export type ConfettiMode = 'fall' | 'float' | 'orbit';

export const ConfettiField: React.FC<{
  frame: number; // GLOBAL frame
  level?: number; // 0..1, default confettiLevelAt(frame)
  mode?: ConfettiMode;
  seed?: number;
  speed?: number; // 1 = normal; pre-hook uses 0.5 (half-time)
  center?: {x: number; y: number}; // orbit centre (screen px), default frame centre
  spin?: number; // orbit angular speed multiplier (hooks pass 1 + intensity)
  opacity?: number;
}> = ({frame, level, mode = 'fall', seed = 7, speed = 1, center = {x: 960, y: 520}, spin = 1, opacity = 1}) => {
  const lv = level ?? confettiLevelAt(frame);
  const n = Math.round(Math.max(0, Math.min(1, lv)) * CONFETTI_MAX);
  const t = (frame / FPS) * speed;
  const ref = useCanvas(
    (ctx) => {
      ctx.globalAlpha = opacity;
      for (let i = 0; i < n; i++) {
        const h0 = hash(seed, i), h1 = hash(seed + 1, i), h2 = hash(seed + 2, i), h3 = hash(seed + 3, i), h4 = hash(seed + 4, i);
        const color = CONFETTI_COLORS[Math.floor(h4 * CONFETTI_COLORS.length)];
        const w = 12 + h2 * 9, h = 7 + h3 * 5;
        const flip = Math.cos(t * (3 + h2 * 5) + h0 * 6.28);
        if (mode === 'orbit') {
          const R = 330 + h0 * 620;
          const a = h1 * 6.283 + t * (0.25 + h2 * 0.5) * spin * (h3 > 0.5 ? 1 : -1) * (520 / R);
          const x = center.x + Math.cos(a) * R * 1.15;
          const y = center.y + Math.sin(a) * R * 0.5 + Math.sin(t * 2 + h4 * 6) * 18;
          piece(ctx, x, y, w, h, a + t * 2, flip, color);
        } else {
          const v = mode === 'float' ? 40 + h1 * 50 : 150 + h1 * 170; // px per second
          const span = 1080 + 120;
          const y = ((h0 * span + t * v) % span) - 60;
          const amp = mode === 'float' ? 60 : 30;
          const x = h3 * 1960 - 20 + Math.sin(t * (1 + h2 * 1.5) + h4 * 6.28) * amp;
          piece(ctx, x, y, w, h, t * (1 + h1 * 3) + h2 * 6, flip, color);
        }
      }
    },
    [frame, n, mode, seed, speed, center.x, center.y, spin, opacity],
  );
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <canvas ref={ref} width={1920} height={1080} />
    </AbsoluteFill>
  );
};

// Burst: `count` pieces fly out from (x,y) at global frame `at`, with gravity, and fade after `life` frames.
export const ConfettiBurst: React.FC<{frame: number; at: number; x: number; y: number; count?: number; power?: number; life?: number; seed?: number; spread?: number; angle?: number}> = ({
  frame,
  at,
  x,
  y,
  count = 80,
  power = 1,
  life = 40,
  seed = 5,
  spread = 360,
  angle = -90,
}) => {
  const d = frame - at;
  const ref = useCanvas(
    (ctx) => {
      if (d < 0 || d > life) return;
      const t = d / FPS;
      ctx.globalAlpha = d > life * 0.7 ? 1 - (d - life * 0.7) / (life * 0.3) : 1;
      for (let i = 0; i < count; i++) {
        const a = ((angle + (hash(seed, i) - 0.5) * spread) * Math.PI) / 180;
        const v = (500 + hash(seed + 1, i) * 900) * power;
        const px = x + Math.cos(a) * v * t;
        const py = y + Math.sin(a) * v * t + 0.5 * 1800 * t * t;
        const color = CONFETTI_COLORS[Math.floor(hash(seed + 2, i) * CONFETTI_COLORS.length)];
        piece(ctx, px, py, 14 + hash(seed + 3, i) * 8, 8 + hash(seed + 4, i) * 5, t * 8 + i, Math.cos(t * 12 + i), color);
      }
    },
    [frame, at, x, y, count, power, life, seed, spread, angle],
  );
  if (d < 0 || d > life) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <canvas ref={ref} width={1920} height={1080} />
    </AbsoluteFill>
  );
};

const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

// Settled debris + mural. `pose` must be the same pose given to <Camera> this frame.
export const DebrisLayer: React.FC<{frame: number; pose: Pose; opacity?: number}> = ({frame, pose, opacity = 1}) => {
  const m = muralAt(frame);
  const ref = useCanvas(
    (ctx) => {
      ctx.globalAlpha = opacity;
      const s = pose.scale;
      for (const d of DEBRIS) {
        if (frame < d.emit) continue;
        // fall in, then rest; in the mural phase fly to the target on an arc
        const ft = smooth((frame - d.emit) / FALL_FRAMES);
        let wx = d.x + Math.sin((frame - d.emit) * 0.4 + d.id) * 30 * (1 - ft);
        let wy = d.y - 700 * (1 - ft) * (1 - ft);
        let rot = d.rot + (1 - ft) * 200;
        let w = d.w, h = d.h;
        const mi = smooth(m * 1.5 - d.stagger * 0.5);
        if (mi > 0) {
          const bulge = Math.sin(Math.PI * mi) * 260;
          const nx = -(d.my - d.y), ny = d.mx - d.x;
          const nl = Math.hypot(nx, ny) || 1;
          wx = d.x + (d.mx - d.x) * mi + (nx / nl) * bulge;
          wy = d.y + (d.my - d.y) * mi + (ny / nl) * bulge;
          rot = d.rot + (d.mrot - d.rot) * mi + Math.sin(Math.PI * mi) * 180;
          w = d.w + (d.mw - d.w) * mi;
          h = d.h + (d.mh - d.h) * mi;
        }
        const p = toScreen(pose, wx, wy);
        const sw = w * s, sh = h * s;
        if (p.x < -200 || p.x > 2120 || p.y < -200 || p.y > 1280) continue;
        const r = ((rot + pose.rot) * Math.PI) / 180;
        if (d.kind === 'confetti') {
          piece(ctx, p.x, p.y, sw, sh, r, 1, d.color);
        } else if (d.kind === 'paint') {
          ctx.fillStyle = d.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, sw / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (d.kind === 'crumb') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(r);
          ctx.fillStyle = d.color;
          ctx.strokeStyle = C.ink;
          ctx.lineWidth = Math.max(1, 2 * s);
          ctx.beginPath();
          ctx.moveTo(-sw / 2, -sh / 3);
          ctx.lineTo(sw / 4, -sh / 2);
          ctx.lineTo(sw / 2, sh / 4);
          ctx.lineTo(-sw / 5, sh / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        } else {
          // receipt: paper strip, ink outline, printed lines; the label receipt prints its text once in the mural
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(r);
          ctx.fillStyle = C.paper;
          ctx.strokeStyle = C.ink;
          ctx.lineWidth = Math.max(1.2, 3 * s * (1 + mi));
          ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
          ctx.strokeRect(-sw / 2, -sh / 2, sw, sh);
          if (d.label && mi > 0.85) {
            ctx.fillStyle = C.ink;
            ctx.font = `900 ${Math.round(sh * 0.46)}px 'Archivo'`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(d.label, 0, 1);
          } else {
            ctx.fillStyle = C.ink2;
            for (let k = 0; k < 4; k++) ctx.fillRect(-sw * 0.32, -sh * 0.32 + k * sh * 0.17, sw * (k % 2 ? 0.45 : 0.64), Math.max(1, sh * 0.05));
          }
          ctx.restore();
        }
      }
    },
    [frame, pose.x, pose.y, pose.scale, pose.rot, opacity, m],
  );
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <canvas ref={ref} width={1920} height={1080} />
    </AbsoluteFill>
  );
};

// For debugging and the test card: how many debris pieces have landed by a frame.
export const debrisCount = (frame: number) => DEBRIS.filter((d) => d.emit + FALL_FRAMES <= frame).length;
export {FONT};
