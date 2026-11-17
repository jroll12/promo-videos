// VERSE 3 (bars 68-79): the final fast burst. A fresh window opens with 3 tabs and multiplies to 160 slivers on the
// beat; every tab is a scene. Camera at its most chaotic (whips, punches, jump cuts on beats and eighths) except the
// literal gags, which sit still for a whole bar each:
//   v3.01 paper plane lands on tennis court 3   v3.05 houseplant THRIVING in a thunderstorm
//   v3.07 lemonade stand open in a hurricane    v3.08 the same plane takes off towing GOOD VIBES 4 SALE across the tabs
// The last bar rushes the camera back to REST_POSE while the window settles onto HOOK_WINDOW, so the hard cut on the
// downbeat lands on the final hook's centred layout.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SectionProps} from '../../lib/sectionRoot';
import {useGlobalFrame} from '../../lib/context';
import {Camera, CutFlash, Pose, REST_POSE, WhipLines, addPose, punch, shake, whip} from '../../lib/camera';
import {BROWSER_CHROME_H, BrowserWindow, Desktop, TabSpec} from '../../lib/chrome';
import {ConfettiField, DebrisLayer} from '../../lib/confetti';
import {KineticLine} from '../../lib/type';
import {clamp, ease, lerp, popIn, prog} from '../../lib/motion';
import {HOOK_WINDOW, VERSE_WINDOW, tabCountAt} from '../../data/contract';
import {beatAt, frameOfBar, frameOfBeat, line, section} from '../../data/timing';
import {CourtScene, HurricaneScene, SkyScene, StormScene, TabMosaic, VibesPlane} from './scenes';

const S = section('verse3');
const SB = S.startBar;
const B0 = SB * 4; // first beat of the section
const beatF = (b: number) => frameOfBeat(B0 + b); // section-relative beat -> global frame
const barF = (k: number) => frameOfBar(SB + k); // section-relative bar -> global frame

// ------------------------------------------------------------------ bars (one line per bar)
const BAR_COURT = 0; // v3.01
const BAR_PLANT = 4; // v3.05
const BAR_HURRICANE = 6; // v3.07
const BAR_VIBES = 7; // v3.08
const BAR_LAST = 11; // v3.12

// Tab that appears on a bar's downbeat (the newest tab then). Small offset so rounding never lands on the beat before.
const newestAt = (k: number) => tabCountAt(frameOfBeat(B0 + k * 4 + 0.1)) - 1;
const TAB_COURT = 0;
const TAB_PLANT = newestAt(BAR_PLANT);
const TAB_HURRICANE = newestAt(BAR_HURRICANE);
const TAB_VIBES = newestAt(BAR_VIBES);
const NAMED: Record<number, TabSpec> = {
  [TAB_COURT]: {title: 'court 3: now landing', glyph: 'tennis', color: 'pickle'},
  [TAB_PLANT]: {title: 'storm (plant: thriving)', glyph: 'plant', color: 'pickle'},
  [TAB_HURRICANE]: {title: 'lemonade (still open)', glyph: 'stand', color: 'mustard'},
  [TAB_VIBES]: {title: 'good vibes 4 sale', glyph: 'plane', color: 'fizz'},
};

// ------------------------------------------------------------------ camera

const P = (x: number, y: number, scale: number, rot = 0): Pose => ({x, y, scale, rot});
const GAG = P(960, 578, 1.1);
const WIDE = P(960, 528, 1);
const TABS_L = P(540, 262, 2.3, -4);
const TABS_R = P(1380, 262, 2.3, 4);
const MOS_A = P(640, 560, 1.7, -3);
const MOS_B = P(1290, 650, 1.8, 3);
const MOS_C = P(960, 610, 1.45, -1.5);
const TILT = P(960, 540, 1.02, -4);
const TILT_R = P(960, 540, 1.04, 3.5);
const FULL_L = P(960, 545, 0.93, -2.5);
const FULL_R = P(960, 535, 0.97, 2);
const SKY = P(960, 470, 1.08);
const RUSH_FROM = P(1460, 280, 1.9, 6);

