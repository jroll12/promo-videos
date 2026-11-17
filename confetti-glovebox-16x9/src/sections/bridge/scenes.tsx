// Local scenes for the bridge. Every component takes the GLOBAL frame and the frames it needs from Section.tsx
// (which derives them from the beat grid and line ids). Positions are desktop px (world space) unless noted.
import React from 'react';
import {AppWindow, CalendarApp, CalEvent, Cursor, NotesApp, Popup} from '../../lib/chrome';
import {Glyph, GlyphName} from '../../lib/glyphs';
import {C, FONT, SHAPE, hardShadow, outline, ColorName} from '../../lib/theme';
import {beatAt} from '../../data/timing';
import {beatPulse, clamp, ease, lerp, popIn} from '../../lib/motion';
import {hash} from '../../lib/rng';

const mono = (size: number, weight = 700): React.CSSProperties => ({fontFamily: FONT.mono, fontWeight: weight, fontSize: size, color: C.ink});
const display = (size: number, stretch = 125): React.CSSProperties => ({fontFamily: FONT.display, fontWeight: 900, fontStretch: `${stretch}%`, fontSize: size, color: C.ink, lineHeight: 1});
const since = (frame: number, at: number) => frame - at;

// ------------------------------------------------------------------ br.01 maps page (inside the browser content)

const LeftArrow: React.FC<{size?: number}> = ({size = 64}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{display: 'block', overflow: 'visible'}}>
    <path d="M46 58 V30 Q46 18 34 18 H18" fill="none" stroke={C.ink} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M46 58 V30 Q46 18 34 18 H18" fill="none" stroke={C.tangerine} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 18 L22 4 V32Z" fill={C.tangerine} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
  </svg>
);

// A square loop of four left turns: start bottom-right heading up, every turn is a left, the fourth brings you back.
const CORNERS = [
  {x: 690, y: 560},
  {x: 690, y: 160},
  {x: 250, y: 160},
  {x: 250, y: 560},
  {x: 690, y: 560},
];

export const MapsPage: React.FC<{frame: number; w: number; h: number; turnsAt: number[]}> = ({frame, w, h, turnsAt}) => {
  const n = turnsAt.filter((f) => frame >= f).length; // turns taken so far (0..4)
  const leg = Math.max(0, n - 1);
  const t = n === 0 ? 0 : ease.outCubic(clamp(since(frame, turnsAt[leg]) / 8));
  const a = CORNERS[n === 0 ? 0 : leg];
  const b = CORNERS[n === 0 ? 0 : leg + 1];
  const px = lerp(a.x, b.x, t);
  const py = lerp(a.y, b.y, t);
  const travelled = [...CORNERS.slice(0, n === 0 ? 1 : leg + 1), {x: px, y: py}];
  const rows = ['Turn left', 'Turn left', 'Turn left', 'Turn left · you are back'];
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, background: C.paper}}>
      <div style={{position: 'absolute', left: 48, top: 36, ...display(58)}}>DIRECTIONS</div>
      <div style={{position: 'absolute', left: 50, top: 108, ...mono(24, 600), color: C.ink2}}>avoid: right turns (all of them)</div>
      {rows.map((r, i) => {
        const s = popIn(frame, turnsAt[i], 7);
        if (s <= 0) return null;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 48,
              top: 170 + i * 128,
              width: 700,
              height: 106,
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              padding: '0 22px',
              boxSizing: 'border-box',
              background: i === n - 1 ? C.mustard : C.paper2,
              border: outline(),
              borderRadius: SHAPE.radius,
              boxShadow: hardShadow(6),
              transform: `scale(${s})`,
              transformOrigin: 'left center',
            }}
          >
            <div style={{...display(44), width: 52, textAlign: 'center'}}>{i + 1}</div>
            <LeftArrow size={62} />
            <div style={{fontFamily: FONT.display, fontWeight: 800, fontSize: i === 3 ? 30 : 40, color: C.ink}}>{r}</div>
          </div>
        );
      })}
      <svg width={920} height={720} viewBox="0 0 920 720" style={{position: 'absolute', left: w - 960, top: 28}}>
        <rect x={4} y={4} width={912} height={712} rx={SHAPE.radius} fill={C.pickle} stroke={C.ink} strokeWidth={SHAPE.stroke} />
        {[30, 250, 470, 690, 890].map((x) => (
          <path key={`v${x}`} d={`M${x} 4 V716`} stroke={C.ink} strokeWidth={46} />
        ))}
        {[160, 360, 560].map((y) => (
          <path key={`h${y}`} d={`M4 ${y} H916`} stroke={C.ink} strokeWidth={46} />
        ))}
        {[30, 250, 470, 690, 890].map((x) => (
          <path key={`v2${x}`} d={`M${x} 4 V716`} stroke={C.paper2} strokeWidth={38} />
        ))}
        {[160, 360, 560].map((y) => (
          <path key={`h2${y}`} d={`M4 ${y} H916`} stroke={C.paper2} strokeWidth={38} />
        ))}
        <polyline points={CORNERS.map((c) => `${c.x},${c.y}`).join(' ')} fill="none" stroke={C.ink2} strokeWidth={8} strokeDasharray="4 18" strokeLinecap="round" />
        <polyline points={travelled.map((c) => `${c.x},${c.y}`).join(' ')} fill="none" stroke={C.tangerine} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
        {CORNERS.slice(1, 4).map((c, i) => (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r={24} fill={n > i + 1 ? C.mustard : C.paper} stroke={C.ink} strokeWidth={3.5} />
            <text x={c.x} y={c.y + 9} textAnchor="middle" style={{fontFamily: FONT.mono, fontWeight: 800, fontSize: 26}} fill={C.ink}>
              L
            </text>
          </g>
        ))}
        <g transform={`translate(${px - 36} ${py - 72})`}>
          <Glyph name="pin" size={72} />
        </g>
      </svg>
    </div>
  );
};

