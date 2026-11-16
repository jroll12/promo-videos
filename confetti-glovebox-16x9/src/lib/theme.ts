// The only place colours, type and shape constants are defined. Sections import from here; hex literals in
// src/sections fail tools/continuity.mjs.

export const C = {
  ink: '#1B1A2E', // outlines, text, hard shadows
  ink2: '#4A4763', // secondary text, inactive tab labels
  paper: '#FFF4E0', // desktop, window bodies
  paper2: '#F4E2C2', // tab bar, inactive tabs, panels
  tangerine: '#FF7A1A', // the hook colour, the active tab, the pin
  pickle: '#5BB04A',
  fizz: '#3EA6FF',
  pink: '#FF5FA2', // confetti pink
  mustard: '#FFC93C', // highlight, cursor fill on click, receipts
} as const;

export type ColorName = keyof typeof C;

// Confetti and debris draw only from these.
export const CONFETTI_COLORS = [C.tangerine, C.pickle, C.fizz, C.pink, C.mustard] as const;

// Background of the world beyond the desktop, seen only in the final pull-back.
export const WORLD_BG = C.paper2;

export const FONT = {
  display: "'Archivo', 'Arial Black', sans-serif", // hook type, UI labels. Use fontStretch for width.
  mono: "'JetBrains Mono', 'Courier New', monospace", // tab titles, URLs, timestamps
} as const;

export const SHAPE = {
  stroke: 4, // ink outline width at 1080p
  thin: 2.5, // small UI parts (tab separators, glyph details)
  radius: 14, // the one corner radius (windows, popups, buttons)
  radiusSmall: 8, // tabs, chips
  shadow: 8, // hard offset shadow, down-right, ink, no blur
} as const;

export const hardShadow = (d: number = SHAPE.shadow) => `${d}px ${d}px 0 ${C.ink}`;
export const outline = (w: number = SHAPE.stroke) => `${w}px solid ${C.ink}`;

export const W = 1920;
export const H = 1080;
