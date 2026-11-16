// Verse 3 content scenes. Each one fills the browser content area (local px, size w x h) for one tab.
// Every value is a pure function of the GLOBAL frame and of anchors passed in from Section.tsx (no frame numbers here).
import React from 'react';
import {Glyph, GlyphName} from '../../lib/glyphs';
import {TabSpec, fillerTab} from '../../lib/chrome';
import {C, FONT, SHAPE, hardShadow, outline, ColorName} from '../../lib/theme';
import {clamp, ease, lerp, popIn, prog} from '../../lib/motion';
import {hash, noise1} from '../../lib/rng';

type Box = {frame: number; w: number; h: number};

// ------------------------------------------------------------------ shared bits

// A sticker label: the words a gag needs, living in the picture (validation stills hide lyric cards).
export const Sign: React.FC<{x: number; y: number; text: string; color?: ColorName; size?: number; rot?: number; scale?: number; glyph?: GlyphName}> = ({
  x,
  y,
  text,
  color = 'mustard',
  size = 34,
  rot = 0,
  scale = 1,
  glyph,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`,
      background: C[color],
      border: outline(),
      borderRadius: SHAPE.radiusSmall,
      boxShadow: hardShadow(6),
      padding: `${size * 0.16}px ${size * 0.42}px`,
      fontFamily: FONT.display,
      fontWeight: 900,
      fontStretch: '125%',
      fontSize: size,
      lineHeight: 1.05,
      color: C.ink,
      whiteSpace: 'nowrap',
      textTransform: 'uppercase',
      display: 'flex',
      alignItems: 'center',
      gap: size * 0.3,
    }}
  >
    {glyph && <Glyph name={glyph} size={size * 1.2} />}
    {text}
  </div>
);

// Weather-app alert strip across the top of a scene.
const AlertBar: React.FC<{w: number; text: string; glyph: GlyphName; frame: number; at: number}> = ({w, text, glyph, frame, at}) => {
  const blink = Math.floor((frame - at) / 7) % 2 === 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: w,
        height: 62,
        background: blink ? C.mustard : C.tangerine,
        borderBottom: outline(),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        fontFamily: FONT.display,
        fontWeight: 900,
        fontStretch: '125%',
        fontSize: 34,
        color: C.ink,
        zIndex: 5,
      }}
    >
      <Glyph name={glyph} size={40} />
      {text}
      <Glyph name={glyph} size={40} />
    </div>
  );
};

const PLANE_PATH = 'M4 34 L60 8 L40 56 L30 38Z';

// ------------------------------------------------------------------ v3.01: a paper plane lands on a tennis court

export const CourtScene: React.FC<Box & {start: number; touchdown: number}> = ({frame, w, h, start, touchdown}) => {
  const cw = 1180;
  const chh = 560;
  const cx = (w - cw) / 2;
  const cy = (h - chh) / 2 + 30;
  // approach: from above the top-left, descending (bigger = higher), touches down on "court", then skids to a stop
  const a = prog(frame, start - 6, touchdown);
  const ea = ease.inOutSine(a);
  const skid = ease.outCubic(prog(frame, touchdown, touchdown + 14));
  const land = {x: cx + 330, y: cy + chh * 0.5};
  const stop = {x: cx + 520, y: cy + chh * 0.5};
  const air = {x: lerp(cx - 260, land.x, ea), y: lerp(cy - 160, land.y, ea)};
  const px = frame < touchdown ? air.x : lerp(land.x, stop.x, skid);
  const py = frame < touchdown ? air.y : lerp(land.y, stop.y, skid);
  const alt = frame < touchdown ? 1 - ea : 0; // 1 high, 0 on the court
  const size = 190 * (1 + alt * 0.9);
  const bump = frame >= touchdown ? Math.sin(clamp((frame - touchdown) / 8) * Math.PI) * 10 : 0;
  const rot = frame < touchdown ? 38 : lerp(38, 22, skid);
  const sh = alt * 120; // shadow offset grows with altitude
  const lines = C.paper;
  return (
    <div style={{position: 'absolute', inset: 0, background: C.tangerine}}>
      {/* clay surround, green court, paper lines, net */}
      <div style={{position: 'absolute', left: cx, top: cy, width: cw, height: chh, background: C.pickle, border: outline(), boxShadow: hardShadow()}} />
      <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0}}>
        <g stroke={lines} strokeWidth={8} fill="none">
          <rect x={cx + 40} y={cy + 40} width={cw - 80} height={chh - 80} />
          <path d={`M${cx + 40} ${cy + 110} H${cx + cw - 40} M${cx + 40} ${cy + chh - 110} H${cx + cw - 40}`} />
          <path d={`M${cx + 300} ${cy + 110} V${cy + chh - 110} M${cx + cw - 300} ${cy + 110} V${cy + chh - 110}`} />
          <path d={`M${cx + 300} ${cy + chh / 2} H${cx + cw - 300}`} />
        </g>
        <path d={`M${cx + cw / 2} ${cy - 18} V${cy + chh + 18}`} stroke={C.ink} strokeWidth={10} strokeDasharray="4 10" />
        <circle cx={cx + cw / 2} cy={cy - 18} r={9} fill={C.paper} stroke={C.ink} strokeWidth={4} />
        <circle cx={cx + cw / 2} cy={cy + chh + 18} r={9} fill={C.paper} stroke={C.ink} strokeWidth={4} />
        {/* tennis balls lying about */}
        <circle cx={cx + cw - 180} cy={cy + 170} r={13} fill={C.mustard} stroke={C.ink} strokeWidth={3.5} />
        <circle cx={cx + cw - 240} cy={cy + chh - 150} r={13} fill={C.mustard} stroke={C.ink} strokeWidth={3.5} />
        {/* skid marks after touchdown */}
        {frame >= touchdown && (
          <g stroke={C.ink2} strokeWidth={7} strokeLinecap="round">
            <path d={`M${land.x - 40} ${land.y + 34} L${px - 50} ${py + 34}`} />
            <path d={`M${land.x - 20} ${land.y + 60} L${px - 30} ${py + 60}`} />
          </g>
        )}
        {/* plane shadow: same shape, ink2, offset by altitude */}
        <g transform={`translate(${px - size / 2 + sh * 0.6} ${py - size / 2 + sh}) scale(${size / 64}) rotate(${rot} 32 32)`}>
          <path d={PLANE_PATH} fill={C.ink2} />
        </g>
      </svg>
      <div style={{position: 'absolute', left: px - size / 2, top: py - size / 2 - bump, transform: `rotate(${rot}deg)`}}>
        <Glyph name="plane" size={size} />
      </div>
      <Sign x={cx + 170} y={cy - 4} text="court 3" color="paper" size={30} rot={-3} glyph="tennis" />
      <Sign x={cx + cw - 250} y={cy + chh + 10} text="now landing: paper plane" color="mustard" size={28} rot={2} glyph="plane" scale={popIn(frame, start, 8)} />
    </div>
  );
};

// ------------------------------------------------------------------ v3.05: a houseplant THRIVING in a thunderstorm

// The plant's own face and extra leaves, drawn in the plant glyph's 64x64 space.
const LEAVES = [
  'M32 30 C22 34 10 32 6 24 C14 18 26 22 32 30Z',
  'M32 18 C26 10 26 0 32 -6 C38 0 38 10 32 18Z',
  'M32 28 C42 30 54 26 60 16 C50 12 38 18 32 28Z',
  'M32 36 C24 40 14 44 8 40 C14 32 26 32 32 36Z',
];

export const StormScene: React.FC<Box & {flashes: number[]; start: number}> = ({frame, w, h, flashes, start}) => {
  const hit = flashes.filter((f) => frame >= f).length; // flashes so far
  const last = hit > 0 ? flashes[hit - 1] : -999;
  const since = frame - last;
  const flash = hit > 0 && since < 5 ? 1 - since / 5 : 0;
  // grows a step on every flash, flexing (overshoot) as it lands
  const grow = 1 + flashes.reduce((s, f) => s + 0.11 * ease.outBack(clamp((frame - f) / 9), 2.6), 0);
  const sway = (frame / 34) % 1;
  const size = 330 * grow;
  const groundY = h - 70;
  const px = w / 2 - 60;
  const t = frame / 30;
  return (
    <div style={{position: 'absolute', inset: 0, background: C.ink, overflow: 'hidden'}}>
      {/* rain: fizz streaks, closed-form */}
      <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0}}>
        {Array.from({length: 46}, (_, i) => {
          const sp = 900 + hash(51, i) * 500;
          const y = ((hash(52, i) * (h + 120) + t * sp) % (h + 120)) - 60;
          const x = ((hash(53, i) * (w + 200) - t * sp * 0.25) % (w + 200) + w + 200) % (w + 200) - 100;
          return <path key={i} d={`M${x} ${y} l-14 44`} stroke={C.fizz} strokeWidth={6} strokeLinecap="round" />;
        })}
        <rect x={0} y={groundY} width={w} height={h - groundY} fill={C.ink2} stroke={C.ink} strokeWidth={4} />
      </svg>
      {/* storm clouds along the top */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{position: 'absolute', left: -40 + i * (w / 4.4) + noise1(60 + i, t) * 20, top: 40 + (i % 2) * 34}}>
          <Glyph name="cloud" size={250 + (i % 2) * 60} />
        </div>
      ))}
      {/* lightning bolt for the current flash, placed per flash */}
      {hit > 0 && since < 8 && (
        <div style={{position: 'absolute', left: (hit % 2 ? 0.16 : 0.74) * w + (hash(70, hit) - 0.5) * 120, top: 120}}>
          <Glyph name="bolt" size={260} />
        </div>
      )}
      {/* the plant: grows, sways, sunglasses and a grin on the pot, new leaf per flash */}
      <div style={{position: 'absolute', left: px - size / 2, top: groundY - size * 0.92, width: size, height: size}}>
        <svg width={size} height={size} viewBox="0 0 64 64" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <g transform={`rotate(${Math.sin(sway * Math.PI * 2) * 10} 32 40)`} stroke={C.ink} strokeWidth={3} strokeLinejoin="round">
            {LEAVES.map((d, i) => {
              const s = hit > i ? ease.outBack(clamp((frame - flashes[i]) / 8), 2.4) : 0;
              return s > 0 ? <path key={i} d={d} fill={C.pickle} transform={`translate(32 32) scale(${s}) translate(-32 -32)`} /> : null;
            })}
          </g>
        </svg>
        <Glyph name="plant" size={size} pose={sway} style={{position: 'absolute', left: 0, top: 0}} />
        <svg width={size} height={size} viewBox="0 0 64 64" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <g stroke={C.ink} strokeLinecap="round" strokeLinejoin="round">
            {hit > 0 && (
              <g transform={`translate(32 46) scale(${popIn(frame, flashes[0], 7)}) translate(-32 -46)`}>
                <path d="M21 44 H43" strokeWidth={2.5} />
                <rect x={21} y={43} width={9} height={6} rx={2.5} fill={C.ink} strokeWidth={1.5} />
                <rect x={34} y={43} width={9} height={6} rx={2.5} fill={C.ink} strokeWidth={1.5} />
              </g>
            )}
            <path d={hit > 0 ? 'M26 52 Q32 57 38 52' : 'M27 53 H37'} fill="none" strokeWidth={2.5} />
          </g>
        </svg>
      </div>
      {/* +1 LEAF pops above the plant on each flash */}
      {flashes.map((f, i) =>
        frame >= f && frame < f + 22 ? (
          <Sign key={i} x={px + (i % 2 ? 230 : -230)} y={groundY - size * 0.75 - (frame - f) * 3} text="+1 leaf" color="pickle" size={30} rot={i % 2 ? 6 : -6} scale={popIn(frame, f, 6)} />
        ) : null,
      )}
      {/* status card: the words the gag needs */}
      <div
        style={{
          position: 'absolute',
          right: 60,
          top: h * 0.42,
          width: 380,
          background: C.paper,
          border: outline(),
          borderRadius: SHAPE.radius,
          boxShadow: hardShadow(),
          padding: '16px 22px',
          transform: `rotate(2deg) scale(${popIn(frame, start, 8)})`,
          fontFamily: FONT.display,
          color: C.ink,
        }}
      >
        <div style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 22, color: C.ink2}}>houseplant status</div>
        <div style={{fontWeight: 900, fontStretch: '125%', fontSize: 50, color: C.pickle, WebkitTextStroke: `2px ${C.ink}`}}>THRIVING</div>
        <div style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 24}}>leaves: {3 + hit}</div>
      </div>
      <AlertBar w={w} text="THUNDERSTORM WARNING" glyph="bolt" frame={frame} at={start} />
      {flash > 0 && <div style={{position: 'absolute', inset: 0, background: C.paper, opacity: flash * 0.75}} />}
    </div>
  );
};

// ------------------------------------------------------------------ v3.07: a lemonade stand in a hurricane (radar view)

const FLYERS: GlyphName[] = ['lemon', 'cup', 'shoe', 'box', 'receipt', 'taco', 'lemon', 'key', 'waffle', 'cup'];

export const HurricaneScene: React.FC<Box & {start: number}> = ({frame, w, h, start}) => {
  const ex = w / 2;
  const ey = h / 2 + 40;
  const t = (frame - start) / 30;
  const spin = -t * 140; // degrees: counter-clockwise, like the real thing in the north
  // spiral arms (log spiral polylines), rotating around the eye
  const arm = (k: number, color: string, width: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 2.4 + (k * Math.PI * 2) / 3;
      const r = 90 * Math.exp(0.26 * (i / 40) * Math.PI * 2.4);
      pts.push(`${(Math.cos(a) * r * 1.25).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
    }
    return <polyline key={k} points={pts.join(' ')} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />;
  };
  const sway = noise1(80, frame / 3) * 4;
  return (
    <div style={{position: 'absolute', inset: 0, background: C.ink, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0}}>
        <g transform={`translate(${ex} ${ey})`}>
          {[160, 300, 440, 580, 720].map((r) => (
            <ellipse key={r} rx={r * 1.25} ry={r} fill="none" stroke={C.ink2} strokeWidth={3} />
          ))}
          <g transform={`rotate(${spin})`}>
            {arm(0, C.pickle, 54)}
            {arm(1, C.mustard, 40)}
            {arm(2, C.pink, 30)}
            {arm(0, C.tangerine, 12)}
          </g>
          {/* radar sweep */}
          <path d={`M0 0 L${Math.cos(t * 4) * 900} ${Math.sin(t * 4) * 720}`} stroke={C.pickle} strokeWidth={5} />
        </g>
      </svg>
      {/* things flying past, around the eye */}
      {FLYERS.map((g, i) => {
        const r = 300 + hash(81, i) * 380;
        const a = hash(82, i) * Math.PI * 2 - t * (2.6 + hash(83, i) * 1.6) * (420 / r);
        const x = ex + Math.cos(a) * r * 1.3;
        const y = ey + Math.sin(a) * r * 0.62;
        return (
          <div key={i} style={{position: 'absolute', left: x - 50, top: y - 50, transform: `rotate(${(a * 180) / Math.PI * 2}deg)`}}>
            <Glyph name={g} size={92} />
          </div>
        );
      })}
      {/* the stand, in the eye, still open */}
      <div style={{position: 'absolute', left: ex - 170, top: ey - 210, width: 340, height: 340, transform: `rotate(${sway}deg)`, transformOrigin: '50% 100%'}}>
        <Glyph name="stand" size={340} pose={t * 2} />
        <Sign x={170} y={232} text="lemonade" color="mustard" size={32} glyph="lemon" />
        <div style={{position: 'absolute', left: 250, top: 112, transformOrigin: '50% 0', transform: `rotate(${Math.sin(t * 9) * 22}deg)`}}>
          <svg width={10} height={30} style={{position: 'absolute', left: 30, top: -22}}>
            <path d="M5 0 V30" stroke={C.ink} strokeWidth={3} />
          </svg>
          <Sign x={36} y={30} text="open" color="tangerine" size={30} />
        </div>
      </div>
      <Sign x={ex - 520} y={h - 70} text="still open" color="pickle" size={40} rot={-4} scale={popIn(frame, start + 10, 8)} />
      <AlertBar w={w} text="HURRICANE WARNING" glyph="cloud" frame={frame} at={start} />
    </div>
  );
};

