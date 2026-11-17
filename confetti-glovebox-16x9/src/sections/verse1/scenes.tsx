// Verse 1 tab scenes. Each component fills the browser content area (CW x CH, content-local px) and takes the
// GLOBAL frame. All timing comes from line ids and word starts.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, SHAPE, hardShadow, outline} from '../../lib/theme';
import {Glyph} from '../../lib/glyphs';
import {TabSpec, fillerTab} from '../../lib/chrome';
import {wordsOf} from '../../lib/type';
import {clamp, ease, lerp, popIn, prog} from '../../lib/motion';
import {hash} from '../../lib/rng';
import {FPS, line, frameOfBar, frameOfBeat} from '../../data/timing';
import {VERSE_WINDOW} from '../../data/contract';
import {BROWSER_CHROME_H} from '../../lib/chrome';
import {Car, ChequeredFlag, Chip, Fridge, PauseBadge, Sock, SpeechBubble, Wallet, bump, settle} from './props';

// Content area of the verse window in world px. The address bar has a border top and bottom (8 px) on top of
// BROWSER_CHROME_H.
export const CX0 = VERSE_WINDOW.x + SHAPE.stroke;
export const CY0 = VERSE_WINDOW.y + SHAPE.stroke + BROWSER_CHROME_H + 8;
export const CW = VERSE_WINDOW.w - 2 * SHAPE.stroke;
export const CH = VERSE_WINDOW.h - 2 * SHAPE.stroke - BROWSER_CHROME_H - 8;

// Start frame of a word in a line, by its text (case and punctuation ignored); nth match.
export const wf = (id: string, word: string, nth = 0) => {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const ws = wordsOf(line(id)).filter((w) => norm(w.w) === norm(word));
  if (!ws.length) throw new Error(`word ${word} not in ${id}`);
  return ws[Math.min(nth, ws.length - 1)].at;
};

const Fill: React.FC<{bg?: string; children?: React.ReactNode}> = ({bg = C.paper, children}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: CW, height: CH, background: bg, overflow: 'hidden'}}>{children}</div>
);

// ------------------------------------------------------------------ bar 4: glovebox home (ambient)

export const HomeScene: React.FC<{frame: number}> = ({frame}) => {
  const t = frame / FPS;
  return (
    <Fill>
      {Array.from({length: 7}, (_, i) => (
        <div key={i} style={{position: 'absolute', left: ((t * 900 + i * 330) % (CW + 600)) - 300, top: 80 + i * 95, width: 160 + hash(4, i) * 220, height: 8, borderRadius: 4, background: C.paper2}} />
      ))}
      <div style={{position: 'absolute', left: CW / 2 - 170, top: CH / 2 - 190}}>
        <Glyph name="glovebox" size={340} pose={0.75 + Math.sin(t * 9) * 0.12} />
      </div>
      {Array.from({length: 5}, (_, i) => {
        const x = ((t * 620 + i * 420) % (CW + 400)) - 200;
        const y = 90 + i * 130 + Math.sin(t * 5 + i) * 30;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, transform: `rotate(${t * 300 + i * 70}deg)`}}>
            <Glyph name="waffle" size={84} />
          </div>
        );
      })}
    </Fill>
  );
};

// ------------------------------------------------------------------ bar 5: the talking left shoe (literal)

export const SHOE_BUBBLE_AT = () => wf('v1.02', 'talking');