type Shot = {b: number; pose: Pose; move: 'cut' | 'whip'; dur?: number; amp?: number; hit?: number; flash?: boolean};
// b = section-relative beat. Cuts land only on beats or eighths. amp = shake, hit = zoom punch on arrival.
const SHOTS: Shot[] = [
  {b: 0, pose: GAG, move: 'cut', amp: 1.5, hit: 0.04}, // v3.01 court: hold the bar
  {b: 4, pose: TABS_L, move: 'whip', amp: 5}, // v3.02
  {b: 5, pose: MOS_A, move: 'cut', amp: 5, hit: 0.08, flash: true},
  {b: 6, pose: TABS_R, move: 'whip', amp: 5},
  {b: 7, pose: TILT, move: 'cut', amp: 5, hit: 0.1, flash: true},
  {b: 8, pose: MOS_B, move: 'cut', amp: 6, hit: 0.08, flash: true}, // v3.03
  {b: 9, pose: TABS_L, move: 'whip', amp: 6},
  {b: 10, pose: TILT_R, move: 'cut', amp: 6, hit: 0.1, flash: true},
  {b: 11, pose: MOS_A, move: 'whip', amp: 6},
  {b: 12, pose: WIDE, move: 'cut', amp: 6, hit: 0.12, flash: true}, // v3.04
  {b: 13, pose: MOS_C, move: 'cut', amp: 6, hit: 0.08},
  {b: 14, pose: TABS_R, move: 'cut', amp: 6, hit: 0.08, flash: true},
  {b: 15, pose: TABS_L, move: 'cut', amp: 6, hit: 0.08, flash: true},
  {b: 16, pose: P(960, 590, 1.12), move: 'whip', amp: 1.5}, // v3.05 plant: hold the bar
  {b: 20, pose: TABS_R, move: 'whip', amp: 7}, // v3.06
  {b: 21, pose: MOS_B, move: 'cut', amp: 7, hit: 0.1, flash: true},
  {b: 22, pose: MOS_A, move: 'whip', amp: 7},
  {b: 23, pose: TILT, move: 'cut', amp: 7, hit: 0.12, flash: true},
  {b: 24, pose: P(960, 590, 1.1), move: 'whip', amp: 2.5}, // v3.07 hurricane: hold the bar
  {b: 28, pose: SKY, move: 'cut', amp: 1.5, hit: 0.05, flash: true}, // v3.08 plane: hold the bar
  {b: 32, pose: TABS_L, move: 'whip', amp: 8}, // v3.09
  {b: 33, pose: TABS_R, move: 'whip', amp: 8},
  {b: 34, pose: MOS_C, move: 'whip', amp: 8},
  {b: 35, pose: TILT_R, move: 'cut', amp: 8, hit: 0.12, flash: true},
  {b: 36, pose: MOS_A, move: 'cut', amp: 9, hit: 0.08, flash: true}, // v3.10
  {b: 36.5, pose: MOS_B, move: 'cut', amp: 9, hit: 0.06},
  {b: 37, pose: TABS_L, move: 'cut', amp: 9, hit: 0.08, flash: true},
  {b: 38, pose: MOS_C, move: 'cut', amp: 9, hit: 0.08},
  {b: 38.5, pose: TABS_R, move: 'cut', amp: 9, hit: 0.06, flash: true},
  {b: 39, pose: WIDE, move: 'whip', amp: 9},
  {b: 40, pose: FULL_L, move: 'cut', amp: 7, hit: 0.1, flash: true}, // v3.11 paint: wide so the splatter shows
  {b: 41, pose: FULL_R, move: 'cut', amp: 7, hit: 0.1},
  {b: 42, pose: FULL_L, move: 'cut', amp: 7, hit: 0.1, flash: true},
  {b: 43, pose: FULL_R, move: 'cut', amp: 7, hit: 0.1},
  {b: 44, pose: RUSH_FROM, move: 'whip', dur: 5, amp: 4}, // v3.12: whip out, then rush home
  {b: 44.5, pose: REST_POSE, move: 'whip', amp: 0}, // dur set below: arrives by beat 46, then holds still
];
const RUSH_START = beatF(44.5);
const RUSH_END = beatF(46);

const cameraAt = (frame: number) => {
  let k = 0;
  SHOTS.forEach((s, i) => {
    if (beatF(s.b) <= frame) k = i;
  });
  const shot = SHOTS[k];
  const at = beatF(shot.b);
  let base = shot.pose;
  let blur = 0;
  let amount = 0;
  let angle = 0;
  if (shot.move === 'whip' && k > 0) {
    const dur = shot.b === 44.5 ? RUSH_END - RUSH_START : shot.dur ?? 6;
    const w = whip(frame, at, SHOTS[k - 1].pose, shot.pose, dur);
    base = w.pose;
    blur = w.blur;
    amount = w.amount;
    angle = w.angle;
  }
  // shake dies out over the rush so the last beat sits exactly on REST_POSE
  const settle = 1 - prog(frame, RUSH_START, RUSH_END);
  const amp = (shot.amp ?? 4) * (shot.b >= 44.5 ? settle : 1);
  let pose = amp > 0 ? addPose(base, shake(frame, 303 + k, amp)) : base;
  const hitAt = shot.move === 'whip' ? at + (shot.dur ?? 6) : at;
  let z = shot.hit ? punch(frame, hitAt, shot.hit, 8) : 1;
  // lightning punches in the plant bar, a punch on every paint beat
  for (const b of [17, 18, 19]) z *= punch(frame, beatF(b), 0.035, 6);
  pose = {...pose, scale: pose.scale * z};
  return {pose, blur, amount, angle, cutAt: at, flash: !!shot.flash};
};

// ------------------------------------------------------------------ section