// ------------------------------------------------------------------ br.02 snack lab

const Flask: React.FC<{cx: number; liquid: string; label: string; frame: number; seed: number}> = ({cx, liquid, label, frame, seed}) => {
  const bob = Math.sin(frame / 6 + seed) * 8;
  return (
    <g>
      <path d={`M${cx - 76} 330 H${cx + 76} L${cx + 140} 470 Q${cx + 146} 486 ${cx + 128} 486 H${cx - 128} Q${cx - 146} 486 ${cx - 140} 470Z`} fill={liquid} />
      {Array.from({length: 6}, (_, i) => {
        const y = 470 - ((frame * 2.2 + i * 37 + hash(seed, i) * 60) % 140);
        const x = cx + (hash(seed + 1, i) - 0.5) * (y > 400 ? 180 : 110);
        return <circle key={i} cx={x} cy={y} r={6 + hash(seed + 2, i) * 6} fill={C.paper} stroke={C.ink} strokeWidth={2.5} />;
      })}
      <path d={`M${cx - 30} 110 V230 L${cx - 140} 470 Q${cx - 146} 486 ${cx - 128} 486 H${cx + 128} Q${cx + 146} 486 ${cx + 140} 470 L${cx + 30} 230 V110`} fill="none" stroke={C.ink} strokeWidth={SHAPE.stroke + 1} strokeLinejoin="round" />
      <rect x={cx - 44} y={98} width={88} height={20} rx={6} fill={C.paper2} stroke={C.ink} strokeWidth={3.5} />
      <g transform={`translate(${cx - 56} ${300 + bob}) rotate(${Math.sin(frame / 8 + seed) * 6} 56 44)`}>
        <rect x={0} y={8} width={112} height={84} rx={8} fill={C.mustard} stroke={C.ink} strokeWidth={3.5} />
        <path d="M0 16 L14 4 L28 16 L42 4 L56 16 L70 4 L84 16 L98 4 L112 16" fill="none" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
        <text x={56} y={50} textAnchor="middle" style={{fontFamily: FONT.mono, fontWeight: 800, fontSize: 20}} fill={C.ink}>
          SNACK
        </text>
        <text x={56} y={76} textAnchor="middle" style={{fontFamily: FONT.mono, fontWeight: 800, fontSize: 20}} fill={C.ink}>
          {label}
        </text>
      </g>
    </g>
  );
};

