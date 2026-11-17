// Verse 2 cue sheet. Every time here comes from the timing helpers (bars relative to the section's first bar, line
// ids and word starts). No literal frame numbers.
import {frameOfBar, frameOfBeat, beatAt, line, section} from '../../data/timing';
import {tabCountAt, VERSE_WINDOW} from '../../data/contract';
import {SHAPE} from '../../lib/theme';
import {BROWSER_CHROME_H} from '../../lib/chrome';
import type {TabSpec} from '../../lib/chrome';
import {wordsOf} from '../../lib/type';

export const SEC = section('verse2');
// frame of a bar offset inside the section (0 = bar 30 downbeat)
export const B = (x: number) => frameOfBar(SEC.startBar + x);
export const beatOfBar = (x: number) => (SEC.startBar + x) * 4;
// start frame of the first word of a line that begins with `w` (case-insensitive)
export const W = (id: string, w: string) => {
  const ws = wordsOf(line(id));
  const hit = ws.find((x) => x.w.toLowerCase().replace(/[^a-z]/g, '').startsWith(w));
  return hit ? hit.at : line(id).startFrame;
};
export const nearestBeatFrame = (f: number, plus = 0) => frameOfBeat(Math.round(beatAt(f)) + plus);

// Content area of the verse browser window in world px (BrowserWindow: outer border, 124 px chrome, plus the
// address bar's own top and bottom borders).
export const CO = {x: VERSE_WINDOW.x + SHAPE.stroke, y: VERSE_WINDOW.y + SHAPE.stroke + BROWSER_CHROME_H + 2 * SHAPE.stroke};
export const CW = VERSE_WINDOW.w - 2 * SHAPE.stroke;
export const CH = VERSE_WINDOW.h - 2 * SHAPE.stroke - BROWSER_CHROME_H - 2 * SHAPE.stroke;
export const CONTENT_CENTER = {x: CO.x + CW / 2, y: CO.y + CH / 2};

export const CUE = {
  start: SEC.startFrame,
  drawerTight: B(0.25),
  plansIn: B(0.75),
  planFirst: W('v2.02', 'plan'),
  planMoreFrom: W('v2.02', 'then'),
  planMoreTo: W('v2.02', 'more'),
  montage1: B(2),
  me: B(4),
  probablyMe: B(4.375),
  libraryIn: B(4.75),
  sneezeFrom: W('v2.07', 'sneeze'),
  sneezeTo: line('v2.07').endFrame - 4,
  montage2: B(6.25),
  phoneIn: B(8.875),
  call: (i: number) => nearestBeatFrame(line('v2.11').startFrame, i),
  bossIn: B(9.75),
  bossWipe: W('v2.12', 'calendar'),
  bossWord: W('v2.12', 'boss'),
  screenWord: W('v2.12', 'screen'),
  bossTight: B(10.875),
  itemSel: line('v2.13').startFrame,
  equip: W('v2.13', 'underprepared'),
  bossWideBack: B(11.375),
  throwAt: W('v2.13', 'tangerine'),
  hit: W('v2.13', 'tangerine') + 8,
  montage3: B(12.5),
  paint: B(13.875),
  final: B(15),
  end: SEC.endFrame,
};

// Named gag tabs. Each gag gets the tab that was newest when it opened (distinct indices, always < count).
const newest = (f: number, min: number) => Math.max(min, tabCountAt(f) - 1);
export const TAB_IDX = (() => {
  const drawer = 0;
  const plans = 1;
  const library = newest(CUE.libraryIn, 2);
  const phone = newest(CUE.phoneIn, library + 1);
  const boss = newest(CUE.bossIn, phone + 1);
  const art = newest(CUE.paint, boss + 1);
  return {drawer, plans, library, phone, boss, art};
})();

export const NAMED: Record<number, TabSpec> = {
  [TAB_IDX.drawer]: {title: 'pencil drawer', glyph: 'pencil', color: 'mustard'},
  [TAB_IDX.plans]: {title: 'plan.txt', glyph: 'notebook', color: 'mustard'},
  [TAB_IDX.library]: {title: 'quiet library', glyph: 'sneeze', color: 'fizz'},
  [TAB_IDX.phone]: {title: '3 missed calls', glyph: 'phone', color: 'pink'},
  [TAB_IDX.boss]: {title: 'calendar: BOSS', glyph: 'calendar', color: 'tangerine'},
  [TAB_IDX.art]: {title: 'art from stuff', glyph: 'paint', color: 'pickle'},
};