export const ShoeScene: React.FC<{frame: number}> = ({frame}) => {
  const l = line('v1.02');
  let mouth = 0;
  for (const w of wordsOf(l)) mouth = Math.max(mouth, bump(frame - w.at, 7));
  const talking = frame >= l.startFrame && frame <= l.endFrame + 4;
  const bubble = settle(frame, SHOE_BUBBLE_AT(), 8);
  const bob = talking ? Math.sin(frame * 0.9) * 6 : 0;
  return (
    <Fill bg={C.ink2}>
      {/* main tile: the left shoe */}
      <div style={{position: 'absolute', left: 36, top: 30, width: 1190, height: 600, background: C.paper2, border: outline(), borderRadius: SHAPE.radius, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 90, top: 150 + bob, transform: `rotate(${mouth * -4}deg)`, transformOrigin: '10% 90%'}}>
          <Glyph name="shoe" size={460} pose={mouth} />
        </div>
        <div style={{position: 'absolute', left: 20, bottom: 18}}>
          <Chip bg="paper" size={26}>
            <span style={{width: 16, height: 16, borderRadius: 8, background: C.pickle, border: outline(2)}} />
            Left Shoe {talking ? '(speaking)' : ''}
          </Chip>
        </div>
        <SpeechBubble x={600} y={70} w={540} size={58} tail="bottom-left" enter={bubble} text="what are the socks for?" rot={-2} />
      </div>
      {/* self view: the socks */}
      <div style={{position: 'absolute', left: 1256, top: 30, width: 400, height: 300, background: C.paper, border: outline(), borderRadius: SHAPE.radius, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 70, top: 40, display: 'flex', gap: 10}}>
          <Sock size={170} rot={-8} />
          <Sock size={170} rot={6} />
        </div>
        <div style={{position: 'absolute', left: 12, bottom: 10}}>
          <Chip size={20}>Socks (you)</Chip>
        </div>
      </div>
      <div style={{position: 'absolute', left: 1256, top: 356, width: 400, fontFamily: FONT.mono, fontWeight: 700, fontSize: 22, color: C.paper, lineHeight: 1.6}}>
        <div>● Left Shoe</div>
        <div>● Socks</div>
        <div style={{color: C.paper2}}>○ Right Shoe (away)</div>
      </div>
      {/* call controls */}
      <div style={{position: 'absolute', left: 0, top: 650, width: 1262, display: 'flex', justifyContent: 'center', gap: 28}}>
        {[C.paper, C.paper, C.tangerine].map((c, i) => (
          <div key={i} style={{width: i === 2 ? 130 : 76, height: 76, borderRadius: 38, background: c, border: outline(), boxShadow: hardShadow(5)}} />
        ))}
      </div>
    </Fill>
  );
};

// ------------------------------------------------------------------ search page (ambient bars)

export const SearchScene: React.FC<{frame: number; start: number; query: string; results: string[]; glyph?: TabSpec['glyph']}> = ({frame, start, query, results, glyph}) => {
  const typed = Math.floor(clamp((frame - start) / 14) * query.length);
  return (
    <Fill>
      <div style={{position: 'absolute', left: 120, top: 46, display: 'flex', alignItems: 'center', gap: 24}}>
        <div style={{fontFamily: FONT.display, fontWeight: 900, fontStretch: '125%', fontSize: 64, color: C.ink}}>
          <span style={{color: C.tangerine}}>s</span>
          <span style={{color: C.fizz}}>e</span>
          <span style={{color: C.pickle}}>a</span>
          <span style={{color: C.pink}}>r</span>
          <span style={{color: C.mustard}}>c</span>h
        </div>
        <div style={{width: 1180, height: 78, borderRadius: 39, border: outline(), background: C.paper, boxShadow: hardShadow(6), display: 'flex', alignItems: 'center', gap: 18, padding: '0 28px', boxSizing: 'border-box'}}>
          {glyph && <Glyph name={glyph} size={44} />}
          <span style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 34, color: C.ink, whiteSpace: 'nowrap'}}>
            {query.slice(0, typed)}
            <span style={{opacity: Math.floor(frame / 8) % 2 ? 1 : 0}}>|</span>
          </span>
        </div>
      </div>
      {results.map((r, i) => {
        const e = popIn(frame, start + 12 + i * 4, 8);
        return (
          <div key={i} style={{position: 'absolute', left: 300, top: 190 + i * 140, transform: `scale(${e})`, transformOrigin: 'left center'}}>
            <div style={{fontFamily: FONT.display, fontWeight: 800, fontSize: 38, color: C.ink}}>{r}</div>
            <div style={{marginTop: 12, width: 900 - (i % 2) * 180, height: 12, borderRadius: 6, background: C.paper2}} />
            <div style={{marginTop: 10, width: 640 + (i % 3) * 90, height: 12, borderRadius: 6, background: C.paper2}} />
          </div>
        );
      })}
    </Fill>
  );
};

// ------------------------------------------------------------------ bar 7-8: fridge opens, pickle parkour (literal)

