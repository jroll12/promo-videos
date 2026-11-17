// Local props for verse 1: small flat drawings the glyph set does not have (speech bubble, socks, fridge, wallet,
// chequered flag, analog clock, car, pause badge). Palette, outline and shadow rules as in the style bible.
import React from 'react';
import {C, FONT, SHAPE, hardShadow, outline} from '../../lib/theme';
import {ease} from '../../lib/motion';

const S = {stroke: C.ink, strokeWidth: 3.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};

// Speech bubble with a tail. (x, y) is the top-left corner; tail points from the chosen side toward (tx, ty) offsets.
export const SpeechBubble: React.FC<{
  x: number;
  y: number;
  w: number;
  text: React.ReactNode;
  size?: number;
  tail?: 'left' | 'bottom-left' | 'bottom-right';
  enter?: number;
  color?: keyof typeof C;
  rot?: number;
}> = ({x, y, w, text, size = 48, tail = 'left', enter = 1, color = 'paper', rot = 0}) => {
  if (enter <= 0) return null;
  const origin = tail === 'left' ? '0% 60%' : tail === 'bottom-left' ? '15% 100%' : '85% 100%';
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, transform: `rotate(${rot}deg) scale(${enter})`, transformOrigin: origin, zIndex: 30}}>
      <div
        style={{
          position: 'relative',
          background: C[color],
          border: outline(SHAPE.stroke + 1),
          borderRadius: SHAPE.radius * 2,
          boxShadow: hardShadow(),
          padding: `${size * 0.32}px ${size * 0.5}px`,
          fontFamily: FONT.display,
          fontWeight: 900,
          fontStretch: '112%',
          fontSize: size,
          lineHeight: 1.05,
          color: C.ink,
        }}
      >
        {text}
        <svg
          width={70}
          height={60}
          viewBox="0 0 70 60"
          style={{
            position: 'absolute',
            overflow: 'visible',
            ...(tail === 'left'
              ? {left: -58, top: '50%', marginTop: -20}
              : tail === 'bottom-left'
                ? {left: 50, bottom: -52}
                : {right: 50, bottom: -52}),
          }}
        >
          {tail === 'left' ? (
            <path d="M62 4 L4 30 L62 36" fill={C[color]} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
          ) : tail === 'bottom-left' ? (
            <path d="M6 -2 L4 52 L44 -2" fill={C[color]} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
          ) : (
            <path d="M64 -2 L66 52 L26 -2" fill={C[color]} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
          )}
        </svg>
      </div>
    </div>
  );
};

// One sock (cuff up, toe to the right). size = height in px.
export const Sock: React.FC<{size?: number; rot?: number; flip?: boolean}> = ({size = 160, rot = 0, flip = false}) => (
  <svg width={size} height={size} viewBox="0 0 72 72" style={{overflow: 'visible', transform: `rotate(${rot}deg) scaleX(${flip ? -1 : 1})`}}>
    <g {...S}>
      <path d="M14 4 H38 V42 C38 48 44 50 52 50 H58 C68 50 68 68 58 68 H26 C18 68 14 62 14 54Z" fill={C.paper} />
      <path d="M14 10 H38 M14 17 H38" stroke={C.fizz} strokeWidth={4} />
      <path d="M14 4 H38" />
      <path d="M58 50 C68 50 68 68 58 68 H54 V50Z" fill={C.pink} />
      <path d="M14 54 C14 62 18 68 26 68 H30 C30 60 24 54 14 54Z" fill={C.pink} />
    </g>
  </svg>
);