export const SnackLab: React.FC<{frame: number; x: number; y: number; w: number; h: number; segAt: number[]}> = ({frame, x, y, w, h, segAt}) => {
  const filled = segAt.filter((f) => frame >= f).length;
  const heart = 1 + beatPulse(frame, 0.4) * 0.25;
  return (
    <AppWindow x={x} y={y} w={w} h={h} title="snack lab" color="fizz" glyph="cup">
      <svg width={w - 8} height={h - 60} viewBox={`0 0 ${w - 8} ${h - 60}`} style={{position: 'absolute', left: 0, top: 0}}>
        <path d="M0 520 H2000" stroke={C.ink} strokeWidth={SHAPE.stroke} />
        <rect x={0} y={520} width={w} height={200} fill={C.paper2} />
        <Flask cx={300} liquid={C.pickle} label="PACK A" frame={frame} seed={3} />
        <Flask cx={w - 308} liquid={C.pink} label="PACK B" frame={frame} seed={9} />
        <path d={`M370 200 Q${(w - 8) / 2} 60 ${w - 378} 200`} fill="none" stroke={C.ink2} strokeWidth={5} strokeDasharray="6 16" strokeLinecap="round" />
        <g transform={`translate(${(w - 8) / 2} 270) scale(${heart})`}>
          {Array.from({length: 8}, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <path key={i} d={`M${Math.cos(a) * 92} ${Math.sin(a) * 92} L${Math.cos(a) * 128} ${Math.sin(a) * 128}`} stroke={C.mustard} strokeWidth={12} strokeLinecap="round" />;
          })}
          <path d="M0 58 C-40 30 -74 6 -74 -24 C-74 -50 -50 -64 -30 -64 C-14 -64 -4 -54 0 -42 C4 -54 14 -64 30 -64 C50 -64 74 -50 74 -24 C74 6 40 30 0 58Z" fill={C.pink} stroke={C.ink} strokeWidth={SHAPE.stroke} strokeLinejoin="round" />
        </g>
      </svg>
      <div style={{position: 'absolute', left: 40, top: 536, display: 'flex', alignItems: 'center', gap: 22}}>
        <div style={display(40)}>CHEMISTRY</div>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: 120,
              height: 54,
              borderRadius: SHAPE.radiusSmall,
              border: outline(),
              background: i < filled ? C.tangerine : C.paper,
              transform: `scale(${i === filled - 1 ? 1 + 0.2 * (1 - clamp(since(frame, segAt[i]) / 8)) : 1})`,
            }}
          />
        ))}
        <div style={{...mono(40, 800), width: 140}}>{filled * 25}%</div>
      </div>
    </AppWindow>
  );
};

// ------------------------------------------------------------------ the counting list (cutaways)

export const LIST_ITEMS = ['turn left. again.', 'mix the snack packs', 'fight the calendar', 'crown the laundry', 'remember why i came in', 'finish the other half', 'win something tiny', 'stack it up'];
export const LIST_BOX = {x: 560, y: 150, w: 800, h: 620};
// World position of item i's checkbox centre (NotesApp: 52 px title, 18 px padding, 50 px rows).
export const listBox = (i: number) => ({x: LIST_BOX.x + 4 + 26 + 13, y: LIST_BOX.y + 4 + 52 + 18 + 25 + i * 50});

export const CountingList: React.FC<{frame: number; checked: number; at: number}> = ({frame, checked, at}) => {
  const press = frame >= at ? clamp(1 - since(frame, at) / 10) : 0;
  const tick = popIn(frame, at, 6);
  const target = listBox(checked - 1);
  return (
    <>
      <NotesApp
        {...LIST_BOX}
        title="the list"
        lines={LIST_ITEMS}
        visible={Math.min(LIST_ITEMS.length, checked + 1)}
        checked={LIST_ITEMS.map((_, i) => i < checked - 1 || (i === checked - 1 && tick > 0.3))}
      >
        <div
          style={{
            position: 'absolute',
            right: 28,
            bottom: 26,
            padding: '6px 22px',
            background: C.tangerine,
            border: outline(),
            borderRadius: SHAPE.radius,
            boxShadow: hardShadow(6),
            transform: `scale(${1 + 0.18 * press})`,
            ...display(72),
          }}
        >
          {checked}/{LIST_ITEMS.length}
        </div>
      </NotesApp>
      <Cursor x={target.x + 6} y={target.y + 4} kind="pointer" press={press} />
    </>
  );
};