const Section: React.FC<SectionProps> = () => {
  const frame = useGlobalFrame();
  const cam = cameraAt(frame);
  const pose = cam.pose;

  // which bar (= which line) we are in
  let bar = 0;
  for (let k = 0; k < S.bars; k++) if (frame >= barF(k)) bar = k;

  // tabs: contract count, newest pops on the beat it appears
  const count = tabCountAt(frame);
  const beatStart = frameOfBeat(Math.floor(beatAt(frame) + 1e-6));
  const grew = count > tabCountAt(beatStart - 1);
  const newestPop = grew ? popIn(frame, beatStart, 6) : 1;
  const active = bar === BAR_COURT ? TAB_COURT : bar === BAR_PLANT ? TAB_PLANT : bar === BAR_HURRICANE ? TAB_HURRICANE : bar === BAR_VIBES ? TAB_VIBES : count - 1;

  // window: fresh one pops open on the section's first frame; in the last bar it settles onto the hook window
  const open = 0.72 + 0.28 * popIn(frame, S.startFrame, 8);
  const m = ease.inOutCubic(prog(frame, RUSH_START, RUSH_END));
  const win = {
    x: lerp(VERSE_WINDOW.x, HOOK_WINDOW.x, m),
    y: lerp(VERSE_WINDOW.y, HOOK_WINDOW.y, m),
    w: lerp(VERSE_WINDOW.w, HOOK_WINDOW.w, m),
    h: lerp(VERSE_WINDOW.h, HOOK_WINDOW.h, m),
  };
  const cw = win.w;
  const ch = win.h - BROWSER_CHROME_H;
  const box = {frame, w: cw, h: ch};

  let content: React.ReactNode;
  let url = `confetti://tabs?open=${count}`;
  if (bar === BAR_COURT) {
    url = 'courts://book/court-3?arrival=paper-plane';
    const court = line('v3.01');
    const touch = court.words.find((w) => w.w.startsWith('court'))?.startFrame ?? court.endFrame;
    content = <CourtScene {...box} start={S.startFrame} touchdown={touch} />;
  } else if (bar === BAR_PLANT) {
    url = 'weather://now?alert=thunderstorm&houseplant=thriving';
    content = <StormScene {...box} start={barF(BAR_PLANT)} flashes={[0, 1, 2, 3].map((b) => beatF(BAR_PLANT * 4 + b))} />;
  } else if (bar === BAR_HURRICANE) {
    url = 'radar://hurricane?lemonade-stand=open';
    content = <HurricaneScene {...box} start={barF(BAR_HURRICANE)} />;
  } else if (bar === BAR_VIBES) {
    url = 'vibes://sale?delivery=paper-plane';
    content = <SkyScene {...box} start={barF(BAR_VIBES)} />;
  } else {
    if (bar === BAR_LAST) url = 'confetti://glovebox';
    content = <TabMosaic {...box} count={count} named={NAMED} newest={count - 1} popAt={beatStart} seed={700 + bar} />;
  }

  // v3.08: the plane from court 3 lifts off its own tab (far left) and crosses the whole tab bar
  let plane: React.ReactNode = null;
  if (bar === BAR_VIBES) {
    const t = prog(frame, barF(BAR_VIBES) - 2, barF(BAR_VIBES + 1));
    const px = lerp(560, 1720, t);
    const py = 236 + Math.sin(t * Math.PI * 2) * 40 - Math.sin(t * Math.PI) * 50;
    plane = <VibesPlane frame={frame} x={px} y={py} dir={Math.cos(t * Math.PI * 2) * -10} trail={60} />;
  }

  // the glovebox icon answers "glovebox" on the last line
  const gb = line('v3.12');
  const gw = gb.words.find((w) => w.w.toLowerCase().startsWith('glovebox'))?.startFrame ?? gb.endFrame;
  const iconPose = bar === BAR_LAST ? 0.35 * Math.sin(clamp((frame - gw) / 14) * Math.PI) : 0;

  return (
    <AbsoluteFill>
      <Camera pose={pose} blur={cam.blur}>
        <Desktop frame={frame} iconPose={iconPose}>
          <BrowserWindow
            x={win.x}
            y={win.y}
            w={win.w}
            h={win.h}
            tabs={count}
            named={NAMED}
            active={active}
            newestPop={newestPop}
            url={url}
            scale={open}
          >
            <div style={{position: 'absolute', left: 0, top: 0, width: cw, height: ch, overflow: 'hidden'}}>{content}</div>
          </BrowserWindow>
          {plane}
        </Desktop>
      </Camera>
      <DebrisLayer frame={frame} pose={pose} />
      <ConfettiField frame={frame} />
      <KineticLine line={line('v3.05')} frame={frame} y={985} size={58} rot={-2} />
      <KineticLine line={line('v3.08')} frame={frame} y={985} size={58} rot={2} card="paper" />
      <KineticLine line={line('v3.12')} frame={frame} y={150} size={60} rot={0} tail={0} />
      <WhipLines amount={cam.amount} angle={cam.angle} seed={33} />
      {cam.flash && <CutFlash frame={frame} at={cam.cutAt} />}
    </AbsoluteFill>
  );
};
export default Section;
