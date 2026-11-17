// Verse 2 tab pages (local coords inside the browser content area, CW x CH). Drawn on the library chrome/glyphs.
import React from 'react';
import {C, FONT, SHAPE, hardShadow, outline, ColorName} from '../../lib/theme';
import {Glyph, GlyphName} from '../../lib/glyphs';
import {Cursor, NotesApp, Popup, TabSpec} from '../../lib/chrome';
import {beatPulse, clamp, ease, popIn, wobble} from '../../lib/motion';
import {hash, seedOf} from '../../lib/rng';
import {CUE, CW, CH} from './cues';

const label = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: FONT.display,
  fontWeight: 900,
  fontStretch: '125%',
  fontSize: size,
  color: C.ink,
  textTransform: 'uppercase',
  lineHeight: 1,
  ...extra,
});
const chip = (bg: ColorName, extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: 'absolute',
  background: C[bg],
  border: outline(),
  borderRadius: SHAPE.radiusSmall,
  boxShadow: hardShadow(5),
  padding: '8px 18px',
  whiteSpace: 'nowrap',
  ...extra,
});

// ------------------------------------------------------------------ v2.01 spoon in the pencil drawer

const DR = {x: 196, y: 50, w: 1300, h: 600};
const ROW_H = 98;
const SLOT = (row: number, col: number) => ({x: DR.x + 60 + col * 610 + 280, y: DR.y + 70 + row * ROW_H + 30});
export const SPOON_SLOT = {row: 2, col: 1};
export const SPOON_LOCAL = SLOT(SPOON_SLOT.row, SPOON_SLOT.col);

export const DrawerPage: React.FC<{frame: number}> = ({frame}) => {
  const pulse = beatPulse(frame, 0.5);
  const items: React.ReactNode[] = [];
  for (let row = 0; row < 5; row++)
    for (let col = 0; col < 2; col++) {
      const p = SLOT(row, col);
      const spoon = row === SPOON_SLOT.row && col === SPOON_SLOT.col;
      const jig = spoon ? wobble(frame, 41, 6) : (hash(seedOf('pencil'), row * 2 + col) - 0.5) * 4;
      const size = spoon ? 430 : 480;
      items.push(
        <div key={`${row}-${col}`} style={{position: 'absolute', left: p.x - size / 2, top: p.y - size / 2, width: size, height: size, transform: `rotate(${(spoon ? -45 : 45) + jig}deg) scale(${spoon ? 1 + pulse * 0.05 : 1})`, zIndex: spoon ? 3 : 1}}>
          <Glyph name={spoon ? 'spoon' : 'pencil'} size={size} />
        </div>,
      );
    }
  const sp = SPOON_LOCAL;
  return (
    <div style={{position: 'absolute', inset: 0, background: C.paper}}>
      {/* the drawer, seen from above: tray, then the front panel with its label */}
      <div style={{position: 'absolute', left: DR.x, top: DR.y, width: DR.w, height: DR.h, background: C.paper2, border: outline(SHAPE.stroke + 2), borderRadius: SHAPE.radius, boxShadow: hardShadow()}} />
      <div style={{position: 'absolute', left: DR.x + 24, top: DR.y + 24, width: DR.w - 48, height: DR.h - 48, border: outline(SHAPE.thin), borderRadius: SHAPE.radiusSmall}} />
      {items}
      <div style={{position: 'absolute', left: sp.x - 150, top: sp.y - 95, width: 300, height: 190, borderRadius: '50%', border: `${7 + pulse * 4}px dashed ${C.fizz}`, zIndex: 4}} />
      <div style={{...chip('pink', {left: sp.x + 120, top: sp.y - 150, transform: `rotate(6deg) scale(${popIn(frame, CUE.start - 4, 8)})`, zIndex: 5}), ...label(40)}}>spoon?!</div>
      <div style={{position: 'absolute', left: DR.x - 20, top: DR.y + DR.h - 30, width: DR.w + 40, height: 96, background: C.mustard, border: outline(SHAPE.stroke + 2), borderRadius: SHAPE.radius, boxShadow: hardShadow(), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, zIndex: 6}}>
        <span style={label(52)}>Pencil drawer</span>
        <div style={{width: 160, height: 26, borderRadius: 13, background: C.ink2, border: outline()}} />
      </div>
      <div style={{...chip('paper', {left: DR.x + 30, top: 4, zIndex: 6}), fontFamily: FONT.mono, fontWeight: 800, fontSize: 26, color: C.ink}}>pencils: 9 · spoons: 1 (??)</div>
      <Cursor x={sp.x + 110} y={sp.y + 40} kind="pointer" scale={2.4} press={clamp(1 - Math.abs(frame - CUE.drawerTight) / 8)} />
    </div>
  );
};

