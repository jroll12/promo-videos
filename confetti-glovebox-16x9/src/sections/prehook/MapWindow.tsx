// Local gag for ph.01 "all over the map": a small map app where the cursor wanders everywhere, leaving a dotted
// trail. Quietly rhymes with the final "You are here" mural (lake, park, dotted route) but shows no pin or label.
import React from 'react';
import {AppWindow, Cursor} from '../../lib/chrome';
import {C, FONT, SHAPE, outline} from '../../lib/theme';
import {hash, seedOf} from '../../lib/rng';

export const MAP_W = 640;
export const MAP_H = 450;
const BODY_W = MAP_W - 8;
const BODY_H = MAP_H - 52 - 8;

// The wandering route, resampled by arc length into evenly spaced dots (computed once; deterministic).
const SEED = seedOf('ph-map-trail');
const ph = (k: number) => hash(SEED, k) * Math.PI * 2;
const routeAt = (u: number) => ({
  x: BODY_W * 0.5 + BODY_W * 0.4 * (0.62 * Math.sin(Math.PI * 2 * 1.35 * u + ph(1)) + 0.38 * Math.sin(Math.PI * 2 * 3.2 * u + ph(2))),
  y: BODY_H * 0.54 + BODY_H * 0.36 * (0.6 * Math.sin(Math.PI * 2 * 1.75 * u + ph(3)) + 0.4 * Math.cos(Math.PI * 2 * 2.6 * u + ph(4))),
});
const DOT_GAP = 17;
const DOTS: {x: number; y: number}[] = (() => {
  const out: {x: number; y: number}[] = [];
  let prev = routeAt(0);
  let acc = DOT_GAP;
  for (let i = 1; i <= 900; i++) {
    const p = routeAt(i / 900);
    acc += Math.hypot(p.x - prev.x, p.y - prev.y);
    if (acc >= DOT_GAP) {
      out.push(p);
      acc = 0;
    }
    prev = p;
  }
  return out;
})();

// progress 0..1: how much of the route the cursor has walked.
export const MapWindow: React.FC<{x: number; y: number; rot: number; scale: number; progress: number; frame: number}> = ({x, y, rot, scale, progress, frame}) => {
  const n = Math.max(1, Math.round(progress * DOTS.length));
  const head = routeAt(Math.min(1, progress));
  return (
    <AppWindow x={x} y={y} w={MAP_W} h={MAP_H} title="map" color="fizz" rot={rot} scale={scale} bodyStyle={{background: C.paper2}}>
      <svg width={BODY_W} height={BODY_H} style={{position: 'absolute', left: 0, top: 0}}>
        {/* streets */}
        {[0.22, 0.5, 0.78].map((f) => (
          <rect key={`h${f}`} x={0} y={BODY_H * f - 9} width={BODY_W} height={18} fill={C.paper} />
        ))}
        {[0.18, 0.46, 0.74].map((f) => (
          <rect key={`v${f}`} x={BODY_W * f - 9} y={0} width={18} height={BODY_H} fill={C.paper} />
        ))}
        <path d={`M -10 ${BODY_H * 0.92} C ${BODY_W * 0.3} ${BODY_H * 0.6}, ${BODY_W * 0.6} ${BODY_H * 1.0}, ${BODY_W + 10} ${BODY_H * 0.35}`} stroke={C.mustard} strokeWidth={14} fill="none" />
        {/* lake and park, as in the mural, mirror-ish */}
        <ellipse cx={BODY_W * 0.25} cy={BODY_H * 0.36} rx={78} ry={52} fill={C.fizz} stroke={C.ink} strokeWidth={SHAPE.thin + 0.5} />
        <rect x={BODY_W * 0.62} y={BODY_H * 0.58} width={150} height={96} rx={SHAPE.radiusSmall} fill={C.pickle} stroke={C.ink} strokeWidth={SHAPE.thin + 0.5} />
        {[0, 1, 2].map((k) => (
          <circle key={k} cx={BODY_W * 0.62 + 34 + k * 42} cy={BODY_H * 0.58 + 48 + (k % 2) * 14} r={13} fill={C.pickle} stroke={C.ink} strokeWidth={2.5} />
        ))}
        {/* the cursor's dotted trail */}
        {DOTS.slice(0, n).map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={i === n - 1 ? 6 : 4.6} fill={C.ink} />
        ))}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 14,
          top: 12,
          padding: '3px 10px',
          background: C.paper,
          border: outline(2.5),
          borderRadius: SHAPE.radiusSmall,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 18,
          color: C.ink,
        }}
      >
        route: recalculating{'.'.repeat(1 + (Math.floor(frame / 8) % 3))}
      </div>
      <Cursor x={head.x} y={head.y} kind="arrow" scale={1.25} />
    </AppWindow>
  );
};
