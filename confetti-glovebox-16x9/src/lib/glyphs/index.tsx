// Flat favicon-style glyphs, 64x64 viewBox, ink outline, palette fills. Used as tab icons, desktop props and gag
// building blocks. Sections may compose these (scale, rotate, animate parts via `pose`), never restyle them.
import React from 'react';
import {C} from '../theme';

const S = {stroke: C.ink, strokeWidth: 3.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};

type Draw = (pose: number) => React.ReactNode; // pose 0..1: an optional per-glyph animation (wag, open, flip...)

const G: Record<string, Draw> = {
  glovebox: (p) => (
    <g {...S}>
      <rect x={6} y={18} width={52} height={34} rx={6} fill={C.ink2} />
      <rect x={10} y={22} width={44} height={26} rx={4} fill={C.paper2} />
      {/* lid hinges at the bottom and drops open with pose */}
      <g transform={`rotate(${p * 70} 32 48)`}>
        <rect x={10} y={22} width={44} height={26} rx={4} fill={C.tangerine} />
        <rect x={26} y={30} width={12} height={5} rx={2.5} fill={C.ink} />
      </g>
      {p > 0.2 && (
        <g strokeWidth={0}>
          <rect x={16} y={10} width={6} height={4} fill={C.pink} transform="rotate(-20 19 12)" />
          <rect x={30} y={4} width={6} height={4} fill={C.mustard} transform="rotate(15 33 6)" />
          <rect x={42} y={12} width={6} height={4} fill={C.fizz} transform="rotate(35 45 14)" />
          <rect x={24} y={16} width={5} height={4} fill={C.pickle} />
        </g>
      )}
    </g>
  ),
  pickle: (p) => (
    <g {...S} transform={`rotate(${-30 + p * 60} 32 32)`}>
      <path d="M20 8 C8 18 10 46 22 56 C30 62 40 58 44 48 C52 30 44 10 32 6 C28 5 23 6 20 8Z" fill={C.pickle} />
      <circle cx={26} cy={22} r={2} fill={C.ink} />
      <circle cx={34} cy={36} r={2} fill={C.ink} />
      <circle cx={28} cy={46} r={2} fill={C.ink} />
    </g>
  ),
  cart: (p) => (
    <g {...S}>
      <path d="M4 12 H14 L20 40 H50 L56 18 H17" fill="none" />
      <path d="M17 18 H56 L50 40 H20Z" fill={C.fizz} />
      <circle cx={24} cy={50} r={5} fill={C.paper} transform={`rotate(${p * 360} 24 50)`} />
      <circle cx={46} cy={50} r={5} fill={C.paper} />
      <path d="M26 24 V34 M34 24 V34 M42 24 V34" strokeWidth={2.5} />
    </g>
  ),
  dog: (p) => (
    <g {...S}>
      <path d="M14 22 C10 10 18 6 22 14" fill={C.ink2} />
      <path d="M50 22 C54 10 46 6 42 14" fill={C.ink2} />
      <ellipse cx={32} cy={34} rx={20} ry={18} fill={C.mustard} />
      {/* judgmental half-lidded eyes; pose raises one eyebrow */}
      <path d="M20 30 H28" strokeWidth={3} />
      <path d={`M36 ${30 - p * 5} L44 ${28 - p * 6}`} strokeWidth={3} />
      <path d="M20 34 a4 3 0 0 0 8 0Z" fill={C.ink} />
      <path d="M36 34 a4 3 0 0 0 8 0Z" fill={C.ink} />
      <ellipse cx={32} cy={42} rx={5} ry={3.5} fill={C.ink} />
      <path d="M27 49 H37" strokeWidth={3} />
    </g>
  ),
  shoe: (p) => (
    <g {...S}>
      <path d="M6 46 V30 C6 24 14 22 20 26 L30 32 C40 36 58 36 58 46 V50 H6Z" fill={C.pink} />
      <path d="M6 50 H58" strokeWidth={4} />
      <path d="M22 28 L18 36 M28 31 L24 38" strokeWidth={2.5} />
      {/* mouth: sole opens with pose */}
      <path d={`M34 50 Q46 ${50 + p * 10} 58 50`} fill={C.ink} />
      <circle cx={46} cy={40} r={2.5} fill={C.ink} />
    </g>
  ),
  box: () => (
    <g {...S}>
      <path d="M8 22 L32 12 L56 22 V48 L32 58 L8 48Z" fill={C.mustard} />
      <path d="M8 22 L32 32 L56 22 M32 32 V58" fill="none" />
      <path d="M18 18 L42 28" strokeWidth={2.5} />
    </g>
  ),
  boat: (p) => (
    <g {...S} transform={`rotate(${Math.sin(p * Math.PI * 2) * 8} 32 40)`}>
      <path d="M32 6 V40" />
      <path d="M32 8 L50 30 H32Z" fill={C.paper} />
      <path d="M6 40 H58 L50 54 H14Z" fill={C.mustard} />
      <path d="M18 46 H46" strokeWidth={2.5} />
    </g>
  ),
  calendar: (p) => (
    <g {...S}>
      <rect x={8} y={12} width={48} height={44} rx={6} fill={C.paper} />
      <path d="M8 18 a6 6 0 0 1 6 -6 H50 a6 6 0 0 1 6 6 V24 H8Z" fill={C.tangerine} />
      <path d="M20 6 V16 M44 6 V16" />
      {/* angry eyes when pose > 0.5 (boss mode) */}
      {p > 0.5 ? (
        <>
          <path d="M18 32 L28 36 M46 32 L36 36" />
          <path d="M22 46 Q32 40 42 46" fill="none" />
        </>
      ) : (
        <path d="M16 32 H24 M30 32 H38 M44 32 H50 M16 42 H24 M30 42 H38" strokeWidth={3} />
      )}
    </g>
  ),
  tangerine: () => (
    <g {...S}>
      <circle cx={32} cy={36} r={22} fill={C.tangerine} />
      <path d="M32 14 C32 8 36 6 40 6" fill="none" />
      <path d="M33 12 C40 4 50 8 48 14 C42 16 36 14 33 12Z" fill={C.pickle} />
      <circle cx={24} cy={32} r={1.6} fill={C.ink} strokeWidth={0} />
      <circle cx={38} cy={42} r={1.6} fill={C.ink} strokeWidth={0} />
    </g>
  ),
  plant: (p) => (
    <g {...S}>
      <path d="M18 40 H46 L42 58 H22Z" fill={C.tangerine} />
      <g transform={`rotate(${Math.sin(p * Math.PI * 2) * 10} 32 40)`}>
        <path d="M32 40 V18" />
        <path d="M32 26 C20 26 14 18 16 10 C26 10 32 16 32 26Z" fill={C.pickle} />
        <path d="M32 22 C42 20 50 12 48 4 C38 4 32 12 32 22Z" fill={C.pickle} />
        <path d="M32 34 C42 34 50 30 52 22 C44 20 34 24 32 34Z" fill={C.pickle} />
      </g>
    </g>
  ),
  lemon: () => (
    <g {...S}>
      <path d="M8 34 C8 20 22 12 34 12 C48 12 58 22 58 32 C58 46 44 54 32 54 C18 54 8 46 8 34Z" fill={C.mustard} />
      <path d="M6 34 L10 34 M56 32 L60 31" />
      <path d="M22 26 C26 22 32 20 38 21" fill="none" strokeWidth={2.5} />
    </g>
  ),
  plane: (p) => (
    <g {...S} transform={`translate(${p * 4} ${-p * 4})`}>
      <path d="M4 34 L60 8 L40 56 L30 38Z" fill={C.paper} />
      <path d="M30 38 L60 8 M30 38 L28 52 L36 44" fill="none" />
    </g>
  ),
  waffle: () => (
    <g {...S}>
      <rect x={8} y={8} width={48} height={48} rx={10} fill={C.mustard} />
      <path d="M8 24 H56 M8 40 H56 M24 8 V56 M40 8 V56" strokeWidth={3} />
    </g>
  ),
  microwave: (p) => (
    <g {...S}>
      <rect x={4} y={12} width={56} height={40} rx={6} fill={C.paper2} />
      <rect x={10} y={18} width={32} height={28} rx={3} fill={p > 0.5 ? C.mustard : C.ink2} />
      <path d="M50 20 V26 M50 32 V34 M50 40 V42" strokeWidth={4} />
    </g>
  ),
  fridge: (p) => (
    <g {...S}>
      <rect x={14} y={4} width={36} height={56} rx={6} fill={C.paper} />
      <path d="M14 24 H50" />
      <path d="M20 12 V18 M20 30 V40" strokeWidth={4} />
      {p > 0 && <path d={`M50 24 L${50 + p * 10} ${22} V${58} L50 60`} fill={C.fizz} />}
    </g>
  ),
  receipt: () => (
    <g {...S}>
      <path d="M14 4 H50 V60 L45 56 L40 60 L35 56 L30 60 L25 56 L20 60 L14 56Z" fill={C.paper} />
      <path d="M20 14 H44 M20 22 H38 M20 30 H44 M20 38 H34" strokeWidth={2.5} />
      <path d="M20 47 H44" strokeWidth={3.5} />
    </g>
  ),
  crumbs: () => (
    <g {...S} strokeWidth={2.5}>
      <path d="M10 40 l8 -4 l4 7 l-7 5Z" fill={C.mustard} />
      <path d="M30 30 l6 -2 l3 6 l-6 3Z" fill={C.mustard} />
      <path d="M44 44 l7 -3 l3 6 l-7 4Z" fill={C.mustard} />
      <circle cx={24} cy={54} r={3} fill={C.mustard} />
      <circle cx={50} cy={24} r={2.5} fill={C.mustard} />
    </g>
  ),
  sauce: () => (
    <g {...S}>
      <path d="M26 4 H38 V12 L44 20 V58 H20 V20 L26 12Z" fill={C.tangerine} />
      <rect x={20} y={28} width={24} height={16} fill={C.paper} />
      <path d="M26 36 H38" strokeWidth={3} />
    </g>
  ),
  cup: (p) => (
    <g {...S}>
      <path d="M14 20 H50 L46 58 H18Z" fill={C.fizz} />
      <path d="M12 14 H52 V20 H12Z" fill={C.paper} />
      <path d="M40 14 L46 2" strokeWidth={4} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={24 + i * 8} cy={48 - ((p * 30 + i * 11) % 26)} r={2.5} fill={C.paper} strokeWidth={2} />
      ))}
    </g>
  ),
  key: () => (
    <g {...S}>
      <circle cx={20} cy={22} r={12} fill={C.mustard} />
      <circle cx={20} cy={22} r={4} fill={C.paper} />
      <path d="M28 30 L54 56 M44 46 L50 40 M50 52 L56 46" strokeWidth={4} />
    </g>
  ),
  pin: () => (
    <g {...S}>
      <path d="M32 60 C24 46 12 36 12 24 A20 20 0 0 1 52 24 C52 36 40 46 32 60Z" fill={C.tangerine} />
      <circle cx={32} cy={24} r={8} fill={C.paper} />
    </g>
  ),
  popper: (p) => (
    <g {...S}>
      <path d="M8 58 L22 24 L42 44Z" fill={C.pink} />
      <path d="M14 44 L30 52 M18 34 L36 46" strokeWidth={2.5} />
      {p > 0 && (
        <g strokeWidth={0}>
          <rect x={36} y={14} width={6} height={4} fill={C.mustard} transform="rotate(20 39 16)" />
          <rect x={48} y={22} width={6} height={4} fill={C.fizz} transform="rotate(-25 51 24)" />
          <rect x={44} y={6} width={5} height={4} fill={C.pickle} />
          <circle cx={54} cy={12} r={2.5} fill={C.tangerine} />
        </g>
      )}
    </g>
  ),
  taco: () => (
    <g {...S}>
      <path d="M6 46 A26 26 0 0 1 58 46Z" fill={C.mustard} />
      <path d="M12 40 C16 30 22 28 26 32 C30 26 38 26 42 32 C46 28 52 32 52 40" fill={C.pickle} />
      <circle cx={24} cy={36} r={3} fill={C.tangerine} />
      <circle cx={40} cy={35} r={3} fill={C.tangerine} />
    </g>
  ),
  taxes: () => (
    <g {...S}>
      <path d="M12 4 H42 L52 14 V60 H12Z" fill={C.paper} />
      <path d="M42 4 V14 H52" fill="none" />
      <path d="M18 24 H46 M18 32 H46 M18 40 H34" strokeWidth={2.5} />
      <text x={36} y={56} fontSize={16} fontWeight={900} fill={C.tangerine} stroke="none" fontFamily="Archivo">$</text>
    </g>
  ),
  cape: (p) => (
    <g {...S}>
      <path d={`M20 8 H44 L${54 + p * 6} 58 Q32 ${50 + p * 8} ${10 - p * 6} 58Z`} fill={C.pink} />
      <path d="M20 8 H44" strokeWidth={5} />
    </g>
  ),
  shorts: () => (
    <g {...S}>
      <path d="M10 10 H54 L58 54 H38 L32 30 L26 54 H6Z" fill={C.pickle} />
      <path d="M10 18 H54" />
      <rect x={12} y={32} width={10} height={10} fill={C.paper2} strokeWidth={2.5} />
      <rect x={42} y={32} width={10} height={10} fill={C.paper2} strokeWidth={2.5} />
    </g>
  ),
  golf: () => (
    <g {...S}>
      <path d="M22 58 V6" />
      <path d="M22 6 L46 14 L22 22Z" fill={C.tangerine} />
      <ellipse cx={30} cy={58} rx={20} ry={4} fill={C.pickle} />
      <circle cx={44} cy={50} r={5} fill={C.paper} />
    </g>
  ),
  spoon: () => (
    <g {...S}>
      <ellipse cx={22} cy={20} rx={12} ry={16} fill={C.paper2} transform="rotate(-35 22 20)" />
      <path d="M30 30 L56 58" strokeWidth={6} />
    </g>
  ),
  pencil: () => (
    <g {...S}>
      <path d="M10 54 L14 42 L46 10 L54 18 L22 50Z" fill={C.mustard} />
      <path d="M10 54 L14 42 L22 50Z" fill={C.paper} />
      <path d="M42 14 L50 22" />
    </g>
  ),
  dino: (p) => (
    <g {...S}>
      <path d="M8 46 C8 34 18 28 30 30 L34 14 C36 6 48 6 50 12 C54 12 56 16 52 20 L44 22 L42 34 C50 38 54 46 54 52 H44 L42 46 H24 L22 52 H12Z" fill={C.pickle} />
      <circle cx={44} cy={13} r={2} fill={C.ink} />
      <path d={`M24 34 L${20 - p * 4} ${40 + p * 2}`} strokeWidth={3} />
    </g>
  ),
  phone: (p) => (
    <g {...S}>
      <rect x={18} y={4} width={28} height={56} rx={6} fill={C.ink2} />
      <rect x={22} y={10} width={20} height={40} rx={2} fill={C.paper} />
      {/* battery: pose = charge */}
      <rect x={26} y={22} width={12} height={16} rx={2} fill="none" strokeWidth={2.5} />
      <rect x={28} y={36 - 12 * p} width={8} height={12 * p} fill={p < 0.3 ? C.tangerine : C.pickle} strokeWidth={0} />
    </g>
  ),
  paint: () => (
    <g {...S}>
      <path d="M12 22 H52 V56 H12Z" fill={C.paper2} />
      <path d="M12 22 C12 34 18 30 20 38 C22 30 26 34 28 26 C32 36 38 30 40 40 C44 32 48 36 52 22Z" fill={C.fizz} />
      <path d="M8 22 H56" strokeWidth={5} />
      <path d="M16 22 A16 14 0 0 1 48 22" fill="none" strokeWidth={3} />
    </g>
  ),
  cloud: () => (
    <g {...S}>
      <path d="M14 44 A10 10 0 0 1 16 24 A14 14 0 0 1 42 18 A11 11 0 0 1 52 44Z" fill={C.ink2} />
    </g>
  ),
  bolt: () => (
    <g {...S}>
      <path d="M36 4 L14 36 H30 L24 60 L50 26 H34Z" fill={C.mustard} />
    </g>
  ),
  laundry: () => (
    <g {...S}>
      <rect x={10} y={6} width={44} height={52} rx={6} fill={C.paper} />
      <circle cx={32} cy={36} r={14} fill={C.fizz} />
      <path d="M22 38 Q32 30 42 38" fill="none" strokeWidth={2.5} />
      <circle cx={18} cy={14} r={2.5} fill={C.ink} />
      <circle cx={26} cy={14} r={2.5} fill={C.ink} />
    </g>
  ),
  trophy: () => (
    <g {...S}>
      <path d="M18 8 H46 V24 A14 14 0 0 1 18 24Z" fill={C.mustard} />
      <path d="M18 12 H8 C8 24 14 26 18 26 M46 12 H56 C56 24 50 26 46 26" fill="none" />
      <path d="M32 38 V48 M22 56 H42 V48 H22Z" fill={C.mustard} />
    </g>
  ),
  dragon: (p) => (
    <g {...S}>
      <path d="M6 50 C14 50 18 40 26 40 C30 30 40 26 48 30 L58 24 L54 34 C56 40 50 48 40 48 H22 C16 52 10 54 6 50Z" fill={C.pickle} />
      <path d={`M30 40 L${24 + p * 4} ${20 - p * 6} L40 34Z`} fill={C.pink} />
      <circle cx={50} cy={32} r={2} fill={C.ink} />
    </g>
  ),
  tennis: () => (
    <g {...S}>
      <rect x={4} y={14} width={56} height={36} fill={C.pickle} />
      <path d="M32 14 V50 M4 24 H60 M4 40 H60 M18 24 V40 M46 24 V40" stroke={C.paper} strokeWidth={2.5} />
      <rect x={4} y={14} width={56} height={36} fill="none" />
    </g>
  ),
  fort: () => (
    <g {...S}>
      <path d="M4 56 L32 10 L60 56Z" fill={C.fizz} />
      <path d="M32 10 L24 56 M32 10 L40 56" strokeWidth={2.5} />
      <path d="M26 56 Q32 40 38 56Z" fill={C.ink} />
    </g>
  ),
  notebook: () => (
    <g {...S}>
      <rect x={12} y={4} width={42} height={56} rx={4} fill={C.paper} />
      <path d="M12 4 V60" strokeWidth={6} />
      <path d="M22 18 H46 M22 28 H46 M22 38 H40" strokeWidth={2.5} stroke={C.fizz} />
    </g>
  ),
  stand: (p) => (
    <g {...S}>
      <path d={`M8 22 L${32 + Math.sin(p * 6.28) * 4} 6 L56 22Z`} fill={C.mustard} />
      <path d="M8 22 H56" />
      <path d="M12 22 V56 M52 22 V56" />
      <rect x={10} y={34} width={44} height={22} fill={C.paper} />
      <path d="M18 44 H46" strokeWidth={2.5} />
    </g>
  ),
  static: (p) => (
    <g {...S}>
      <rect x={6} y={10} width={52} height={40} rx={6} fill={C.ink2} />
      {Array.from({length: 18}, (_, i) => (
        <rect key={i} x={10 + ((i * 7 + Math.floor(p * 30) * 3) % 42)} y={14 + ((i * 11) % 32)} width={4} height={3} fill={C.paper} strokeWidth={0} />
      ))}
      <path d="M22 56 H42" />
    </g>
  ),
  spinner: (p) => (
    <g {...S} fill="none">
      <circle cx={32} cy={32} r={22} stroke={C.paper2} strokeWidth={8} />
      <path d="M32 10 A22 22 0 0 1 54 32" strokeWidth={8} stroke={C.tangerine} transform={`rotate(${p * 360} 32 32)`} />
    </g>
  ),
  sneeze: () => (
    <g {...S}>
      <circle cx={24} cy={34} r={16} fill={C.mustard} />
      <path d="M18 30 L22 32 L18 34 M30 30 L26 32 L30 34" strokeWidth={2.5} fill="none" />
      <path d="M44 24 L58 18 M46 34 L60 34 M44 44 L58 50" strokeWidth={3} />
    </g>
  ),
  airport: () => (
    <g {...S}>
      <rect x={6} y={10} width={52} height={36} rx={4} fill={C.ink} />
      <path d="M12 20 H24 M30 20 H52 M12 30 H20 M26 30 H44 M12 40 H30" stroke={C.mustard} strokeWidth={3} />
      <path d="M18 58 H46 M32 46 V58" />
    </g>
  ),
};

export type GlyphName = keyof typeof G;
export const GLYPHS = Object.keys(G) as GlyphName[];

export const Glyph: React.FC<{name: GlyphName; size?: number; pose?: number; style?: React.CSSProperties}> = ({
  name,
  size = 64,
  pose = 0,
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{overflow: 'visible', display: 'block', ...style}}>
    {G[name](pose)}
  </svg>
);
