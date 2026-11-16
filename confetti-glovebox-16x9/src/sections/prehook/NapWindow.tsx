// Local gag for ph.02 "every straight line takes a nap": a window of straight UI lines (a ruler, a progress bar, a
// divider) that lie down, curl up like sleeping cats, shut their eyes and snore "z z z". Each line is a centreline
// whose bend grows with `curl` (0 = ruler-straight, 1 = coiled), drawn as an ink outline stroke plus a fill stroke.
import React from 'react';
import {AppWindow} from '../../lib/chrome';
import {C, FONT, SHAPE, outline} from '../../lib/theme';
import {clamp} from '../../lib/motion';

export const NAP_W = 720;
export const NAP_H = 500;
const BODY_W = NAP_W - 8;
const BODY_H = NAP_H - 52 - 8;
const STATUS_H = 44;

const N = 72;
const TURN = Math.PI * 2.05; // total bend when fully curled
const POW = 1.45; // bend tightens toward the tail, so it spirals in

type P = {x: number; y: number; th: number};
const centreline = (L: number, c: number): P[] => {
  const pts: P[] = [];
  let x = 0;
  let y = 0;
  const ds = L / N;
  for (let i = 0; i <= N; i++) {
    const th = -c * TURN * Math.pow(i / N, POW);
    pts.push({x, y, th});
    const thm = -c * TURN * Math.pow((i + 0.5) / N, POW);
    x += Math.cos(thm) * ds;
    y += Math.sin(thm) * ds;
  }
  return pts;
};
const pathOf = (pts: P[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

type Kind = 'ruler' | 'progress' | 'divider';
const SLOTS: {kind: Kind; label: string; L: number; th: number; base: number}[] = [
  {kind: 'ruler', label: 'ruler', L: 400, th: 30, base: 118},
  {kind: 'progress', label: 'progress', L: 400, th: 24, base: 246},
  {kind: 'divider', label: '<hr>', L: 400, th: 9, base: 364},
];
const SLOT_CX = 430;

const Sleeper: React.FC<{kind: Kind; L: number; th: number; base: number; curl: number; snore: number; frame: number; seed: number}> = ({kind, L, th, base, curl, snore, frame, seed}) => {
  const raw = centreline(L, curl);
  const xs = raw.map((p) => p.x);
  const ys = raw.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  // sit the shape on its baseline, centred in its slot
  const dx = SLOT_CX - (minX + maxX) / 2;
  const dy = base - maxY;
  const pts = raw.map((p) => ({...p, x: p.x + dx, y: p.y + dy}));
  const d = pathOf(pts);
  const nrm = (p: P) => ({x: -Math.sin(p.th), y: Math.cos(p.th)});
  const tan = (p: P) => ({x: Math.cos(p.th), y: Math.sin(p.th)});

  const fill = kind === 'ruler' ? C.mustard : kind === 'progress' ? C.paper : C.ink;
  const done = Math.round(N * 0.62);
  const eyes = curl > 0.35 && kind !== 'divider';
  const eyeAt = [Math.round(N * 0.04), Math.round(N * 0.1)];

  return (
    <g>
      {kind !== 'divider' && <path d={d} stroke={C.ink} strokeWidth={th + SHAPE.stroke * 2} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      <path d={d} stroke={fill} strokeWidth={th} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {kind === 'progress' && <path d={pathOf(pts.slice(0, done + 1))} stroke={C.pickle} strokeWidth={th} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      {kind === 'ruler' &&
        pts.map((p, i) => {
          if (i < 10 || i > N - 2 || i % 3) return null;
          const n = nrm(p);
          const len = i % 6 === 0 ? th * 0.48 : th * 0.28;
          const ox = p.x + n.x * (th / 2);
          const oy = p.y + n.y * (th / 2);
          return <line key={i} x1={ox} y1={oy} x2={ox - n.x * len} y2={oy - n.y * len} stroke={C.ink} strokeWidth={2.5} strokeLinecap="round" />;
        })}
      {/* closed eyes, drawn on the line near its head: two little smiles of sleep */}
      {eyes &&
        eyeAt.map((k) => {
          const p = pts[k];
          const t = tan(p);
          const n = nrm(p);
          const r = th * 0.2;
          const a = {x: p.x - t.x * r, y: p.y - t.y * r};
          const b = {x: p.x + t.x * r, y: p.y + t.y * r};
          const q = {x: p.x - n.x * r * 1.1, y: p.y - n.y * r * 1.1};
          return <path key={k} d={`M${a.x} ${a.y} Q${q.x} ${q.y} ${b.x} ${b.y}`} stroke={C.ink} strokeWidth={3} fill="none" strokeLinecap="round" opacity={clamp((curl - 0.35) / 0.3)} />;
        })}
      {/* z z z rising from the top of the coil */}
      {snore > 0 &&
        [0, 1, 2].map((k) => {
          const ph = (((frame + seed * 7) / 34 + k / 3) % 1 + 1) % 1;
          const zx = maxX + dx - 18 + ph * 34 + k * 4;
          const zy = minY + dy - 10 - ph * 70;
          return (
            <text
              key={k}
              x={zx}
              y={zy}
              fontFamily={FONT.display}
              fontWeight={900}
              fontSize={20 + ph * 18}
              fill={C.ink}
              opacity={snore * Math.sin(Math.PI * ph)}
            >
              z
            </text>
          );
        })}
    </g>
  );
};

// curlOf(i): curl 0..1 for slot i; snore 0..1 fades the z's in.
export const NapWindow: React.FC<{x: number; y: number; rot: number; scale: number; curls: number[]; snore: number; frame: number}> = ({x, y, rot, scale, curls, snore, frame}) => {
  const asleep = curls.every((c) => c > 0.9);
  return (
    <AppWindow x={x} y={y} w={NAP_W} h={NAP_H} title="straight lines" color="mustard" rot={rot} scale={scale}>
      <svg width={BODY_W} height={BODY_H - STATUS_H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {SLOTS.map((s, i) => (
          <g key={s.kind}>
            <text x={26} y={s.base + 6} fontFamily={FONT.mono} fontWeight={700} fontSize={20} fill={C.ink2}>
              {s.label}
            </text>
            <Sleeper kind={s.kind} L={s.L} th={s.th} base={s.base} curl={curls[i]} snore={snore} frame={frame} seed={i + 1} />
          </g>
        ))}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: '100%',
          height: STATUS_H,
          boxSizing: 'border-box',
          borderTop: outline(3),
          background: asleep ? C.ink : C.paper2,
          color: asleep ? C.paper : C.ink,
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          gap: 14,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 19,
        }}
      >
        {asleep ? 'status: napping  ·  do not disturb' : 'status: perfectly straight'}
      </div>
    </AppWindow>
  );
};
