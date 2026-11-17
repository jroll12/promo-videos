// Verse 2 camera: a shot list built once from the cue sheet. Gags hold one framing for 2+ beats; between gags the
// montage jump-cuts on every beat and whips on every downbeat. cameraAt(frame) is a pure function of the frame.
import {Pose, tabCountAt, VERSE_WINDOW} from '../../data/contract';
import {frameOfBar, frameOfBeat} from '../../data/timing';
import {barIndex} from '../../lib/motion';
import {punch, shake, whip} from '../../lib/camera';
import {hash, seedOf} from '../../lib/rng';
import {B, beatOfBar, CONTENT_CENTER, CO, CUE, TAB_IDX} from './cues';
import {SPOON_LOCAL} from './pages';
import {BOSS_AT, bodyToWorld} from './BossFight';

export type Scene = 'drawer' | 'plans' | 'montage' | 'library' | 'phone' | 'boss' | 'art' | 'final';
export type Shot = {at: number; pose: Pose; whip: boolean; scene: Scene; punch: number; tab: number};

export const WHIP_FRAMES = 6;
const P = (x: number, y: number, scale: number, rot = 0): Pose => ({x, y, scale, rot});

// where the newest tab sits in the tab bar (world px) for a given count
const TAB_BAR_X = VERSE_WINDOW.x + 4 + 18 + 80 + 18;
const TAB_BAR_W = VERSE_WINDOW.w - 130;
const TAB_Y = VERSE_WINDOW.y + 4 + 66 - 25;
const newestTabX = (count: number) => {
  const w = Math.min(260, TAB_BAR_W / count);
  return TAB_BAR_X + (count - 0.5) * (w >= 14 ? w - 3 : w);
};

const CC = CONTENT_CENTER;
const WIDE = P(960, 520, 1);
const CONTENT = (scale: number, rot = 0) => P(CC.x, CC.y, scale, rot);

const montage = (fromBar: number, toBar: number, seed: number): Shot[] => {
  const out: Shot[] = [];
  const b0 = beatOfBar(fromBar);
  const b1 = beatOfBar(toBar);
  let prev = -1;
  for (let b = b0; b < b1; b++) {
    const at = frameOfBeat(b);
    const count = tabCountAt(at);
    const grew = count > tabCountAt(at - 1);
    const tab = grew ? count - 1 : Math.floor(hash(seed, b) * count);
    const nx = Math.min(1700, Math.max(380, newestTabX(count)));
    const sgn = hash(seed + 1, b) > 0.5 ? 1 : -1;
    const options: Pose[] = [
      WIDE,
      P(nx, TAB_Y + 30, 2.3, 3 * sgn),
      CONTENT(1.3, 4 * sgn),
      P(sgn > 0 ? 1350 : 620, TAB_Y + 60, 1.7, -3 * sgn),
      P(960, 540, 0.93, 5 * sgn),
    ];
    let k = Math.floor(hash(seed + 2, b) * options.length);
    if (k === prev) k = (k + 1) % options.length;
    prev = k;
    const down = b % 4 === 0;
    out.push({at, pose: options[k], whip: b === b0 || down, scene: 'montage', punch: down ? 0.12 : 0.06, tab});
  }
  return out;
};

const spoonWorld = {x: CO.x + SPOON_LOCAL.x, y: CO.y + SPOON_LOCAL.y};
const bossMid = bodyToWorld(520, 450);

export const SHOTS: Shot[] = [
  {at: CUE.start, pose: CONTENT(1.3, -2), whip: false, scene: 'drawer', punch: 0.16, tab: TAB_IDX.drawer},
  {at: CUE.drawerTight, pose: P(spoonWorld.x - 60, spoonWorld.y + 10, 1.9, 2), whip: false, scene: 'drawer', punch: 0.08, tab: TAB_IDX.drawer},
  {at: CUE.plansIn, pose: CONTENT(1.12, 1), whip: true, scene: 'plans', punch: 0.06, tab: TAB_IDX.plans},
  ...montage(2, 4, seedOf('v2-m1')),
  {at: CUE.me, pose: P(newestTabX(tabCountAt(CUE.me)), TAB_Y + 20, 2.8, -4), whip: false, scene: 'montage', punch: 0.2, tab: tabCountAt(CUE.me) - 1},
  {at: CUE.probablyMe, pose: P(960, 560, 0.95, 6), whip: false, scene: 'montage', punch: 0.2, tab: tabCountAt(CUE.probablyMe) - 1},
  {at: CUE.libraryIn, pose: CONTENT(1.22), whip: true, scene: 'library', punch: 0.08, tab: TAB_IDX.library},
  ...montage(6.25, 8.875, seedOf('v2-m2')),
  {at: CUE.phoneIn, pose: CONTENT(1.22, -1), whip: true, scene: 'phone', punch: 0.08, tab: TAB_IDX.phone},
  {at: CUE.bossIn, pose: CONTENT(1.15), whip: true, scene: 'boss', punch: 0.05, tab: TAB_IDX.boss},
  {at: CUE.bossTight, pose: P(bossMid.x, bossMid.y - 20, 1.6, -2), whip: false, scene: 'boss', punch: 0.08, tab: TAB_IDX.boss},
  {at: CUE.bossWideBack, pose: CONTENT(1.15, 1), whip: false, scene: 'boss', punch: 0.05, tab: TAB_IDX.boss},
  ...montage(12.5, 13.875, seedOf('v2-m3')),
  {at: CUE.paint, pose: P(960, 540, 1), whip: true, scene: 'art', punch: 0.04, tab: TAB_IDX.art},
  ...[0, 1, 2, 3].map((i): Shot => ({at: B(15 + i * 0.25), pose: P(960, 480, 1.08, i % 2 ? 1.5 : -1.5), whip: false, scene: 'final', punch: i === 0 ? 0.12 : 0.06, tab: -1})),
].sort((a, b) => a.at - b.at);

export const BOSS_HIT_WORLD = bodyToWorld(BOSS_AT.x, BOSS_AT.y);

export const cameraAt = (frame: number) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (SHOTS[k].at <= frame) i = k;
  const s = SHOTS[i];
  let pose = s.pose;
  let blur = 0, amount = 0, angle = 0;
  const whipping = s.whip && i > 0 && frame < s.at + WHIP_FRAMES;
  if (whipping) {
    const w = whip(frame, s.at, SHOTS[i - 1].pose, s.pose, WHIP_FRAMES);
    pose = w.pose;
    blur = w.blur;
    amount = w.amount;
    angle = w.angle;
  }
  const shot = whipping && frame < s.at + WHIP_FRAMES / 2 ? SHOTS[i - 1] : s;
  // extra hits: sneeze passing, boss hit, paint section downbeats
  let amp = 3;
  if (frame >= CUE.sneezeFrom && frame <= CUE.sneezeTo) amp = 9;
  if (frame >= CUE.hit) amp += 20 * Math.exp(-(frame - CUE.hit) / 5);
  let sc = punch(frame, s.at, s.punch, 9);
  if (shot.scene === 'art') sc *= punch(frame, frameOfBar(barIndex(frame)), 0.03, 9);
  const sh = shake(frame, seedOf('v2-shake'), amp);
  return {
    pose: {x: pose.x + (sh.x ?? 0), y: pose.y + (sh.y ?? 0), scale: pose.scale * sc, rot: pose.rot + (sh.rot ?? 0)},
    blur,
    amount,
    angle,
    shot,
  };
};