// ------------------------------------------------------------------ br.03 hostile calendar (callback, ambient)

const CAL_EVENTS: CalEvent[] = [
  {day: 3, label: 'dentist', color: 'pink'},
  {day: 7, label: 'taxes', color: 'mustard'},
  {day: 12, label: 'call back', color: 'fizz'},
  {day: 18, label: 'meeting', color: 'tangerine'},
  {day: 21, label: 'meeting re:', color: 'tangerine'},
  {day: 25, label: 'renew ???', color: 'pickle'},
];
const MARCHERS: {label: string; color: ColorName}[] = [
  {label: 'MEETING', color: 'tangerine'},
  {label: 'DENTIST', color: 'pink'},
  {label: 'TAXES', color: 'mustard'},
  {label: 'CALL BACK', color: 'fizz'},
  {label: 'MEETING 2', color: 'tangerine'},
];

export const HostileCalendar: React.FC<{frame: number; x: number; y: number; w: number; h: number; marchFrom: number}> = ({frame, x, y, w, h, marchFrom}) => {
  const m = Math.max(0, (beatAt(frame) - beatAt(marchFrom)) * 2); // eighth notes since the march started
  const step = Math.floor(m) + ease.outCubic(clamp((m - Math.floor(m)) * 3));
  const foot = Math.floor(m) % 2;
  return (
    <CalendarApp x={x} y={y} w={w} h={h} title="Calendar (hostile)" events={CAL_EVENTS}>
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h}}>
        {MARCHERS.map((mk, i) => {
          const left = 640 + i * 210 - step * 46;
          const top = 470 + (i % 2) * 96 - (foot === i % 2 ? 10 : 0);
          return (
            <div key={i} style={{position: 'absolute', left, top, width: 190}}>
              <div
                style={{
                  height: 80,
                  background: C[mk.color],
                  border: outline(),
                  borderRadius: SHAPE.radiusSmall,
                  boxShadow: hardShadow(5),
                  position: 'relative',
                }}
              >
                <div style={{position: 'absolute', left: 0, right: 0, top: 44, textAlign: 'center', ...mono(20, 800)}}>{mk.label}</div>
                {[60, 116].map((ex, k) => (
                  <React.Fragment key={k}>
                    <div style={{position: 'absolute', left: ex, top: 18, width: 14, height: 14, borderRadius: 7, background: C.ink}} />
                    <div style={{position: 'absolute', left: ex - 6, top: 8, width: 26, height: 5, borderRadius: 3, background: C.ink, transform: `rotate(${k === 0 ? 22 : -22}deg)`}} />
                  </React.Fragment>
                ))}
              </div>
              <svg width={190} height={34} style={{display: 'block'}}>
                <path d={foot === i % 2 ? 'M70 0 L60 30 M120 0 L126 30' : 'M70 0 L76 30 M120 0 L110 30'} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
              </svg>
            </div>
          );
        })}
      </div>
    </CalendarApp>
  );
};

// ------------------------------------------------------------------ br.04 laundry dynasty (literal)

const Pile: React.FC<{x: number; y: number; s: number; crown?: boolean}> = ({x, y, s, crown = true}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-70 10 H70 L58 70 H-58Z" fill={C.mustard} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M-64 30 H64 M-60 50 H60" stroke={C.ink} strokeWidth={3} />
    <ellipse cx={-34} cy={4} rx={34} ry={24} fill={C.fizz} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={30} cy={2} rx={38} ry={26} fill={C.pink} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={0} cy={-16} rx={30} ry={22} fill={C.pickle} stroke={C.ink} strokeWidth={4} />
    <path d="M44 -6 L72 -26 L80 -14 L56 4Z" fill={C.paper} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
    {crown && <path d="M-26 -34 V-62 L-12 -48 L0 -70 L12 -48 L26 -62 V-34Z" fill={C.mustard} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />}
  </g>
);