const PK = [
  {x: 210, y: 430},
  {x: 680, y: 420},
  {x: 1010, y: 205},
  {x: 1200, y: 205},
  {x: 1430, y: 345},
  {x: 1540, y: 560},
];
const PK_T = [0, 0.2, 0.42, 0.55, 0.8, 1];
const PK_H = [200, 170, 0, 150, 120];
const PK_SPIN = [0, 360, 0, -360, 0];
const pickleAt = (u: number) => {
  let i = 0;
  while (i < PK_T.length - 2 && u > PK_T[i + 1]) i++;
  const s = clamp((u - PK_T[i]) / (PK_T[i + 1] - PK_T[i]));
  const run = PK_H[i] === 0;
  return {
    x: lerp(PK[i].x, PK[i + 1].x, s),
    y: lerp(PK[i].y, PK[i + 1].y, s) - PK_H[i] * 4 * s * (1 - s) + (run ? Math.abs(Math.sin(s * Math.PI * 4)) * -14 : 0),
    rot: (run ? 20 : -15) + PK_SPIN[i] * ease.inOutSine(s),
  };
};
export const FRIDGE_OPEN_AT = () => wf('v1.04', 'fridge');
export const PICKLE_GO = () => wf('v1.04', 'saw');
export const PICKLE_FREEZE = () => line('v1.05').startFrame;
const PICKLE_DUR = 47;
export const pickleU = (frame: number) => clamp((Math.min(frame, PICKLE_FREEZE()) - PICKLE_GO()) / PICKLE_DUR);
export const picklePos = (frame: number) => pickleAt(pickleU(frame));

