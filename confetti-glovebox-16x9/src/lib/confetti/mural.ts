// The mural: a "You are here" map that all debris resolves into during the final hook's pull-back.
// Designed in SCREEN px at MURAL_POSE (1920x1080 frame), converted to world px for the ledger.
//   pin    : tangerine + pink confetti fill a map pin whose tip touches the glovebox icon (ICON_HOME)
//   route  : crumbs + spare confetti draw a looping dotted route from the bottom-left corner to the icon
//   lake   : fizz confetti, left;   park: pickle confetti, right (mirror images)
//   compass: mustard confetti star, bottom right
//   blocks : receipts as city blocks either side of the pin; one receipt is the "YOU ARE HERE" label
//   border : paint dots trace a frame around the map
// The top band (screen y < 300) stays clear for the hook type.
import {MURAL_POSE, ICON_HOME} from '../../data/contract';
import {C} from '../theme';
import {rng} from '../rng';
import type {Debris} from './debris';

const S = MURAL_POSE.scale;
export const screenToWorld = (sx: number, sy: number) => ({x: MURAL_POSE.x + (sx - 960) / S, y: MURAL_POSE.y + (sy - 540) / S});
export const worldToScreen = (wx: number, wy: number) => ({x: 960 + (wx - MURAL_POSE.x) * S, y: 540 + (wy - MURAL_POSE.y) * S});

const iconScreen = worldToScreen(ICON_HOME.x, ICON_HOME.y);
export const PIN = {cx: 960, cy: iconScreen.y - 250, r: 108, hole: 40, tipY: iconScreen.y - 30};

const inPin = (x: number, y: number) => {
  const dx = x - PIN.cx;
  const dy = y - PIN.cy;
  if (dx * dx + dy * dy <= PIN.hole * PIN.hole) return false;
  if (dx * dx + dy * dy <= PIN.r * PIN.r) return true;
  if (y < PIN.cy || y > PIN.tipY) return false;
  // tail: straight sides from the circle's tangent points down to the tip
  const t = (y - PIN.cy) / (PIN.tipY - PIN.cy);
  return Math.abs(dx) <= PIN.r * (1 - t) * 0.98;
};

// Fill a region with n points on a jittered grid, deterministic.
const fill = (n: number, seed: number, bbox: [number, number, number, number], inside: (x: number, y: number) => boolean) => {
  const r = rng(seed);
  const pts: {x: number; y: number}[] = [];
  let tries = 0;
  while (pts.length < n && tries < n * 400) {
    tries++;
    const x = bbox[0] + r() * (bbox[2] - bbox[0]);
    const y = bbox[1] + r() * (bbox[3] - bbox[1]);
    if (inside(x, y)) pts.push({x, y});
  }
  // relax: push points apart a few times so the fill reads as even
  for (let it = 0; it < 6; it++) {
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[j].x - pts[i].x;
        const dy = pts[j].y - pts[i].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 196 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const push = (14 - d) / 2 / d;
          const a = {x: pts[i].x - dx * push, y: pts[i].y - dy * push};
          const b = {x: pts[j].x + dx * push, y: pts[j].y + dy * push};
          if (inside(a.x, a.y)) pts[i] = a;
          if (inside(b.x, b.y)) pts[j] = b;
        }
      }
    }
  }
  return pts;
};

// Catmull-Rom through control points, resampled to n evenly spaced points.
const ROUTE = [
  [70, 1015], [230, 935], [380, 1000], [350, 860], [190, 800], [250, 690], [430, 720], [520, 860], [690, 960],
  [850, 1010], [1010, 965], [1190, 1015], [1390, 955], [1530, 830], [1430, 720], [1300, 780], [1340, 890],
  [1180, 905], [1060, 830], [960, 770],
] as const;
const routePoints = (n: number) => {
  const dense: {x: number; y: number}[] = [];
  const P = ROUTE.map(([x, y]) => ({x, y}));
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let s = 0; s < 40; s++) {
      const t = s / 40, t2 = t * t, t3 = t2 * t;
      dense.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  dense.push(P[P.length - 1]);
  const len = [0];
  for (let i = 1; i < dense.length; i++) len.push(len[i - 1] + Math.hypot(dense[i].x - dense[i - 1].x, dense[i].y - dense[i - 1].y));
  const total = len[len.length - 1];
  const out: {x: number; y: number}[] = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const target = (k / (n - 1)) * total;
    while (j < len.length - 2 && len[j + 1] < target) j++;
    const f = (target - len[j]) / Math.max(1e-6, len[j + 1] - len[j]);
    out.push({x: dense[j].x + (dense[j + 1].x - dense[j].x) * f, y: dense[j].y + (dense[j + 1].y - dense[j].y) * f});
  }
  return out;
};