// A fridge with a door that swings open (open 0..1). Door hinges on the left edge.
export const Fridge: React.FC<{x: number; y: number; w?: number; h?: number; open: number}> = ({x, y, w = 300, h = 540, open}) => {
  const lit = open > 0.05;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h}}>
      <div style={{position: 'absolute', inset: 0, background: C.paper2, border: outline(), borderRadius: SHAPE.radius, boxShadow: hardShadow()}} />
      <div style={{position: 'absolute', left: 16, top: 16, right: 16, bottom: 16, background: lit ? C.mustard : C.ink2, border: outline(3), borderRadius: SHAPE.radiusSmall}}>
        {[0.34, 0.62].map((p) => (
          <div key={p} style={{position: 'absolute', left: 0, right: 0, top: `${p * 100}%`, borderTop: outline(3)}} />
        ))}
        {/* jars and a milk carton on the shelves */}
        <div style={{position: 'absolute', left: 22, top: '20%', width: 46, height: 52, background: C.tangerine, border: outline(3), borderRadius: 6}} />
        <div style={{position: 'absolute', left: 150, top: '15%', width: 54, height: 72, background: C.paper, border: outline(3), borderRadius: 4}} />
        <div style={{position: 'absolute', left: 30, top: '72%', width: 70, height: 40, background: C.pink, border: outline(3), borderRadius: 6}} />
        <div style={{position: 'absolute', left: 170, top: '74%', width: 40, height: 40, background: C.fizz, border: outline(3), borderRadius: 20}} />
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: '0% 50%',
          transform: `perspective(900px) rotateY(${-open * 72}deg)`,
          background: C.paper,
          border: outline(),
          borderRadius: SHAPE.radius,
          backfaceVisibility: 'visible',
        }}
      >
        <div style={{position: 'absolute', left: 0, right: 0, top: '30%', borderTop: outline()}} />
        <div style={{position: 'absolute', right: 24, top: '8%', width: 14, height: 70, background: C.ink2, border: outline(3), borderRadius: 7}} />
        <div style={{position: 'absolute', right: 24, top: '38%', width: 14, height: 110, background: C.ink2, border: outline(3), borderRadius: 7}} />
      </div>
    </div>
  );
};

// Open wallet, receipts spill from it (the receipts themselves are debris, drawn by DebrisLayer).
export const Wallet: React.FC<{x: number; y: number; w?: number; open?: number}> = ({x, y, w = 300, open = 1}) => (
  <svg width={w} height={w * 0.62} viewBox="0 0 100 62" style={{position: 'absolute', left: x, top: y, overflow: 'visible'}}>
    <g {...S} strokeWidth={2.2}>
      <rect x={4} y={18} width={92} height={42} rx={6} fill={C.ink2} />
      <g transform={`rotate(${-open * 28} 6 20)`}>
        <path d="M4 20 C4 10 10 6 16 6 H90 C94 6 96 10 96 14 V20Z" fill={C.paper2} />
      </g>
      <rect x={70} y={30} width={22} height={14} rx={4} fill={C.mustard} />
      <circle cx={80} cy={37} r={2.5} fill={C.ink} />
      <path d="M12 28 H60 M12 36 H52" stroke={C.paper2} strokeWidth={2} />
    </g>
  </svg>
);

