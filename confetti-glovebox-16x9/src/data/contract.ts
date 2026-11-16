// The continuity contract. READ-ONLY for section code.
//
// Everything that crosses a section boundary is defined here as a constant or as a pure function of the GLOBAL
// frame: how many tabs exist, how much confetti is in the air, where the dragged icon lives, the hook layout,
// and the debris ledger (in src/lib/confetti/debris.ts) that becomes the mural. Sections read these values and
// never store or derive their own versions, which is what lets eight sections be built in parallel.
import {SECTIONS, SectionId, barAt, frameOfBar, section} from './timing';

// ---------------------------------------------------------------- places on the desktop (desktop px, 1920x1080)

// Where the intro cursor drops the glovebox icon ("Right here? Cool."). It stays there for the whole film and is
// the point the mural's "You are here" pin touches. Bottom centre, so it sits under the hook window symmetrically.
export const ICON_HOME = {x: 960, y: 940} as const;
export const ICON_SIZE = 112;
export const ICON_LABEL = 'glovebox';

// The hook layout: one browser window, centred, icon centred below it.
export const HOOK_WINDOW = {x: 260, y: 92, w: 1400, h: 724} as const;
// The default browser window for verses before the camera does anything to it.
export const VERSE_WINDOW = {x: 110, y: 70, w: 1700, h: 900} as const;
export const MENU_BAR_H = 44;

// ---------------------------------------------------------------- camera hand-off

export type Pose = {x: number; y: number; scale: number; rot: number};
// Pose = world point at screen centre, zoom, rotation in degrees.
export const REST_POSE: Pose = {x: 960, y: 540, scale: 1, rot: 0};
// End pose of the final hook's pull-back; the outro starts on exactly this pose.
export const MURAL_POSE: Pose = {x: 960, y: 520, scale: 0.34, rot: 0};
// The pull-back runs over the last 4 bars of the final hook: bars 84..86 move, bar 87 holds.
export const PULLBACK_BARS = [84, 86.5] as const;
export const MURAL_FORM_BARS = [84.25, 87] as const;
// The browser window minimises into the icon just before the pull-back so the mural reads clean.
export const MINIMISE_BARS = [83.5, 84.25] as const;

// ---------------------------------------------------------------- hook intensities (one hook component, three uses)

export const HOOK_INTENSITY: Record<'hook1' | 'hook2' | 'hook3', number> = {hook1: 0.4, hook2: 0.7, hook3: 1.0};

// ---------------------------------------------------------------- tabs

// [count at section start, count at section end]. Verses multiply tabs until they are slivers; a new verse opens a
// fresh window that starts small again, with a higher ceiling each time. Hooks, pre-hook and bridge hold.
export const TABS: Record<SectionId, [number, number]> = {
  intro: [0, 1],
  verse1: [1, 48],
  hook1: [48, 48],
  verse2: [2, 96],
  prehook: [96, 96],
  hook2: [96, 96],
  bridge: [96, 96],
  verse3: [3, 160],
  hook3: [160, 160],
  outro: [160, 160],
};

// Integer tab count at a global frame. Inside a verse it grows exponentially and steps only on beats, so new tabs
// pop in time with the music. Sections may show FEWER tabs only while the camera is pushed in so far that the
// tab bar is off screen; whenever the full tab bar is visible it must show exactly this count.
export const tabCountAt = (frame: number): number => {
  const s = SECTIONS.find((x) => frame >= x.startFrame && frame < x.endFrame) ?? SECTIONS[SECTIONS.length - 1];
  const [a, b] = TABS[s.id];
  if (a === b) return a;
  if (s.id === 'intro') return frame >= frameOfBar(3.5) ? 1 : 0;
  const beats = s.bars * 4;
  const beat = Math.floor((barAt(frame) - s.startBar) * 4);
  const p = Math.max(0, Math.min(1, beat / (beats - 4))); // reaches the ceiling one bar before the section ends
  return Math.round(a * Math.pow(b / a, p));
};

// ---------------------------------------------------------------- confetti

// Confetti level 0..1, monotone over the film: sparse in verse 1, heavy by the final hook.
// [level at section start, level at section end].
export const CONFETTI: Record<SectionId, [number, number]> = {
  intro: [0, 0.02],
  verse1: [0.02, 0.14],
  hook1: [0.2, 0.24],
  verse2: [0.24, 0.4],
  prehook: [0.42, 0.46],
  hook2: [0.55, 0.6],
  bridge: [0.6, 0.66],
  verse3: [0.66, 0.8],
  hook3: [0.85, 1.0],
  outro: [1.0, 1.0],
};
export const confettiLevelAt = (frame: number): number => {
  const s = SECTIONS.find((x) => frame >= x.startFrame && frame < x.endFrame) ?? SECTIONS[SECTIONS.length - 1];
  const [a, b] = CONFETTI[s.id];
  const p = Math.max(0, Math.min(1, (frame - s.startFrame) / (s.endFrame - s.startFrame)));
  return a + (b - a) * p;
};
// Falling confetti on screen at level 1.0. Hooks may orbit instead of fall; the count is the same.
export const CONFETTI_MAX = 420;

// ---------------------------------------------------------------- pull-back and mural progress

const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const prog = (frame: number, [a, b]: readonly [number, number]) => ease((barAt(frame) - a) / (b - a));
export const pullbackAt = (frame: number) => prog(frame, PULLBACK_BARS); // 0..1
export const muralAt = (frame: number) => prog(frame, MURAL_FORM_BARS); // 0..1 (debris stagger is applied per piece)
export const minimiseAt = (frame: number) => prog(frame, MINIMISE_BARS); // 0..1
export const lerpPose = (a: Pose, b: Pose, t: number): Pose => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  // zoom interpolates in log space so the pull-back speed feels even
  scale: Math.exp(Math.log(a.scale) + (Math.log(b.scale) - Math.log(a.scale)) * t),
  rot: a.rot + (b.rot - a.rot) * t,
});

// ---------------------------------------------------------------- budget

// Literalisation budget per section: [min, max] lines drawn as a literal visual gag. Film total target 27..33 of 89.
export const GAG_BUDGET: Record<string, [number, number]> = {
  intro: [1, 2],
  verse1: [5, 6],
  hook: [3, 4], // per hook use; the same gags recur, so they count once toward the film total
  verse2: [5, 6],
  prehook: [1, 2],
  bridge: [2, 3],
  verse3: [4, 5],
  outro: [1, 2],
};

export const sectionRange = (id: SectionId) => {
  const s = section(id);
  return [s.startFrame, s.endFrame] as const;
};