const PORTRAITS = [
  {x: 70, name: 'LAUNDRY I'},
  {x: 320, name: 'LAUNDRY II'},
  {x: 980, name: 'LAUNDRY III'},
  {x: 1230, name: 'LAUNDRY IV'},
];

export const LaundryDynasty: React.FC<{frame: number; x: number; y: number; w: number; h: number; at: number; eighth: (k: number) => number; crownAt: number}> = ({frame, x, y, w, h, at, eighth, crownAt}) => {
  const throne = popIn(frame, at, 8);
  const crownBounce = frame >= crownAt ? ease.outElastic(clamp(since(frame, crownAt) / 14)) : 1;
  const glint = beatPulse(frame, 0.5);
  return (
    <AppWindow x={x} y={y} w={w} h={h} title="Royal Laundry Museum" color="pink" glyph="laundry">
      <svg width={1500} height={808} viewBox="0 0 1500 808" style={{position: 'absolute', left: 0, top: 0}}>
        <rect x={0} y={610} width={1500} height={220} fill={C.paper2} />
        <path d="M0 610 H1500" stroke={C.ink} strokeWidth={4} />
        <path d="M690 610 H810 L900 820 H600Z" fill={C.pink} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        <g>
          <rect x={470} y={22} width={560} height={84} rx={SHAPE.radius} fill={C.tangerine} stroke={C.ink} strokeWidth={4} />
          <text x={750} y={80} textAnchor="middle" style={{fontFamily: FONT.display, fontWeight: 900, fontStretch: '125%', fontSize: 46}} fill={C.ink}>
            HOUSE OF LAUNDRY
          </text>
          <text x={750} y={140} textAnchor="middle" style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: 22}} fill={C.ink2}>
            ruling the chair since some monday
          </text>
        </g>
        {PORTRAITS.map((p, i) => {
          const s = popIn(frame, eighth(i), 7);
          if (s <= 0) return null;
          return (
            <g key={i} transform={`translate(${p.x + 100} ${330}) scale(${s}) translate(${-p.x - 100} ${-330})`}>
              <rect x={p.x} y={190} width={200} height={250} rx={6} fill={C.mustard} stroke={C.ink} strokeWidth={4} />
              <rect x={p.x + 18} y={208} width={164} height={214} fill={C.paper2} stroke={C.ink} strokeWidth={3} />
              <Pile x={p.x + 100} y={318} s={0.85 - i * 0.04} />
              <rect x={p.x + 10} y={456} width={180} height={40} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={3} />
              <text x={p.x + 100} y={484} textAnchor="middle" style={{fontFamily: FONT.mono, fontWeight: 800, fontSize: 21}} fill={C.ink}>
                {p.name}
              </text>
            </g>
          );
        })}
        <g transform={`translate(750 600) scale(${throne}) translate(-750 -600)`}>
          <path d="M600 600 V260 Q600 150 750 132 Q900 150 900 260 V600Z" fill={C.tangerine} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
          <path d="M640 520 V280 Q640 196 750 182 Q860 196 860 280 V520Z" fill={C.pink} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
          <circle cx={750} cy={150} r={16} fill={C.mustard} stroke={C.ink} strokeWidth={4} />
          <rect x={560} y={430} width={70} height={120} rx={10} fill={C.tangerine} stroke={C.ink} strokeWidth={4} />
          <rect x={870} y={430} width={70} height={120} rx={10} fill={C.tangerine} stroke={C.ink} strokeWidth={4} />
          <rect x={580} y={520} width={340} height={60} rx={10} fill={C.mustard} stroke={C.ink} strokeWidth={5} />
          <text x={750} y={562} textAnchor="middle" style={{fontFamily: FONT.mono, fontWeight: 800, fontSize: 26}} fill={C.ink}>
            LAUNDRY V
          </text>
          <g transform={`translate(750 452) scale(1.6)`}>
            <Pile x={0} y={0} s={1} crown={false} />
            <circle cx={-14} cy={38} r={3.5} fill={C.ink} />
            <circle cx={14} cy={38} r={3.5} fill={C.ink} />
            <path d="M-10 52 Q0 47 10 52" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
            <g transform={`translate(0 ${-30 * (1 - crownBounce)})`}>
              <path d="M-34 -34 V-74 L-17 -54 L0 -84 L17 -54 L34 -74 V-34Z" fill={C.mustard} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
              <circle cx={0} cy={-46} r={5} fill={C.pink} stroke={C.ink} strokeWidth={2.5} />
              <circle cx={-20} cy={-44} r={4} fill={C.fizz} stroke={C.ink} strokeWidth={2.5} />
              <circle cx={20} cy={-44} r={4} fill={C.pickle} stroke={C.ink} strokeWidth={2.5} />
              <path d={`M40 -86 l${6 + glint * 8} 0 M43 -92 l0 ${6 + glint * 8}`} stroke={C.ink} strokeWidth={3} strokeLinecap="round" opacity={glint} />
            </g>
          </g>
        </g>
      </svg>
    </AppWindow>
  );
};

