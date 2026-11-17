// Local building blocks for the hook: a browser window whose symmetric tab bar is centred on the screen axis,
// the fitted two-row hook lyric card, and the four orbiting gag windows (sauce, fizz, keys, lunch).
import React from 'react';
import {AppWindow, Tab, TabBar, TabSpec, TrafficLights, clockAt} from '../../lib/chrome';
import {Glyph} from '../../lib/glyphs';
import {C, FONT, SHAPE, hardShadow, outline} from '../../lib/theme';
import {Line, wordAt} from '../../data/timing';
import {wordsOf} from '../../lib/type';
import {useShowLyrics} from '../../lib/context';
import {clamp, ease} from '../../lib/motion';

// ------------------------------------------------------------------ browser with a screen-centred tab bar

// The lib BrowserWindow starts its tab bar after the traffic lights, which puts the "centred" active tab about
// 55 px right of the frame axis. The hook image needs it dead centre, so this copy centres the tab bar instead.
export const TAB_SIDE = 116; // inner px reserved left and right of the tab bar (traffic lights live in the left one)
export const HookBrowser: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  tabs: number;
  named: Record<number, TabSpec>;
  activeWidth: number;
  url: string;
  children?: React.ReactNode;
}> = ({x, y, w, h, tabs, named, activeWidth, url, children}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      background: C.paper2,
      border: outline(),
      borderRadius: SHAPE.radius,
      boxShadow: hardShadow(),
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div style={{position: 'relative', height: 66, flex: '0 0 66px'}}>
      <div style={{position: 'absolute', left: 18, bottom: 15}}>
        <TrafficLights />
      </div>
      <div style={{position: 'absolute', left: TAB_SIDE, bottom: 0}}>
        <TabBar width={w - 2 * TAB_SIDE} count={tabs} named={named} active={0} mode="symmetric" activeWidth={activeWidth} />
      </div>
    </div>
    <div style={{height: 58, flex: '0 0 58px', background: C.paper, borderTop: outline(), borderBottom: outline(), display: 'flex', alignItems: 'center', gap: 16, padding: '0 18px'}}>
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
    <div style={{position: 'relative', flex: 1, background: C.paper, overflow: 'hidden'}}>{children}</div>
  </div>
);

// ------------------------------------------------------------------ hook lyric, fitted to two rows

// Break position (words in row 1) and widths at 100 px of Archivo 900 / 125 %, measured once in headless Chrome:
// `half` = the wider row, `full` = the whole line on one row. Same lyric in every hook, keyed by line number.
const FIT: Record<string, {brk: number; half: number}> = {
  '01': {brk: 3, half: 1236},
  '02': {brk: 3, half: 1038},
  '03': {brk: 4, half: 1456},
  '04': {brk: 3, half: 887},
  '05': {brk: 2, half: 1063},
  '06': {brk: 3, half: 931},
  '07': {brk: 3, half: 1052},
  '08': {brk: 3, half: 887},
};
const ROW_BUDGET = 1640; // max text width of a row, px

export const hookTypeSize = (l: Line, intensity: number) => {
  const base = 80 + 60 * intensity; // same scale as the lib HookType: 104 / 122 / 140
  const f = FIT[l.id.slice(-2)];
  return Math.min(base, (ROW_BUDGET / f.half) * 100);
};