// Chequered flag on a pole, waving. t = time in seconds.
export const ChequeredFlag: React.FC<{x: number; y: number; w?: number; h?: number; t: number; enter?: number; pole?: number}> = ({
  x,
  y,
  w = 260,
  h = 170,
  t,
  enter = 1,
  pole = 360,
}) => {
  if (enter <= 0) return null;
  const cols = 8;
  const rows = 5;
  const cw = w / cols;
  const ch = h / rows;
  const wave = (c: number) => Math.sin(t * 9 - c * 0.8) * 10 * (c / cols);
  return (
    <svg width={w + 40} height={pole + 20} style={{position: 'absolute', left: x, top: y, overflow: 'visible', transform: `rotate(${(1 - enter) * -40}deg) scale(${enter})`, transformOrigin: '6px 100%'}}>
      <rect x={0} y={0} width={12} height={pole} rx={6} fill={C.ink2} stroke={C.ink} strokeWidth={3} />
      <g transform="translate(12 6)">
        {Array.from({length: cols * rows}, (_, k) => {
          const c = k % cols;
          const r = Math.floor(k / cols);
          return <rect key={k} x={c * cw} y={r * ch + wave(c)} width={cw + 0.6} height={ch + 0.6} fill={(c + r) % 2 ? C.paper : C.ink} />;
        })}
        <path
          d={`M0 ${wave(0)} ${Array.from({length: cols}, (_, c) => `L${(c + 1) * cw} ${wave(c)}`).join(' ')} L${w} ${h + wave(cols - 1)} ${Array.from({length: cols}, (_, c) => `L${(cols - 1 - c) * cw} ${h + wave(cols - 1 - c)}`).join(' ')} Z`}
          fill="none"
          stroke={C.ink}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

// Analog clock face. minutes = minutes since midnight.
export const AnalogClock: React.FC<{size?: number; minutes: number; ring?: keyof typeof C}> = ({size = 240, minutes, ring = 'paper'}) => {
  const m = minutes % 60;
  const hr = (minutes / 60) % 12;
  const hand = (deg: number, len: number, wdt: number, col: string) => {
    const r = ((deg - 90) * Math.PI) / 180;
    return <line x1={50} y1={50} x2={50 + Math.cos(r) * len} y2={50 + Math.sin(r) * len} stroke={col} strokeWidth={wdt} strokeLinecap="round" />;
  };
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx={50} cy={50} r={46} fill={C[ring]} stroke={C.ink} strokeWidth={4} />
      {Array.from({length: 12}, (_, i) => {
        const r = (i * 30 * Math.PI) / 180;
        return <line key={i} x1={50 + Math.sin(r) * 36} y1={50 - Math.cos(r) * 36} x2={50 + Math.sin(r) * 41} y2={50 - Math.cos(r) * 41} stroke={C.ink} strokeWidth={i % 3 ? 2 : 4} strokeLinecap="round" />;
      })}
      {/* the "should have left" wedge: 9:00 to now */}
      {hand(hr * 30, 22, 6, C.ink)}
      {hand(m * 6, 34, 4, C.tangerine)}
      <circle cx={50} cy={50} r={4} fill={C.ink} />
    </svg>
  );
};

// Side view of a small car (for "crumbs in the car"); crumbs themselves are debris.
export const Car: React.FC<{x: number; y: number; w?: number}> = ({x, y, w = 420}) => (
  <svg width={w} height={w * 0.5} viewBox="0 0 120 60" style={{position: 'absolute', left: x, top: y, overflow: 'visible'}}>
    <g {...S} strokeWidth={2.6}>
      <path d="M6 44 V34 C6 30 10 28 16 28 L30 14 C32 12 36 10 40 10 H76 C80 10 84 12 86 14 L98 28 C108 28 114 32 114 38 V44Z" fill={C.fizz} />
      <path d="M36 16 H58 V28 H26Z M64 16 H80 L92 28 H64Z" fill={C.paper} />
      <circle cx={30} cy={46} r={10} fill={C.ink2} />
      <circle cx={30} cy={46} r={4} fill={C.paper2} />
      <circle cx={92} cy={46} r={10} fill={C.ink2} />
      <circle cx={92} cy={46} r={4} fill={C.paper2} />
    </g>
  </svg>
);

// Pause badge for "Hold up, wait".
export const PauseBadge: React.FC<{x: number; y: number; enter: number}> = ({x, y, enter}) => {
  if (enter <= 0) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${enter})`, display: 'flex', alignItems: 'center', gap: 22, zIndex: 35}}>
      <div style={{width: 150, height: 150, borderRadius: 75, background: C.paper, border: outline(SHAPE.stroke + 2), boxShadow: hardShadow(), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22}}>
        <div style={{width: 26, height: 72, background: C.ink, borderRadius: 6}} />
        <div style={{width: 26, height: 72, background: C.ink, borderRadius: 6}} />
      </div>
      <div style={{fontFamily: FONT.display, fontWeight: 900, fontStretch: '125%', fontSize: 70, color: C.ink, background: C.mustard, border: outline(SHAPE.stroke + 1), borderRadius: SHAPE.radius, boxShadow: hardShadow(), padding: '6px 26px'}}>
        PAUSED
      </div>
    </div>
  );
};

// Small rounded chip for labels inside scenes.
export const Chip: React.FC<{children: React.ReactNode; bg?: keyof typeof C; color?: keyof typeof C; size?: number; style?: React.CSSProperties}> = ({children, bg = 'paper', color = 'ink', size = 24, style}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      background: C[bg],
      color: C[color],
      border: outline(3),
      borderRadius: SHAPE.radiusSmall,
      padding: `${size * 0.2}px ${size * 0.5}px`,
      fontFamily: FONT.mono,
      fontWeight: 800,
      fontSize: size,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);

export const bump = (d: number, len: number) => (d < 0 || d > len ? 0 : Math.sin((Math.PI * d) / len));
export const settle = (frame: number, at: number, dur = 8) => (frame < at ? 0 : ease.outBack(Math.min(1, (frame - at) / dur)));