// ------------------------------------------------------------------ br.05 "wait, what?" popup stack (ambient)

export const WAIT_POPUPS: {x: number; y: number; body: string; glyph: GlyphName}[] = [
  {x: 640, y: 330, body: 'Why did you open this window?', glyph: 'notebook'},
  {x: 820, y: 450, body: 'You walked in here for something.', glyph: 'key'},
  {x: 1000, y: 570, body: 'It was important. Probably.', glyph: 'phone'},
  {x: 1180, y: 690, body: 'Wait. What?', glyph: 'spinner'},
];

export const WaitStack: React.FC<{frame: number; at: number[]}> = ({frame, at}) => (
  <>
    {WAIT_POPUPS.map((p, i) => (
      <Popup
        key={i}
        x={p.x}
        y={p.y}
        w={620}
        title="wait, what?"
        body={p.body}
        buttons={['Wait', 'What?']}
        glyph={p.glyph}
        enter={popIn(frame, at[i], 7)}
        rot={(hash(17, i) - 0.5) * 6}
        color={i % 2 ? 'fizz' : 'mustard'}
      />
    ))}
  </>
);

// ------------------------------------------------------------------ br.06 half-done symmetry (literal)

// One half of the picture. `wire` draws the unfinished mirror: no fill, dashed pencil outline.
const Half: React.FC<{wire: boolean; frame: number}> = ({wire, frame}) => {
  const st = (fill: string): React.SVGProps<SVGPathElement> =>
    wire
      ? {fill: 'none', stroke: C.ink2, strokeWidth: 4, strokeDasharray: '14 12', strokeLinecap: 'round', strokeLinejoin: 'round'}
      : {fill, stroke: C.ink, strokeWidth: SHAPE.stroke + 1, strokeLinejoin: 'round'};
  const flap = 1 + Math.sin(frame / 5) * 0.03;
  return (
    <g>
      {/* butterfly wings, hinged on the centre line */}
      <g transform={`translate(890 0) scale(${flap} 1) translate(-890 0)`}>
        <path d="M884 400 C800 220 600 120 470 190 C380 250 420 400 540 440 C640 470 780 450 884 430Z" {...st(C.pink)} />
        <path d="M884 450 C760 450 600 500 560 600 C530 690 640 740 730 680 C800 630 860 560 884 480Z" {...st(C.tangerine)} />
        <circle cx={590} cy={290} r={46} {...(st(C.mustard) as React.SVGProps<SVGCircleElement>)} />
        <circle cx={720} cy={360} r={24} {...(st(C.fizz) as React.SVGProps<SVGCircleElement>)} />
        <circle cx={660} cy={600} r={30} {...(st(C.mustard) as React.SVGProps<SVGCircleElement>)} />
      </g>
      <path d="M880 290 C860 230 820 190 780 180" {...st('none')} fill="none" />
      <circle cx={780} cy={180} r={12} {...(st(C.ink) as React.SVGProps<SVGCircleElement>)} />
      {/* sun */}
      <circle cx={250} cy={190} r={70} {...(st(C.mustard) as React.SVGProps<SVGCircleElement>)} />
      {Array.from({length: 8}, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <path key={i} d={`M${250 + Math.cos(a) * 92} ${190 + Math.sin(a) * 92} L${250 + Math.cos(a) * 124} ${190 + Math.sin(a) * 124}`} {...st('none')} strokeWidth={wire ? 4 : 8} strokeLinecap="round" />;
      })}
      {/* potted plant */}
      <path d="M190 700 H350 L326 820 H214Z" {...st(C.tangerine)} />
      <path d="M270 700 V560" {...st('none')} fill="none" />
      <path d="M270 620 C220 620 180 590 186 540 C236 536 270 570 270 620Z" {...st(C.pickle)} />
      <path d="M270 590 C320 584 356 548 350 500 C300 500 270 540 270 590Z" {...st(C.pickle)} />
      {/* flower pot near the centre */}
      <path d="M600 790 H700 L690 840 H610Z" {...st(C.fizz)} />
      <circle cx={650} cy={740} r={34} {...(st(C.pink) as React.SVGProps<SVGCircleElement>)} />
      <circle cx={650} cy={740} r={12} {...(st(C.mustard) as React.SVGProps<SVGCircleElement>)} />
    </g>
  );
};