export const FridgeScene: React.FC<{frame: number}> = ({frame}) => {
  const open = frame < FRIDGE_OPEN_AT() ? 0 : ease.outBack(clamp((frame - FRIDGE_OPEN_AT()) / 9), 1.4);
  const u = pickleU(frame);
  const p = pickleAt(u);
  const frozen = frame >= PICKLE_FREEZE();
  const trail = Array.from({length: 40}, (_, k) => pickleAt((u * k) / 39));
  return (
    <Fill>
      {/* floor line */}
      <div style={{position: 'absolute', left: 0, top: 700, width: CW, height: 60, background: C.paper2, borderTop: outline()}} />
      <Fridge x={60} y={160} open={open} />
      {/* the UI obstacle course */}
      <div style={{position: 'absolute', left: 560, top: 475, width: 240, height: 70, borderRadius: SHAPE.radius, background: C.tangerine, border: outline(), boxShadow: hardShadow(6), fontFamily: FONT.display, fontWeight: 800, fontSize: 28, color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        Add to cart
      </div>
      <div style={{position: 'absolute', left: 940, top: 260, width: 350, height: 250, background: C.paper, border: outline(), borderRadius: SHAPE.radius, boxShadow: hardShadow(), overflow: 'hidden'}}>
        <div style={{height: 40, background: C.fizz, borderBottom: outline(), display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px'}}>
          {[C.tangerine, C.mustard, C.pickle].map((c) => (
            <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c, border: outline(2)}} />
          ))}
        </div>
        <div style={{margin: 20, height: 12, width: 260, borderRadius: 6, background: C.paper2}} />
        <div style={{margin: 20, height: 12, width: 200, borderRadius: 6, background: C.paper2}} />
      </div>
      <div style={{position: 'absolute', left: 1340, top: 400, display: 'flex'}}>
        {[C.pink, C.mustard, C.pickle].map((c, i) => (
          <div key={i} style={{width: 70, height: 46, marginRight: -3, background: C.paper2, border: outline(3), borderBottom: 'none', borderRadius: '8px 8px 0 0', borderTop: `8px solid ${c}`}} />
        ))}
      </div>
      <div style={{position: 'absolute', left: 1430, top: 615, width: 220, height: 66, borderRadius: SHAPE.radius, background: C.pink, border: outline(), boxShadow: hardShadow(6), fontFamily: FONT.display, fontWeight: 800, fontSize: 28, color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        Subscribe
      </div>
      {/* dotted trajectory, so a still reads as a run of jumps */}
      {u > 0 && (
        <svg width={CW} height={CH} style={{position: 'absolute', left: 0, top: 0}}>
          <polyline points={trail.map((q) => `${q.x},${q.y}`).join(' ')} fill="none" stroke={C.pickle} strokeWidth={7} strokeDasharray="2 16" strokeLinecap="round" />
        </svg>
      )}
      {open > 0.1 && (
        <div style={{position: 'absolute', left: p.x - 65, top: p.y - 65, transform: `rotate(${p.rot}deg)`}}>
          <Glyph name="pickle" size={130} pose={0.5} />
        </div>
      )}
      <div style={{position: 'absolute', left: 24, top: 22}}>
        <Chip bg="paper" size={26}>
          <span style={{width: 16, height: 16, borderRadius: 8, background: C.tangerine, border: outline(2)}} />
          LIVE · fridge cam
        </Chip>
      </div>
      {/* video progress bar */}
      <div style={{position: 'absolute', left: 420, top: 724, width: 1180, height: 14, borderRadius: 7, background: C.paper, border: outline(3)}}>
        <div style={{width: `${18 + u * 50}%`, height: '100%', background: C.tangerine, borderRadius: 7}} />
      </div>
      <PauseBadge x={clamp(p.x, 360, CW - 360)} y={clamp(p.y + 190, 0, 600)} enter={frozen ? settle(frame, PICKLE_FREEZE(), 7) : 0} />
    </Fill>
  );
};

// ------------------------------------------------------------------ bar 8.5-9: the tab conference (ambient motif)

export const ConferenceScene: React.FC<{frame: number; count: number; named: Record<number, TabSpec>; newestPop: number}> = ({frame, count, named, newestPop}) => {
  const n = Math.min(count, 18);
  return (
    <Fill bg={C.paper2}>
      <div style={{position: 'absolute', left: 40, top: 26, fontFamily: FONT.display, fontWeight: 900, fontStretch: '125%', fontSize: 54, color: C.ink}}>
        brain.conf <span style={{fontFamily: FONT.mono, fontSize: 34, color: C.ink2}}>attendees: {count}</span>
      </div>
      <div style={{position: 'absolute', left: 1360, top: 18, transform: 'rotate(8deg)', background: C.mustard, border: outline(), borderRadius: SHAPE.radius, boxShadow: hardShadow(), padding: '6px 22px', fontFamily: FONT.display, fontWeight: 900, fontSize: 48, color: C.ink}}>
        -70%
      </div>
      {Array.from({length: n}, (_, i) => {
        const t = named[i] ?? fillerTab(i);
        const col = i % 6;
        const row = Math.floor(i / 6);
        const s = i === count - 1 ? newestPop : 1;
        return (
          <div key={i} style={{position: 'absolute', left: 40 + col * 272, top: 120 + row * 210, width: 250, height: 186, background: C.paper, border: outline(), borderRadius: SHAPE.radius, boxShadow: hardShadow(6), overflow: 'hidden', transform: `scale(${s})`}}>
            <div style={{height: 14, background: t.color ? C[t.color] : C.tangerine, borderBottom: outline(3)}} />
            <div style={{display: 'flex', justifyContent: 'center', marginTop: 16}}>{t.glyph && <Glyph name={t.glyph} size={84} pose={(frame / 20 + i * 0.2) % 1} />}</div>
            <div style={{textAlign: 'center', marginTop: 8, fontFamily: FONT.mono, fontWeight: 700, fontSize: 19, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', padding: '0 8px'}}>{t.title}</div>
          </div>
        );
      })}
    </Fill>
  );
};

// ------------------------------------------------------------------ bar 10: taxes | tacos split (ambient motif)

export const TaxTacoScene: React.FC<{frame: number}> = ({frame}) => {
  const a = settle(frame, wf('v1.07', 'taxes'), 8);
  const b = settle(frame, wf('v1.07', 'tacos'), 8);
  const half = (g: 'taxes' | 'taco', label: string, e: number, bg: string) => (
    <div style={{width: CW / 2, height: CH, background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20}}>
      <div style={{transform: `scale(${e})`}}>
        <Glyph name={g} size={340} />
      </div>
      <div style={{transform: `scale(${e})`, fontFamily: FONT.display, fontWeight: 900, fontStretch: '125%', fontSize: 84, color: C.ink, textTransform: 'uppercase'}}>{label}</div>
    </div>
  );
  return (
    <Fill>
      <div style={{display: 'flex'}}>
        {half('taxes', 'taxes', a, C.paper)}
        <div style={{width: 0, borderLeft: outline(6), height: CH}} />
        {half('taco', 'tacos', b, C.paper2)}
      </div>
    </Fill>
  );
};

// ------------------------------------------------------------------ bar 11: Costco-box boat tutorial (literal)

// hull: 3 boxes on the bottom row, 5 on the top row (wider at the top, like a hull)
const BOX = 118;
const SLOTS = [
  ...[0, 1, 2].map((i) => ({x: 700 + i * 100, y: 500})),
  ...[0, 1, 2, 3, 4].map((i) => ({x: 600 + i * 100, y: 420})),
];
export const BOAT_START = () => wf('v1.08', 'build');
export const BOAT_DONE = () => wf('v1.08', 'boxes');
export const BoatScene: React.FC<{frame: number}> = ({frame}) => {
  const t0 = BOAT_START();
  const t1 = wf('v1.08', 'out');
  const sailAt = t1 + 4;
  const floating = clamp((frame - sailAt) / 10);
  const bobY = Math.sin(frame * 0.18) * 10 * floating;
  const bobR = Math.sin(frame * 0.14 + 1) * 3 * floating;
  const driftX = Math.max(0, frame - sailAt) * 2.2;
  const t = frame / FPS;
  const wave = (yy: number, ph: number) =>
    `M0 ${yy} ` + Array.from({length: 18}, (_, k) => `Q${k * 100 + 50} ${yy + (k % 2 ? 16 : -16)} ${(k + 1) * 100} ${yy}`).join(' ') + ` V${CH} H0Z`;
  const step = frame < t0 ? 1 : frame < sailAt ? 2 : 3;
  return (
    <Fill>
      <div style={{position: 'absolute', left: 0, top: 0, width: CW, height: 118, background: C.paper2, borderBottom: outline(), display: 'flex', alignItems: 'center', gap: 22, padding: '0 34px', boxSizing: 'border-box'}}>
        <Glyph name="box" size={64} />
        <div style={{fontFamily: FONT.display, fontWeight: 900, fontStretch: '112%', fontSize: 46, color: C.ink}}>DIY: build a little boat out of boxes</div>
        <div style={{flex: 1}} />
        {['1 boxes', '2 stack', '3 float'].map((s, i) => (
          <Chip key={s} bg={i + 1 < step ? 'pickle' : i + 1 === step ? 'mustard' : 'paper'} size={24}>
            {i === 2 && <Glyph name="boat" size={30} pose={(frame / 30) % 1} />}
            {s}
          </Chip>
        ))}
      </div>
      <div style={{position: 'absolute', left: 1180, top: 150, fontFamily: FONT.mono, fontWeight: 800, fontSize: 30, color: C.ink2}}>bulk boxes x8 · tape x1</div>
      {/* the boat */}
      <div style={{position: 'absolute', left: 0, top: 0, width: CW, height: CH, transform: `translate(${driftX}px, ${bobY}px) rotate(${bobR}deg)`, transformOrigin: '900px 560px'}}>
        {floating > 0 && (
          <svg width={CW} height={CH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <g transform={`translate(900 ${430}) scale(${ease.outBack(floating)})`}>
              <path d="M0 0 V-250" stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
              <path d="M6 -244 L150 -40 H6Z" fill={C.paper} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
              <path d="M0 -250 L-70 -226 L0 -204Z" fill={C.tangerine} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
            </g>
          </svg>
        )}
        {SLOTS.map((s, i) => {
          const at = Math.round(lerp(t0, t1, i / (SLOTS.length - 1)));
          const k = frame < at - 8 ? 0 : ease.outBack(clamp((frame - (at - 8)) / 10), 1.6);
          const fromX = hash(55, i) * CW;
          const fromY = -200 - hash(56, i) * 200;
          if (frame < at - 8) return null;
          return (
            <div key={i} style={{position: 'absolute', left: lerp(fromX, s.x, k), top: lerp(fromY, s.y, k), transform: `rotate(${(1 - k) * 220}deg)`, zIndex: i < 3 ? 1 : 2}}>
              <Glyph name="box" size={BOX} />
            </div>
          );
        })}
      </div>
      {/* water in front of the hull bottom */}
      <svg width={CW} height={CH} style={{position: 'absolute', left: 0, top: 0}}>
        <path d={wave(590, t)} transform={`translate(${-((t * 120) % 200)} 0)`} fill={C.fizz} stroke={C.ink} strokeWidth={5} />
        <path d={wave(660, t)} transform={`translate(${-((t * 80 + 100) % 200)} 0)`} fill={C.fizz} stroke={C.ink} strokeWidth={4} />
      </svg>
    </Fill>
  );
};

// ------------------------------------------------------------------ bars 14-15: shopping cart Formula One (literal)

const CART_KEYS = (): [number, number, number][] => {
  const a = frameOfBar(14);
  const d = wf('v1.11', 'drifting');
  return [
    [a, -420, 0],
    [d, 520, -6],
    [d + 14, 760, -22],
    [frameOfBar(15), 900, -14],
    [wf('v1.12', 'one') + 4, 1040, -20],
    [wf('v1.12', 'store'), 1300, -8],
    [frameOfBar(16), 1420, -2],
  ];
};
const cartAt = (frame: number) => {
  const K = CART_KEYS();
  if (frame <= K[0][0]) return {x: K[0][1], rot: K[0][2]};
  for (let i = 0; i < K.length - 1; i++) {
    if (frame <= K[i + 1][0]) {
      const s = ease.inOutSine(prog(frame, K[i][0], K[i + 1][0]));
      return {x: lerp(K[i][1], K[i + 1][1], s), rot: lerp(K[i][2], K[i + 1][2], s)};
    }
  }
  const L = K[K.length - 1];
  return {x: L[1], rot: L[2]};
};
export const FLAG_AT = () => wf('v1.12', 'formula');

const PRODUCTS = Array.from({length: 3}, (_, row) =>
  Array.from({length: 21}, (_, i) => ({
    x: 10 + i * 81 + hash(row * 7 + 1, i) * 10,
    w: 40 + hash(row * 7 + 2, i) * 30,
    h: 50 + hash(row * 7 + 3, i) * 50,
    c: [C.pickle, C.fizz, C.pink, C.mustard, C.tangerine, C.paper][Math.floor(hash(row * 7 + 4, i) * 6)],
    round: hash(row * 7 + 5, i) > 0.7,
  })),
);

export const CartScene: React.FC<{frame: number}> = ({frame}) => {
  const c = cartAt(frame);
  const cy = 560;
  const t = frame / FPS;
  const lapStart = frameOfBar(14);
  const secs = 41.207 + (frame - lapStart) / FPS;
  const timer = `1:${secs.toFixed(3).padStart(6, '0')}`;
  const moving = Math.abs(cartAt(frame).x - cartAt(frame - 2).x) / 2;
  const flag = settle(frame, FLAG_AT(), 10);
  const skidFrom = Math.max(-300, cartAt(wf('v1.11', 'drifting')).x);
  return (
    <Fill>
      {/* shelves */}
      <svg width={CW} height={CH} style={{position: 'absolute', left: 0, top: 0}}>
        {PRODUCTS.map((row, r) => {
          const base = 150 + r * 130;
          return (
            <g key={r}>
              {row.map((p, i) =>
                p.round ? (
                  <circle key={i} cx={p.x + p.w / 2} cy={base - p.w / 2} r={p.w / 2} fill={p.c} stroke={C.ink} strokeWidth={3} />
                ) : (
                  <rect key={i} x={p.x} y={base - p.h} width={p.w} height={p.h} rx={5} fill={p.c} stroke={C.ink} strokeWidth={3} />
                ),
              )}
              <rect x={-10} y={base} width={CW + 20} height={16} fill={C.ink2} stroke={C.ink} strokeWidth={3} />
            </g>
          );
        })}
        {/* floor */}
        <rect x={0} y={460} width={CW} height={CH - 460} fill={C.paper2} stroke={C.ink} strokeWidth={4} />
        {Array.from({length: 12}, (_, i) => (
          <line key={i} x1={i * 160 - 40} y1={460} x2={i * 160 - 140} y2={CH} stroke={C.paper} strokeWidth={4} />
        ))}
        {/* finish line */}
        {Array.from({length: 16}, (_, k) => (
          <rect key={k} x={1290 + (k % 2) * 30} y={462 + Math.floor(k / 2) * 37} width={30} height={37} fill={(k + Math.floor(k / 2)) % 2 ? C.ink : C.paper} />
        ))}
        {/* skid marks */}
        {c.x > skidFrom &&
          [0, 1].map((k) => (
            <path
              key={k}
              d={`M${skidFrom} ${640 + k * 46} C${(skidFrom + c.x) / 2} ${610 + k * 46 + 60}, ${(skidFrom + c.x) / 2 + 80} ${600 + k * 46}, ${c.x - 60} ${cy + 80 + k * 30}`}
              fill="none"
              stroke={C.ink2}
              strokeWidth={12}
              strokeLinecap="round"
            />
          ))}
      </svg>
      {/* aisle sign */}
      <div style={{position: 'absolute', left: CW / 2 - 200, top: -10, width: 400}}>
        <div style={{display: 'flex', justifyContent: 'space-between', padding: '0 70px'}}>
          <div style={{width: 6, height: 40, background: C.ink}} />
          <div style={{width: 6, height: 40, background: C.ink}} />
        </div>
        <div style={{background: C.mustard, border: outline(SHAPE.stroke + 1), borderRadius: SHAPE.radius, boxShadow: hardShadow(), textAlign: 'center', fontFamily: FONT.display, fontWeight: 900, fontStretch: '125%', fontSize: 72, color: C.ink, padding: '4px 0', transform: `rotate(${Math.sin(t * 4) * 2}deg)`}}>
          AISLE 4
        </div>
      </div>
      {/* speed lines */}
      {moving > 2 &&
        Array.from({length: 6}, (_, i) => (
          <div key={i} style={{position: 'absolute', left: c.x - 260 - hash(8, i) * 260 - ((frame * 30 + i * 70) % 120), top: cy - 90 + i * 34, width: 140 + hash(9, i) * 200, height: 9, borderRadius: 5, background: C.ink}} />
        ))}
      {/* tyre smoke */}
      {Array.from({length: 6}, (_, k) => {
        const q = cartAt(frame - (k + 1) * 3);
        if (moving < 2) return null;
        const r = 24 + k * 10;
        return <div key={k} style={{position: 'absolute', left: q.x - 150 - r, top: cy + 70 - r - k * 6, width: r * 2, height: r * 2, borderRadius: r, background: C.paper, border: outline(3), opacity: 1 - k / 6}} />;
      })}
      {/* the cart, F1 spec: rear wing, number roundel */}
      <div style={{position: 'absolute', left: c.x - 170, top: cy - 170, width: 340, height: 340, transform: `rotate(${c.rot}deg)`}}>
        <svg width={340} height={340} viewBox="0 0 64 64" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <path d="M2 10 V2 H14 V10 M8 2 V12" fill={C.tangerine} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
          <rect x={-2} y={-1} width={20} height={5} rx={1.5} fill={C.tangerine} stroke={C.ink} strokeWidth={2.5} />
        </svg>
        <Glyph name="cart" size={340} pose={(frame / 6) % 1} />
        <div style={{position: 'absolute', left: 168, top: 128, width: 70, height: 70, borderRadius: 35, background: C.paper, border: outline(), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.display, fontWeight: 900, fontSize: 48, color: C.ink}}>1</div>
      </div>
      <ChequeredFlag x={1460} y={130} t={t} enter={flag} pole={380} />
      {/* race HUD */}
      <div style={{position: 'absolute', left: 22, top: 20, background: C.ink, border: outline(), borderRadius: SHAPE.radius, padding: '10px 20px', color: C.paper, fontFamily: FONT.mono, fontWeight: 800}}>
        <div style={{fontFamily: FONT.display, fontWeight: 900, fontStretch: '125%', fontSize: 30, color: C.mustard}}>GROCERY GP</div>
        <div style={{fontSize: 26}}>LAP 3/3</div>
        <div style={{fontSize: 34, color: C.paper}}>{timer}</div>
      </div>
      <div style={{position: 'absolute', right: 22, top: 20, background: C.tangerine, border: outline(), borderRadius: SHAPE.radius, boxShadow: hardShadow(6), padding: '0 22px', fontFamily: FONT.display, fontWeight: 900, fontStretch: '125%', fontSize: 92, color: C.ink}}>P1</div>
      <div style={{position: 'absolute', left: 22, bottom: 20}}>
        <Chip bg="ink" color="mustard" size={30}>
          {Math.round(180 + moving * 3)} KM/H
        </Chip>
      </div>
      {frame >= wf('v1.11', 'drifting') && frame < frameOfBar(15) && (
        <div style={{position: 'absolute', left: c.x - 40, top: cy - 300, transform: `translate(-50%,0) rotate(-6deg) scale(${settle(frame, wf('v1.11', 'drifting'), 7)})`, background: C.pink, border: outline(), borderRadius: SHAPE.radius, boxShadow: hardShadow(6), padding: '2px 18px', fontFamily: FONT.display, fontWeight: 900, fontStretch: '125%', fontSize: 52, color: C.ink}}>
          DRIFT!
        </div>
      )}
    </Fill>
  );
};

// ------------------------------------------------------------------ bars 16-17: glovebox inventory (receipts, crumbs are debris)

export const InventoryScene: React.FC<{frame: number}> = ({frame}) => {
  const rows = ['receipts · a month old', 'crumbs · in the car', 'confetti · yes', 'maps · 0'];
  return (
    <Fill>
      <div style={{position: 'absolute', left: 60, top: 40, fontFamily: FONT.display, fontWeight: 900, fontStretch: '125%', fontSize: 56, color: C.ink}}>glovebox inventory</div>
      {rows.map((r, i) => (
        <div key={r} style={{position: 'absolute', left: 60, top: 140 + i * 66, display: 'flex', alignItems: 'center', gap: 16, fontFamily: FONT.mono, fontWeight: 700, fontSize: 32, color: C.ink}}>
          <div style={{width: 30, height: 30, borderRadius: 6, border: outline(3), background: i < 2 ? C.mustard : C.paper}} />
          {r}
        </div>
      ))}
      <Wallet x={170} y={520} w={320} open={0.6 + Math.sin(frame * 0.3) * 0.1} />
      <Car x={1150} y={520} w={440} />
    </Fill>
  );
};

// ------------------------------------------------------------------ bars 18-19: the judgmental dog (literal, world space)

export const DOG_WIN = {x: 330, y: 230, w: 640, h: 590};
export const DogWindow: React.FC<{frame: number; enter: number}> = ({frame, enter}) => {
  const brow = clamp((frame - wf('v1.15', 'judgmental')) / 8) + Math.max(0, Math.sin(frame * 0.25)) * 0.15 * clamp((frame - wf('v1.16', 'man')) / 6);
  const caption = settle(frame, wf('v1.15', 'window'), 8);
  if (enter <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, transform: `scale(${enter})`, transformOrigin: `${DOG_WIN.x + DOG_WIN.w / 2}px ${DOG_WIN.y + DOG_WIN.h / 2}px`}}>
      <div style={{position: 'absolute', left: DOG_WIN.x, top: DOG_WIN.y, width: DOG_WIN.w, height: DOG_WIN.h, background: C.paper, border: outline(), borderRadius: SHAPE.radius, boxShadow: hardShadow(), overflow: 'hidden'}}>
        <div style={{height: 52, background: C.paper2, borderBottom: outline(), display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', fontFamily: FONT.display, fontWeight: 800, fontSize: 24, color: C.ink}}>
          {[C.tangerine, C.mustard, C.pickle].map((c) => (
            <div key={c} style={{width: 20, height: 20, borderRadius: 10, background: c, border: outline(3)}} />
          ))}
          <Glyph name="dog" size={30} />
          <span>window</span>
        </div>
        {/* a house window: panes behind the dog, sill in front */}
        <div style={{position: 'absolute', left: 30, top: 80, right: 30, bottom: 100, background: C.fizz, border: outline(), borderRadius: SHAPE.radiusSmall}}>
          <div style={{position: 'absolute', left: '50%', top: 0, bottom: 0, borderLeft: outline(6)}} />
          <div style={{position: 'absolute', top: '45%', left: 0, right: 0, borderTop: outline(6)}} />
        </div>
        <div style={{position: 'absolute', left: 120, top: 120}}>
          <Glyph name="dog" size={400} pose={clamp(brow)} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 60, height: 50, background: C.ink2, borderTop: outline(), borderBottom: outline()}} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 8, display: 'flex', justifyContent: 'center', transform: `scale(${caption})`}}>
          <Chip bg="mustard" size={26}>
            status: judging you
          </Chip>
        </div>
      </div>
    </div>
  );
};

