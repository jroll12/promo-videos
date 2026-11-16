// Local: a browser window whose parts float loose (zero gravity). Same chrome as lib BrowserWindow (traffic lights,
// tab strip, address bar, content), but every tab, the address bar and the page blocks get their own drift, scaled by
// `loose` (0 = assembled, 1 = fully floating). `bob` (0..1) adds a beat-locked lift to the tabs and page blocks.
import React from 'react';
import {C, FONT, SHAPE, hardShadow, outline} from '../../lib/theme';
import {Tab, TrafficLights, fillerTab} from '../../lib/chrome';
import {Glyph, GlyphName} from '../../lib/glyphs';
import {beatAt} from '../../data/timing';
import {float} from '../../lib/motion';
import {seedOf} from '../../lib/rng';

const HEAD_H = 66;
const ADDR_H = 58;

const PAGE_BLOCKS = [
  {fx: 0.05, fy: 0.08, fw: 0.42, fh: 0.09, fill: 'ink2'},
  {fx: 0.05, fy: 0.24, fw: 0.3, fh: 0.05, fill: 'paper2'},
  {fx: 0.05, fy: 0.33, fw: 0.36, fh: 0.05, fill: 'paper2'},
  {fx: 0.05, fy: 0.42, fw: 0.24, fh: 0.05, fill: 'paper2'},
  {fx: 0.05, fy: 0.56, fw: 0.16, fh: 0.08, fill: 'tangerine'},
  {fx: 0.55, fy: 0.08, fw: 0.38, fh: 0.42, fill: 'paper2'},
  {fx: 0.55, fy: 0.6, fw: 0.18, fh: 0.22, fill: 'fizz'},
  {fx: 0.76, fy: 0.6, fw: 0.17, fh: 0.22, fill: 'pickle'},
] as const;

const PAGE_GLYPHS: {g: GlyphName; fx: number; fy: number}[] = [
  {g: 'cup', fx: 0.32, fy: 0.72},
  {g: 'key', fx: 0.44, fy: 0.2},
  {g: 'waffle', fx: 0.66, fy: 0.27},
  {g: 'sauce', fx: 0.12, fy: 0.82},
  {g: 'taco', fx: 0.86, fy: 0.15},
  {g: 'popper', fx: 0.47, fy: 0.62},
];

export const FloatBrowser: React.FC<{
  frame: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  tabs: number;
  loose: number;
  bob: number;
  url: string;
}> = ({frame, x, y, w, h, rot, tabs, loose, bob, url}) => {
  const t = beatAt(frame) / 8; // half-time clock: one unit per 2 bars
  const lift = (1 + Math.cos(2 * Math.PI * beatAt(frame))) / 2; // 1 on each beat, smooth
  const tabW = tabs ? Math.min(260, (w - 130) / tabs) : 0;
  const addr = float(frame, seedOf('ph-addr'), 14);
  const lights = float(frame, seedOf('ph-lights'), 10);
  const contentW = w - 8;
  const contentH = h - HEAD_H - ADDR_H - 8;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, transform: `rotate(${rot}deg)`, transformOrigin: 'center'}}>
      {/* the window shell */}
      <div style={{position: 'absolute', inset: 0, background: C.paper2, border: outline(), borderRadius: SHAPE.radius, boxShadow: hardShadow()}} />
      {/* content area (under the address bar) */}
      <div style={{position: 'absolute', left: 4, top: HEAD_H + ADDR_H + 4, width: contentW, height: contentH, background: C.paper, borderRadius: `0 0 ${SHAPE.radius - 4}px ${SHAPE.radius - 4}px`}}>
        {PAGE_BLOCKS.map((b, i) => {
          const f = float(frame, seedOf('ph-block') + i * 13, 26);
          const by = -bob * lift * (10 + (i % 3) * 5);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: b.fx * contentW,
                top: b.fy * contentH,
                width: b.fw * contentW,
                height: b.fh * contentH,
                background: C[b.fill],
                border: outline(3),
                borderRadius: SHAPE.radiusSmall,
                transform: `translate(${f.x * loose}px, ${f.y * loose + by}px) rotate(${f.rot * 1.4 * loose}deg)`,
              }}
            />
          );
        })}
        {PAGE_GLYPHS.map((p, i) => {
          const f = float(frame, seedOf('ph-glyph') + i * 17, 44);
          const by = -bob * lift * 16;
          return (
            <div
              key={p.g}
              style={{
                position: 'absolute',
                left: p.fx * contentW,
                top: p.fy * contentH,
                opacity: Math.min(1, loose * 1.5),
                transform: `translate(-50%, -50%) translate(${f.x * loose}px, ${f.y * loose + by}px) rotate(${f.rot * 5 * loose}deg)`,
              }}
            >
              <Glyph name={p.g} size={72} />
            </div>
          );
        })}
      </div>
      {/* address bar strip, drifts as one piece */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: HEAD_H,
          width: w,
          height: ADDR_H,
          boxSizing: 'border-box',
          background: C.paper,
          borderTop: outline(),
          borderBottom: outline(),
          borderLeft: outline(),
          borderRight: outline(),
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 18px',
          transform: `translate(${addr.x * loose}px, ${addr.y * 0.5 * loose}px) rotate(${addr.rot * 0.25 * loose}deg)`,
        }}
      >
        <span style={{fontFamily: FONT.display, fontWeight: 900, fontSize: 26, color: C.ink2}}>{'‹  ›  ↻'}</span>
        <div
          style={{
            flex: 1,
            height: 38,
            borderRadius: 19,
            border: outline(3),
            background: C.paper2,
            display: 'flex',
            alignItems: 'center',
            padding: '0 18px',
            fontFamily: FONT.mono,
            fontWeight: 600,
            fontSize: 20,
            color: C.ink,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {url}
        </div>
      </div>
      {/* header: traffic lights and the tab strip; each tab floats out of its slot */}
      <div style={{position: 'absolute', left: 18, top: 0, height: HEAD_H, display: 'flex', alignItems: 'flex-end', gap: 18}}>
        <div style={{paddingBottom: 15, transform: `translate(${lights.x * 0.5 * loose}px, ${lights.y * 0.5 * loose}px) rotate(${lights.rot * 2 * loose}deg)`}}>
          <TrafficLights />
        </div>
        <div style={{display: 'flex', alignItems: 'flex-end', width: w - 130, height: 50}}>
          {Array.from({length: tabs}, (_, i) => {
            const wave = Math.sin(t * Math.PI * 2 * 1.4 + i * 0.31);
            const dy = -loose * (5 + 7 * (0.5 + 0.5 * wave)) - bob * lift * (6 + 6 * (0.5 + 0.5 * Math.sin(i * 0.9)));
            const r = loose * Math.sin(t * Math.PI * 2 + i * 0.73) * 7;
            return (
              <div key={i} style={{flex: `0 0 ${tabW}px`, width: tabW, marginRight: tabW < 14 ? 0 : -3, transform: `translateY(${dy}px) rotate(${r}deg)`, transformOrigin: 'bottom'}}>
                <Tab tab={fillerTab(i)} width={tabW} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