// ------------------------------------------------------------------ v2.02 one plan, then twelve more

const PLANS = ['THE PLAN', ...'BCDEFGHIJKLM'.split('').map((l) => `plan ${l}`)];
export const PlansPage: React.FC<{frame: number}> = ({frame}) => {
  let visible = frame >= CUE.planFirst ? 1 : 0;
  for (let i = 1; i < PLANS.length; i++) {
    const at = CUE.planMoreFrom + ((i - 1) / (PLANS.length - 2)) * (CUE.planMoreTo - CUE.planMoreFrom);
    if (frame >= at) visible = i + 1;
  }
  const done = visible >= PLANS.length;
  const doneAt = CUE.planMoreTo;
  return (
    <div style={{position: 'absolute', inset: 0, background: C.paper}}>
      <NotesApp x={(CW - 860) / 2} y={4} w={860} h={CH - 10} title={`plan.txt — ${visible} plan${visible === 1 ? '' : 's'}`} lines={PLANS} visible={Math.max(1, visible)} />
      {done && (
        <div style={{...chip('tangerine', {right: 70, top: 200, transform: `rotate(8deg) scale(${popIn(frame, doneAt, 8)})`}), ...label(56)}}>
          +12 more
        </div>
      )}
      <div style={{position: 'absolute', left: 60, top: 240, transform: 'rotate(-6deg)'}}>
        <Glyph name="notebook" size={200} />
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ v2.07 a sneeze through a library

type Book = {x: number; y0: number; w: number; h: number; color: ColorName; vx: number; vy: number; spin: number};
const SHELVES = [210, 360, 510, 660];
const FLOOR = CH - 6;
const BOOK_COLORS: ColorName[] = ['tangerine', 'pickle', 'fizz', 'pink', 'mustard', 'paper2'];
const BOOKS: Book[] = (() => {
  const s = seedOf('v2-books');
  const out: Book[] = [];
  SHELVES.forEach((sy, r) => {
    let x = 150;
    let i = 0;
    while (x < 1540) {
      const k = r * 100 + i++;
      const w = 34 + hash(s, k) * 26;
      const h = 82 + hash(s + 1, k) * 40;
      out.push({x: x + w / 2, y0: sy - h / 2, w, h, color: BOOK_COLORS[Math.floor(hash(s + 2, k) * BOOK_COLORS.length)], vx: 4 + hash(s + 3, k) * 12, vy: -(6 + hash(s + 4, k) * 16), spin: (hash(s + 5, k) - 0.3) * 30});
      x += w + 3;
    }
  });
  return out;
})();
const SNEEZE_X0 = 60;
const SNEEZE_X1 = 1650;
export const sneezeX = (frame: number) => SNEEZE_X0 + (SNEEZE_X1 - SNEEZE_X0) * clamp((frame - CUE.sneezeFrom) / (CUE.sneezeTo - CUE.sneezeFrom));
const hitFrame = (x: number) => CUE.sneezeFrom + ((x - SNEEZE_X0) / (SNEEZE_X1 - SNEEZE_X0)) * (CUE.sneezeTo - CUE.sneezeFrom);

export const LibraryPage: React.FC<{frame: number}> = ({frame}) => {
  const sx = sneezeX(frame);
  const passing = frame >= CUE.sneezeFrom && frame <= CUE.sneezeTo + 10;
  const G = 1.6;
  const signHit = hitFrame(1180);
  const signRot = frame < signHit ? -3 : -3 + 28 * ease.outElastic(clamp((frame - signHit) / 16));
  return (
    <div style={{position: 'absolute', inset: 0, background: C.paper}}>
      <div style={{position: 'absolute', left: 120, top: 26, ...label(64)}}>City Library</div>
      <div style={{...chip('mustard', {left: 1100, top: 22, transform: `rotate(${signRot}deg)`, transformOrigin: '10% 10%'}), ...label(40)}}>Quiet please · shhh</div>
      {SHELVES.map((sy) => (
        <div key={sy} style={{position: 'absolute', left: 120, top: sy, width: 1450, height: 18, background: C.ink2, border: outline(), borderRadius: 4}} />
      ))}
      <div style={{position: 'absolute', left: 0, top: FLOOR, width: CW, height: 10, background: C.ink2}} />
      {BOOKS.map((b, i) => {
        const th = hitFrame(b.x);
        const d = frame - th;
        let x = b.x, y = b.y0, rot = 0;
        if (d > 0) {
          const floorY = FLOOR - b.w / 2;
          const tLand = (-b.vy + Math.sqrt(b.vy * b.vy + 2 * G * (floorY - b.y0))) / G;
          const t = Math.min(d, tLand);
          x = b.x + b.vx * t;
          y = b.y0 + b.vy * t + 0.5 * G * t * t;
          rot = d >= tLand ? 90 + b.spin : b.spin * t;
        }
        return <div key={i} style={{position: 'absolute', left: x - b.w / 2, top: y - b.h / 2, width: b.w, height: b.h, background: C[b.color], border: outline(SHAPE.thin), borderRadius: 3, boxSizing: 'border-box', transform: `rotate(${rot}deg)`}} />;
      })}
      {passing && (
        <>
          {[0, 1, 2].map((k) => (
            <div key={k} style={{position: 'absolute', left: sx - 520 + k * 40, top: 300 + k * 90, width: 380, height: 12, borderRadius: 6, background: C.ink}} />
          ))}
          <div style={{position: 'absolute', left: sx - 130, top: 300 + wobble(frame, 9, 14), transform: `rotate(${wobble(frame, 10, 8)}deg)`}}>
            <Glyph name="sneeze" size={260} />
          </div>
          <div style={{position: 'absolute', left: sx - 470, top: 150, transform: `rotate(-8deg) scale(${popIn(frame, CUE.sneezeFrom, 6)})`, ...label(120, {color: C.tangerine, WebkitTextStroke: `4px ${C.ink}`})}}>ACHOO!</div>
        </>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ v2.11 three missed calls from an unknown zone

export const PhonePage: React.FC<{frame: number}> = ({frame}) => {
  const calls = [0, 1, 2].filter((i) => frame >= CUE.call(i)).length;
  return (
    <div style={{position: 'absolute', inset: 0, background: C.paper}}>
      <div style={{position: 'absolute', left: 120, top: 110, transform: `rotate(${wobble(frame, 77, 3) + (calls ? Math.sin(frame * 1.7) * 3 : 0)}deg)`}}>
        <Glyph name="phone" size={460} pose={0.5} />
        {calls > 0 && (
          <div style={{position: 'absolute', left: 330, top: 0, width: 110, height: 110, borderRadius: 55, background: C.tangerine, border: outline(), boxShadow: hardShadow(5), display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${popIn(frame, CUE.call(calls - 1), 6)})`, ...label(64)}}>
            {calls}
          </div>
        )}
      </div>
      <div style={{...chip('mustard', {left: 210, top: 600}), fontFamily: FONT.mono, fontWeight: 800, fontSize: 34, color: C.ink}}>battery: 50%</div>
      {[0, 1, 2].map((i) => (
        <Popup key={i} x={1060 + i * 36} y={170 + i * 200} w={700} title={`Missed call (${i + 1})`} body={<span>from <b>UNKNOWN ZONE</b></span>} buttons={['Ignore', 'Call back']} glyph="phone" color="pink" enter={popIn(frame, CUE.call(i), 7)} rot={(i - 1) * 2} />
      ))}
    </div>
  );
};

// ------------------------------------------------------------------ generic tab page for montage beats

export const TabPage: React.FC<{tab: TabSpec; index: number; count: number}> = ({tab, index, count}) => {
  const s = seedOf('v2-page');
  const glyph: GlyphName = tab.glyph ?? 'popper';
  return (
    <div style={{position: 'absolute', inset: 0, background: C.paper}}>
      <div style={{position: 'absolute', left: 120, top: 60, width: 220, height: 220, background: C[tab.color ?? 'paper2'], border: outline(), borderRadius: SHAPE.radius, boxShadow: hardShadow(), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Glyph name={glyph} size={170} />
      </div>
      <div style={{position: 'absolute', left: 390, top: 90, ...label(84)}}>{tab.title}</div>
      <div style={{position: 'absolute', left: 394, top: 200, fontFamily: FONT.mono, fontWeight: 700, fontSize: 30, color: C.ink2}}>tab {index + 1} of {count}</div>
      {Array.from({length: 4}, (_, k) => (
        <div key={k} style={{position: 'absolute', left: 120 + k * 370, top: 340, width: 330, height: 330, background: k % 2 ? C.paper2 : C.paper, border: outline(), borderRadius: SHAPE.radius}}>
          <div style={{position: 'absolute', left: 24, top: 24}}>
            <Glyph name={glyph} size={90} pose={hash(s, index * 4 + k)} />
          </div>
          {[0, 1, 2].map((r) => (
            <div key={r} style={{position: 'absolute', left: 24, top: 160 + r * 44, width: 140 + hash(s + 1, index * 12 + k * 3 + r) * 140, height: 18, borderRadius: 9, background: r === 0 ? C.ink2 : C.paper2, border: r === 0 ? 'none' : outline(SHAPE.thin)}} />
          ))}
        </div>
      ))}
    </div>
  );
};