const ellipse = (cx: number, cy: number, rx: number, ry: number) => (x: number, y: number) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const star = (cx: number, cy: number, R: number) => (x: number, y: number) => {
  const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
  // four-point compass star: union of two thin diamonds
  return dx / R + dy / (R * 0.28) <= 1 || dx / (R * 0.28) + dy / R <= 1 || Math.hypot(dx, dy) < R * 0.18;
};

const BORDER = 30;
const borderPoints = (n: number) => {
  const w = 1920 - 2 * BORDER, h = 1080 - 2 * BORDER, per = 2 * (w + h);
  return Array.from({length: n}, (_, i) => {
    let d = (i / n) * per;
    if (d < w) return {x: BORDER + d, y: BORDER};
    d -= w;
    if (d < h) return {x: BORDER + w, y: BORDER + d};
    d -= h;
    if (d < w) return {x: BORDER + w - d, y: BORDER + h};
    d -= w;
    return {x: BORDER, y: BORDER + h - d};
  });
};

// Receipt blocks: 2 columns x 4 rows each side of the pin, plus the label.
const BLOCKS = (() => {
  const out: {x: number; y: number; rot: number}[] = [];
  for (const side of [-1, 1]) for (let row = 0; row < 4; row++) for (let col = 0; col < 2; col++) {
    out.push({x: 960 + side * (300 + col * 82), y: 420 + row * 92, rot: (row + col) % 2 ? 90 : 0});
  }
  return out;
})();
export const LABEL = {x: 1150, y: 330, rot: -8, text: 'YOU ARE HERE'};

// Assigns mx/my/mw/mh/mrot (world px) to every piece, by kind and colour.
export const muralTargets = (all: Debris[]) => {
  const assign = (d: Debris, s: {x: number; y: number}, mwScreen: number, mhScreen: number, mrot: number) => {
    const w = screenToWorld(s.x, s.y);
    d.mx = w.x;
    d.my = w.y;
    d.mw = mwScreen / S;
    d.mh = mhScreen / S;
    d.mrot = mrot;
  };
  const conf = all.filter((d) => d.kind === 'confetti');
  const by = (c: string) => conf.filter((d) => d.color === c);
  const pinPieces = [...by(C.tangerine), ...by(C.pink)];
  fill(pinPieces.length, 11, [PIN.cx - PIN.r, PIN.cy - PIN.r, PIN.cx + PIN.r, PIN.tipY], inPin).forEach((p, i) =>
    assign(pinPieces[i], p, 14, 9, (i * 37) % 180),
  );
  const lake = by(C.fizz);
  fill(lake.length, 12, [90, 380, 410, 600], ellipse(250, 490, 160, 100)).forEach((p, i) => assign(lake[i], p, 14, 9, (i * 53) % 180));
  const park = by(C.pickle);
  fill(park.length, 13, [1510, 380, 1830, 600], ellipse(1670, 490, 160, 100)).forEach((p, i) => assign(park[i], p, 14, 9, (i * 29) % 180));
  const comp = by(C.mustard);
  fill(comp.length, 14, [1660, 840, 1860, 1040], star(1760, 940, 100)).forEach((p, i) => assign(comp[i], p, 12, 8, (i * 41) % 180));

  const crumbs = all.filter((d) => d.kind === 'crumb');
  routePoints(crumbs.length).forEach((p, i) => assign(crumbs[i], p, 11, 11, 0));

  const paint = all.filter((d) => d.kind === 'paint');
  borderPoints(paint.length).forEach((p, i) => assign(paint[i], p, 13, 0, 0));

  const receipts = all.filter((d) => d.kind === 'receipt');
  receipts.forEach((d, i) => {
    if (i === receipts.length - 1) {
      assign(d, {x: LABEL.x, y: LABEL.y}, 150, 54, LABEL.rot);
      d.label = LABEL.text;
    } else {
      const b = BLOCKS[i % BLOCKS.length];
      assign(d, b, 62, 78, b.rot);
    }
  });
};