// Paper sticker card, straight, top-anchored at `top`, words pop in on their sung frame, the sung word is tangerine.
export const HookLyric: React.FC<{lines: Line[]; frame: number; intensity: number; top: number; pulse: number}> = ({lines, frame, intensity, top, pulse}) => {
  const show = useShowLyrics();
  if (!show || frame < lines[0].startFrame - 4) return null;
  let cur = lines[0];
  for (const l of lines) if (l.startFrame - 4 <= frame) cur = l;
  const size = hookTypeSize(cur, intensity);
  const enter = ease.outBack(clamp((frame - (cur.startFrame - 4)) / 6));
  const words = wordsOf(cur);
  const k = wordAt(cur, frame);
  const brk = FIT[cur.id.slice(-2)].brk;
  const rows = [words.slice(0, brk).map((w, i) => ({...w, i})), words.slice(brk).map((w, i) => ({...w, i: i + brk}))];
  return (
    <div
      style={{
        position: 'absolute',
        left: 960,
        top,
        transform: `translateX(-50%) scale(${enter})`,
        transformOrigin: '50% 0',
        width: 'max-content',
        textAlign: 'center',
        fontFamily: FONT.display,
        fontWeight: 900,
        fontStretch: '125%',
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: -size * 0.01,
        padding: `${size * 0.14}px ${size * 0.3}px ${size * 0.18}px`,
        background: C.paper,
        border: outline(SHAPE.stroke + 1),
        borderRadius: SHAPE.radius,
        boxShadow: hardShadow(SHAPE.shadow + 2),
        textTransform: 'uppercase',
        zIndex: 60,
      }}
    >
      {rows.map((row, r) => (
        <div key={r} style={{whiteSpace: 'nowrap'}}>
          {row.map((w, j) => {
            const d = frame - w.at;
            const s = d < 0 ? 0 : ease.outBack(clamp(d / 7), 2.2);
            const active = w.i === k;
            return (
              <span
                key={w.i}
                style={{
                  display: 'inline-block',
                  transform: `scale(${s}) translateY(${active ? -pulse * size * 0.06 : 0}px)`,
                  transformOrigin: '50% 80%',
                  color: active ? C.tangerine : C.ink,
                  marginRight: j < row.length - 1 ? size * 0.24 : 0,
                  opacity: d < 0 ? 0 : 1,
                }}
              >
                {w.w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ------------------------------------------------------------------ the page inside the hook window

export const StatusCard: React.FC<{frame: number; tabs: number; checkAt: number; lostAt: number}> = ({frame, tabs, checkAt, lostAt}) => {
  const check = frame >= checkAt ? ease.outBack(clamp((frame - checkAt) / 8)) : 0;
  const lost = frame >= lostAt;
  return (
    <div
      style={{
        position: 'absolute',
        left: 700,
        top: 395,
        transform: 'translateX(-50%)',
        width: 640,
        height: 150,
        boxSizing: 'border-box',
        background: C.paper,
        border: outline(),
        borderRadius: SHAPE.radius,
        boxShadow: hardShadow(),
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        padding: '0 28px',
        overflow: 'visible',
      }}
    >
      <Glyph name={lost ? 'pin' : 'glovebox'} size={84} />
      <div>
        <div style={{fontFamily: FONT.display, fontWeight: 900, fontStretch: '125%', fontSize: 40, color: C.ink, lineHeight: 1.05, textTransform: 'uppercase'}}>
          {lost ? 'still not lost' : 'still showing up'}
        </div>
        <div style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 20, color: C.ink2, marginTop: 8}}>
          present · {clockAt(frame)} · tab 1 of {tabs}
        </div>
      </div>
      {check > 0 && (
        <div
          style={{
            position: 'absolute',
            right: -26,
            top: -30,
            width: 72,
            height: 72,
            borderRadius: 36,
            background: C.pickle,
            border: outline(),
            boxShadow: hardShadow(5),
            transform: `scale(${check}) rotate(-12deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width={40} height={40} viewBox="0 0 40 40">
            <path d="M8 21 L17 30 L33 10" stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
};

// A loose tab flying in the orbit ("too many tabs"): the lib Tab with a bottom edge and a hard shadow.
export const TabChip: React.FC<{tab: TabSpec}> = ({tab}) => (
  <div style={{borderBottom: outline(3), boxShadow: hardShadow(5), borderRadius: `${SHAPE.radiusSmall}px ${SHAPE.radiusSmall}px 0 0`}}>
    <Tab tab={tab} width={170} />
  </div>
);

// ------------------------------------------------------------------ gag windows

export type GagId = 'sauce' | 'fizz' | 'keys' | 'lunch';
export const GAG_W = 300;
export const GAG_H = 220;
const BODY_H = GAG_H - 56;

const Label: React.FC<{text: string; color?: keyof typeof C}> = ({text, color = 'mustard'}) => (
  <div
    style={{
      position: 'absolute',
      left: '50%',
      bottom: 8,
      transform: 'translateX(-50%)',
      whiteSpace: 'nowrap',
      padding: '2px 10px',
      borderRadius: SHAPE.radiusSmall,
      border: outline(2.5),
      background: C[color],
      fontFamily: FONT.mono,
      fontWeight: 800,
      fontSize: 18,
      color: C.ink,
    }}
  >
    {text}
  </div>
);

const ST = {stroke: C.ink, strokeWidth: 4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};

const SauceBody: React.FC<{t: number}> = ({t}) => {
  const drip = (t * 2.2) % 1;
  return (
    <svg width={GAG_W - 8} height={BODY_H} viewBox="0 0 292 164" style={{position: 'absolute', left: 0, top: 0}}>
      {/* puddle */}
      <ellipse cx={146} cy={128} rx={74 + Math.sin(t * 6) * 4} ry={9} fill={C.tangerine} {...ST} strokeWidth={3} />
      {/* backpack */}
      <path d="M104 40 Q146 18 188 40 V124 H104Z" fill={C.pink} {...ST} />
      <rect x={118} y={78} width={56} height={36} rx={8} fill={C.pink} {...ST} />
      <path d="M126 40 V28 Q146 14 166 28 V40" fill="none" {...ST} />
      {/* sauce running down the front */}
      <path d="M150 34 C150 52 140 60 140 78 M162 36 C164 60 170 70 168 96" stroke={C.tangerine} strokeWidth={9} fill="none" strokeLinecap="round" />
      {/* tipped sauce bottle sticking out of the top */}
      <g transform="translate(150 -6) rotate(140 32 32) scale(0.85)">
        <Glyph name="sauce" size={64} />
      </g>
      {/* falling drip */}
      <circle cx={168} cy={100 + drip * 26} r={5} fill={C.tangerine} stroke={C.ink} strokeWidth={2} opacity={drip < 0.9 ? 1 : 0} />
    </svg>
  );
};

const FizzBody: React.FC<{t: number}> = ({t}) => (
  <svg width={GAG_W - 8} height={BODY_H} viewBox="0 0 292 164" style={{position: 'absolute', left: 0, top: 0}}>
    <ellipse cx={146} cy={128} rx={78 + Math.sin(t * 5) * 4} ry={9} fill={C.fizz} {...ST} strokeWidth={3} />
    {/* cup */}
    <path d="M114 44 H178 L170 124 H122Z" fill={C.fizz} {...ST} />
    {/* foam spilling over the rim and down the sides */}
    <path
      d="M106 46 C100 30 120 22 128 30 C132 16 156 16 160 28 C170 20 190 30 184 46 C190 58 182 66 176 62 C176 76 168 80 166 70 L126 70 C124 82 114 80 116 64 C104 66 100 56 106 46Z"
      fill={C.paper}
      {...ST}
    />
    <path d="M168 14 L180 -4" {...ST} strokeWidth={6} />
    {/* bubbles escaping upward */}
    {[0, 1, 2, 3, 4].map((i) => {
      const p = (t * 1.6 + i * 0.21) % 1;
      return <circle key={i} cx={124 + i * 11 + Math.sin(t * 7 + i) * 6} cy={30 - p * 40} r={4 + (i % 2) * 2} fill={C.paper} stroke={C.ink} strokeWidth={2.5} opacity={1 - p * 0.6} />;
    })}
  </svg>
);

const KeysBody: React.FC<{t: number}> = ({t}) => (
  <svg width={GAG_W - 8} height={BODY_H} viewBox="0 0 292 164" style={{position: 'absolute', left: 0, top: 0}}>
    {/* fridge body, door swung open */}
    <rect x={92} y={8} width={92} height={124} rx={8} fill={C.paper2} {...ST} />
    <rect x={100} y={16} width={76} height={108} rx={5} fill={C.paper} {...ST} strokeWidth={3} />
    <path d="M100 52 H176 M100 88 H176" {...ST} strokeWidth={3} />
    <path d="M184 12 L222 2 V138 L184 128Z" fill={C.paper} {...ST} />
    <path d="M196 40 V64" {...ST} strokeWidth={5} />
    {/* milk carton and a pickle jar, for scale */}
    <path d="M108 34 L114 26 H124 L130 34 V52 H108Z" fill={C.paper} {...ST} strokeWidth={3} />
    <rect x={146} y={66} width={20} height={22} rx={4} fill={C.pickle} {...ST} strokeWidth={3} />
    {/* the keys, on the middle shelf, with a pin over them */}
    <g transform="translate(104 54) scale(0.55)">
      <Glyph name="key" size={64} />
    </g>
    <g transform={`translate(110 ${18 + Math.sin(t * 8) * 4}) scale(0.4)`}>
      <Glyph name="pin" size={64} />
    </g>
    {/* cold air */}
    <path d={`M70 ${40 + Math.sin(t * 4) * 3} h14 M64 64 h18 M70 ${88 - Math.sin(t * 4) * 3} h14`} stroke={C.fizz} strokeWidth={5} strokeLinecap="round" />
  </svg>
);

const LunchBody: React.FC<{t: number; beat: number}> = ({t, beat}) => {
  // minute hand ticks around just past twelve: it is lunch, and it is getting weird
  const ma = (((4 + Math.floor(t * 2) % 4) / 60) * 360 - 90) * (Math.PI / 180);
  return (
    <svg width={GAG_W - 8} height={BODY_H} viewBox="0 0 292 164" style={{position: 'absolute', left: 0, top: 0}}>
      {/* clock at lunch */}
      <circle cx={92} cy={66} r={52} fill={C.paper} {...ST} />
      {Array.from({length: 12}, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={92 + Math.cos(a) * 42} y1={66 + Math.sin(a) * 42} x2={92 + Math.cos(a) * 48} y2={66 + Math.sin(a) * 48} stroke={C.ink} strokeWidth={i % 3 ? 2.5 : 4} />;
      })}
      <line x1={92} y1={66} x2={92} y2={34} {...ST} strokeWidth={6} />
      <line x1={92} y1={66} x2={92 + Math.cos(ma) * 44} y2={66 + Math.sin(ma) * 44} {...ST} strokeWidth={4} />
      <circle cx={92} cy={66} r={5} fill={C.tangerine} {...ST} strokeWidth={2.5} />
      {/* sandwich, slightly wobbly */}
      <g transform={`rotate(${Math.sin(t * 6) * 6} 214 92)`}>
        <path d="M168 104 H260 Q262 116 250 118 H178 Q166 116 168 104Z" fill={C.mustard} {...ST} />
        <path d="M168 104 C178 94 186 104 196 96 C206 104 214 94 224 100 C234 94 244 104 260 98" fill="none" stroke={C.pickle} strokeWidth={8} strokeLinecap="round" />
        <rect x={180} y={90} width={70} height={8} rx={4} fill={C.tangerine} {...ST} strokeWidth={2.5} />
        <path d="M170 90 Q214 50 258 90Z" fill={C.mustard} {...ST} />
        <circle cx={204} cy={78} r={3} fill={C.ink} />
        <circle cx={224} cy={74} r={3} fill={C.ink} />
      </g>
      {/* alert badge, blinks on the beat */}
      <g transform={`translate(226 22) scale(${1 + beat * 0.18})`}>
        <path d="M0 -20 L20 16 H-20Z" fill={C.mustard} {...ST} strokeWidth={3.5} />
        <path d="M0 -8 V4 M0 10 V11" {...ST} strokeWidth={4} />
      </g>
    </svg>
  );
};

const GAGS: Record<GagId, {title: string; glyph: 'sauce' | 'cup' | 'key' | 'taco'; bar: keyof typeof C; label: string}> = {
  sauce: {title: 'backpack', glyph: 'sauce', bar: 'tangerine', label: 'SAUCE: TOO MUCH'},
  fizz: {title: 'fizz cup', glyph: 'cup', bar: 'fizz', label: 'FIZZ: OVERFLOW'},
  keys: {title: 'find keys', glyph: 'key', bar: 'mustard', label: 'FOUND: IN FRIDGE'},
  lunch: {title: 'lunch', glyph: 'taco', bar: 'pickle', label: 'LUNCH: WEIRD'},
};

// One gag window centred on (cx, cy).
export const GagWindow: React.FC<{gag: GagId; cx: number; cy: number; scale: number; rot: number; t: number; beat: number}> = ({gag, cx, cy, scale, rot, t, beat}) => {
  const g = GAGS[gag];
  if (scale <= 0.001) return null;
  return (
    <AppWindow x={cx - GAG_W / 2} y={cy - GAG_H / 2} w={GAG_W} h={GAG_H} title={g.title} glyph={g.glyph} color={g.bar} rot={rot} scale={scale}>
      {gag === 'sauce' && <SauceBody t={t} />}
      {gag === 'fizz' && <FizzBody t={t} />}
      {gag === 'keys' && <KeysBody t={t} />}
      {gag === 'lunch' && <LunchBody t={t} beat={beat} />}
      <Label text={g.label} />
    </AppWindow>
  );
};