export const MirrorApp: React.FC<{frame: number; x: number; y: number; w: number; h: number; at: number; beats: number[]}> = ({frame, x, y, w, h, at, beats}) => {
  const fill = 0.5 * ease.outCubic(clamp(since(frame, at) / 16)); // crawls to 50% and stops there
  const lastBeat = beats.filter((b) => frame >= b).length - 1;
  const bob = lastBeat >= 0 ? Math.exp(-since(frame, beats[lastBeat]) / 4) : 0;
  const W2 = 1780;
  return (
    <AppWindow x={x} y={y} w={w} h={h} title="mirror.app  —  symmetry.png" color="fizz" glyph="pencil">
      <svg width={W2} height={900} viewBox={`0 0 ${W2} 900`} style={{position: 'absolute', left: (w - 8 - W2) / 2, top: 0}}>
        <path d={`M${W2 / 2} 110 V890`} stroke={C.fizz} strokeWidth={6} strokeDasharray="18 14" />
        <Half wire={false} frame={frame} />
        <g transform={`translate(${W2} 0) scale(-1 1)`}>
          <Half wire frame={frame} />
        </g>
        {/* the body sits on the axis, finished */}
        <ellipse cx={W2 / 2} cy={440} rx={20} ry={130} fill={C.ink} />
        <circle cx={W2 / 2} cy={296} r={28} fill={C.ink} />
        {[
          {x: 1180, y: 300},
          {x: 1500, y: 560},
          {x: 1500, y: 760},
        ].map((t, i) => (
          <text key={i} x={t.x} y={t.y} textAnchor="middle" style={{fontFamily: FONT.mono, fontWeight: 800, fontSize: 34}} fill={C.ink2}>
            TODO
          </text>
        ))}
      </svg>
      {/* progress chip, centred: stuck at 50% */}
      <div style={{position: 'absolute', left: (w - 8) / 2, top: 26, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 18, padding: '10px 22px', background: C.paper, border: outline(), borderRadius: SHAPE.radius, boxShadow: hardShadow(6)}}>
        <div style={display(34)}>SYMMETRY</div>
        <div style={{width: 300, height: 30, border: outline(3), borderRadius: 15, background: C.paper2, overflow: 'hidden'}}>
          <div style={{width: `${fill * 100}%`, height: '100%', background: C.tangerine, borderRight: fill > 0.01 ? outline(3) : 'none'}} />
        </div>
        <div style={{...mono(34, 800), width: 92}}>{Math.round(fill * 100)}%</div>
      </div>
      {/* the pencil gave up halfway through the right wing */}
      <div style={{position: 'absolute', left: (w - 8) / 2 + 300, top: 150 - bob * 14, transform: `rotate(${-20 + bob * 10}deg)`}}>
        <Glyph name="pencil" size={110} />
      </div>
      <div style={{position: 'absolute', left: (w - 8) / 2 + 400, top: 130, padding: '4px 14px', background: C.mustard, border: outline(3), borderRadius: SHAPE.radiusSmall, ...mono(28, 800)}}>brb</div>
    </AppWindow>
  );
};

// ------------------------------------------------------------------ br.07 + br.08 tiny trophies stacked up mentally (literal)