// ------------------------------------------------------------------ v3.08: sky behind the good-vibes plane

export const SkyScene: React.FC<Box & {start: number}> = ({frame, w, h, start}) => {
  const t = (frame - start) / 30;
  return (
    <div style={{position: 'absolute', inset: 0, background: C.fizz, overflow: 'hidden'}}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const x = ((hash(90, i) * (w + 400) - t * (60 + i * 25)) % (w + 400) + w + 400) % (w + 400) - 200;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: 120 + hash(91, i) * (h - 300), width: 260, height: 90, borderRadius: 45, background: C.paper, border: outline()}} />
        );
      })}
      {/* customers below: a row of little tab-people waving */}
      <div style={{position: 'absolute', left: 0, bottom: 0, width: w, height: 120, background: C.pickle, borderTop: outline()}} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} style={{position: 'absolute', left: 140 + i * ((w - 280) / 6) - 40, bottom: 70 + Math.abs(Math.sin(t * 6 + i)) * 24}}>
          <Glyph name={(['cup', 'dog', 'shoe', 'pickle', 'taco', 'tangerine', 'cart'] as GlyphName[])[i]} size={80} pose={(t + i * 0.2) % 1} />
        </div>
      ))}
    </div>
  );
};

// The plane that landed on court 3 takes off again, towing a GOOD VIBES 4 SALE banner (world px, desktop space).
export const VibesPlane: React.FC<{frame: number; x: number; y: number; dir: number; trail: number}> = ({frame, x, y, dir, trail}) => {
  const wave = Math.sin(frame / 3) * 4;
  const bw = 520;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, zIndex: 30}}>
      <svg width={trail} height={60} style={{position: 'absolute', left: -trail, top: -10, overflow: 'visible'}}>
        <path d={`M${trail} 10 Q${trail - 60} ${30 + wave} ${trail - 110} 28`} stroke={C.ink} strokeWidth={4} fill="none" />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: -trail - bw + 30,
          top: -4,
          width: bw,
          height: 74,
          background: C.mustard,
          border: outline(),
          borderRadius: SHAPE.radiusSmall,
          boxShadow: hardShadow(6),
          transform: `skewY(${wave * 0.6}deg) rotate(${dir * 0.2}deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT.display,
          fontWeight: 900,
          fontStretch: '125%',
          fontSize: 40,
          color: C.ink,
          gap: 12,
        }}
      >
        GOOD VIBES
        <span style={{background: C.tangerine, border: outline(3), borderRadius: SHAPE.radiusSmall, padding: '0 10px', fontSize: 30}}>4 SALE</span>
      </div>
      <div style={{position: 'absolute', left: -90, top: -110, transform: `rotate(${dir}deg)`}}>
        <Glyph name="plane" size={170} />
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ ambient: every open tab as a little scene

export const TabMosaic: React.FC<Box & {count: number; named: Record<number, TabSpec>; newest: number; popAt: number; seed: number}> = ({
  frame,
  w,
  h,
  count,
  named,
  newest,
  popAt,
  seed,
}) => {
  const n = Math.min(count, 48);
  const first = count - n; // show the newest tabs
  const cols = Math.ceil(Math.sqrt((n * w) / h));
  const rows = Math.ceil(n / cols);
  const pad = 14;
  const tw = (w - pad * (cols + 1)) / cols;
  const th = (h - pad * (rows + 1)) / rows;
  const g = Math.min(tw, th) * 0.62;
  return (
    <div style={{position: 'absolute', inset: 0, background: C.paper2}}>
      {Array.from({length: n}, (_, k) => {
        const i = first + k;
        const tab = named[i] ?? fillerTab(i);
        const col = k % cols;
        const row = Math.floor(k / cols);
        const s = i === newest ? popIn(frame, popAt, 7) : 1;
        const bg = C[tab.color ?? 'paper'];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: pad + col * (tw + pad),
              top: pad + row * (th + pad),
              width: tw,
              height: th,
              background: i === newest ? C.tangerine : C.paper,
              border: outline(tw < 90 ? 3 : 4),
              borderRadius: SHAPE.radiusSmall,
              boxShadow: hardShadow(tw < 90 ? 4 : 6),
              overflow: 'hidden',
              transform: `scale(${s}) rotate(${(hash(seed, i) - 0.5) * 6}deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: Math.max(6, th * 0.1), background: bg, borderBottom: outline(2)}} />
            {tab.glyph && <Glyph name={tab.glyph} size={g} pose={((frame + i * 7) / 26) % 1} />}
          </div>
        );
      })}
    </div>
  );
};