export const TROPHY_LABELS = ['drank water', 'found keys', 'sent it', 'folded 1 sock', 'parked first try', 'ate a fruit', 'said no', 'made the bed', 'on time-ish', "replied 'ok'", 'went outside'];
export const BUBBLE = {cx: 960, cy: 430, rx: 520, ry: 360};
export const TOWER = {x: 960, base: 730, step: 56, size: 54};

const bumps = Array.from({length: 18}, (_, i) => {
  const a = (i / 18) * Math.PI * 2;
  return {x: BUBBLE.cx + Math.cos(a) * BUBBLE.rx * 0.9, y: BUBBLE.cy + Math.sin(a) * BUBBLE.ry * 0.88, r: 92 + hash(23, i) * 30};
});
const trail = [
  {x: 962, y: 860, r: 12},
  {x: 948, y: 822, r: 20},
];

export const TrophyMind: React.FC<{frame: number; at: number[]; swayFrom: number}> = ({frame, at, swayFrom}) => {
  const n = at.filter((f) => frame >= f).length;
  const sway = frame >= swayFrom ? Math.sin((beatAt(frame) - beatAt(swayFrom)) * Math.PI) * 1.6 * clamp(n / at.length + 0.2) : 0;
  const counterPop = n > 0 ? 1 + 0.25 * Math.exp(-since(frame, at[n - 1]) / 4) : 1;
  return (
    <>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {[...bumps, ...trail].map((b, i) => (
          <circle key={`o${i}`} cx={b.x} cy={b.y} r={b.r} fill={C.ink} stroke={C.ink} strokeWidth={SHAPE.stroke * 2} />
        ))}
        <ellipse cx={BUBBLE.cx} cy={BUBBLE.cy} rx={BUBBLE.rx} ry={BUBBLE.ry} fill={C.ink} stroke={C.ink} strokeWidth={SHAPE.stroke * 2} />
        {[...bumps, ...trail].map((b, i) => (
          <circle key={`f${i}`} cx={b.x} cy={b.y} r={b.r} fill={C.paper} />
        ))}
        <ellipse cx={BUBBLE.cx} cy={BUBBLE.cy} rx={BUBBLE.rx} ry={BUBBLE.ry} fill={C.paper} />
        <rect x={TOWER.x - 120} y={TOWER.base} width={240} height={22} rx={6} fill={C.mustard} stroke={C.ink} strokeWidth={4} />
      </svg>
      <div style={{position: 'absolute', left: 520, top: 190, padding: '8px 18px', background: C.fizz, border: outline(), borderRadius: SHAPE.radius, boxShadow: hardShadow(6), ...display(30, 112), transform: 'rotate(-3deg)'}}>
        MENTAL
        <br />
        TROPHY SHELF
      </div>
      <div style={{position: 'absolute', left: 560, top: 580, padding: '6px 18px', background: C.tangerine, border: outline(), borderRadius: SHAPE.radius, boxShadow: hardShadow(6), transform: `scale(${counterPop})`, transformOrigin: 'left center', ...mono(34, 800)}}>
        WINS: {n}
      </div>
      <div style={{position: 'absolute', left: TOWER.x, top: TOWER.base, width: 0, height: 0, transform: `rotate(${sway}deg)`}}>
        {at.map((f, i) => {
          if (frame < f) return null;
          const d = since(frame, f);
          const drop = (1 - ease.outElastic(clamp(d / 10))) * -70;
          const jig = (hash(41, i) - 0.5) * 14;
          return (
            <div key={i} style={{position: 'absolute', left: -TOWER.size / 2 + jig, top: -TOWER.step * (i + 1) + drop, width: TOWER.size}}>
              <Glyph name="trophy" size={TOWER.size} />
              <div
                style={{
                  position: 'absolute',
                  left: TOWER.size + 14 - jig,
                  top: 14,
                  whiteSpace: 'nowrap',
                  padding: '1px 10px',
                  background: i % 2 ? C.paper2 : C.mustard,
                  border: outline(2.5),
                  borderRadius: SHAPE.radiusSmall,
                  ...mono(18, 700),
                }}
              >
                {TROPHY_LABELS[i % TROPHY_LABELS.length]}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
