// BRIDGE (bars 60-67): rhythmic, counting and stacking. Hard cuts on every beat or two across the desktop apps,
// small punches on each cut, no whips. Literal gags: br.04 laundry dynasty, br.06 half-done symmetry,
// br.07(+br.08) tiny trophies stacked into a tower in the glovebox's thought bubble.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SectionProps} from '../../lib/sectionRoot';
import {useGlobalFrame, useShowLyrics} from '../../lib/context';
import {Camera, Pose, REST_POSE, pose, punch} from '../../lib/camera';
import {BROWSER_CHROME_H, BrowserWindow, Desktop} from '../../lib/chrome';
import {ConfettiBurst, ConfettiField, DebrisLayer} from '../../lib/confetti';
import {LyricCard} from '../../lib/type';
import {clamp, ease} from '../../lib/motion';
import {ColorName} from '../../lib/theme';
import {VERSE_WINDOW, tabCountAt} from '../../data/contract';
import {Line, beatAt, frameOfBeat, line, linesOf, section} from '../../data/timing';
import {CountingList, HostileCalendar, LaundryDynasty, MapsPage, MirrorApp, SnackLab, TOWER, TrophyMind, WaitStack} from './scenes';

const S = section('bridge');
const BASE = S.startBar * 4; // global beat index of bar 60, beat 1
const bf = (r: number) => frameOfBeat(BASE + r); // frame of relative beat r (0..32)
// Relative beat index at a frame, exact against the rounded beat frames.
const relBeat = (frame: number) => {
  let k = Math.floor(beatAt(frame) - BASE);
  if (frame >= bf(k + 1)) k++;
  else if (frame < bf(k)) k--;
  return k;
};

type Kind = 'maps' | 'lab' | 'list' | 'calendar' | 'laundry' | 'wait' | 'mirror' | 'trophy';
type Shot = {r: number; kind: Kind; pose: Pose; checked?: number};
const SHOTS: Shot[] = [
  // bar 60: br.01 "left-turn energy" - every beat the camera turns a little further left
  {r: 0, kind: 'maps', pose: pose(960, 540, 1, 0)},
  {r: 1, kind: 'maps', pose: pose(880, 560, 1.2, -4)},
  {r: 2, kind: 'maps', pose: pose(780, 580, 1.45, -8)},
  {r: 3, kind: 'maps', pose: pose(690, 600, 1.75, -12)},
  // bar 61: br.02 snack-pack chemistry, list cutaway on beat 3
  {r: 4, kind: 'lab', pose: pose(960, 520, 1)},
  {r: 5, kind: 'lab', pose: pose(960, 470, 1.3)},
  {r: 6, kind: 'list', pose: pose(960, 470, 1.15), checked: 2},
  {r: 7, kind: 'lab', pose: pose(960, 560, 1.4)},
  // bar 62: list, then br.03 calendar enemies march (callback)
  {r: 8, kind: 'list', pose: pose(960, 470, 1.25), checked: 3},
  {r: 9, kind: 'calendar', pose: pose(960, 520, 1)},
  {r: 10, kind: 'calendar', pose: pose(1000, 700, 1.4)},
  {r: 11, kind: 'calendar', pose: pose(820, 690, 1.7, -3)},
  // bar 63: br.04 laundry dynasty (wide holds 2 beats)
  {r: 12, kind: 'laundry', pose: pose(960, 520, 1)},
  {r: 14, kind: 'laundry', pose: pose(560, 480, 1.7)},
  {r: 15, kind: 'laundry', pose: pose(960, 500, 1.7)},
  // bar 64: br.05 "wait, what?" popups stack up one per beat
  {r: 16, kind: 'wait', pose: pose(760, 420, 1.3)},
  {r: 17, kind: 'wait', pose: pose(860, 480, 1.25)},
  {r: 18, kind: 'wait', pose: pose(960, 540, 1.2)},
  {r: 19, kind: 'wait', pose: pose(960, 560, 1.05)},
  // bar 65: br.06 half-done symmetry, locked and centred for the whole bar
  {r: 20, kind: 'mirror', pose: REST_POSE},
  // bar 66: list, then br.07 tiny victories; bar 67: br.08 stacked up mentally, camera climbs the tower
  {r: 24, kind: 'list', pose: pose(960, 560, 1.25), checked: 7},
  {r: 25, kind: 'trophy', pose: pose(960, 520, 1)},
  {r: 26, kind: 'trophy', pose: pose(960, 600, 1.4)},
  {r: 27, kind: 'trophy', pose: pose(960, 540, 1.15)},
  {r: 28, kind: 'trophy', pose: pose(960, 560, 1.5)},
  {r: 29, kind: 'trophy', pose: pose(960, 450, 1.6)},
  {r: 30, kind: 'trophy', pose: pose(960, 340, 1.7)},
  {r: 31, kind: 'trophy', pose: pose(960, 480, 1.0)},
];
const shotAt = (frame: number) => {
  const k = relBeat(frame);
  let cur = SHOTS[0];
  for (const s of SHOTS) if (s.r <= k) cur = s;
  return cur;
};

// ---- gag timing, all from the beat grid and line ids
const TURNS = [0, 1, 2, 3].map((r) => bf(r));
const LAB_SEGS = [4, 5, 6, 7].map((r) => bf(r));
const LAUNDRY_AT = line('br.04').startFrame;
const WAIT_AT = [16, 17, 18, 19].map((r) => bf(r));
const MIRROR_BEATS = [20, 21, 22, 23].map((r) => bf(r));
const TROPHIES = [line('br.07').startFrame, bf(26), bf(27), ...[0, 1, 2, 3, 4, 5, 6, 7].map((j) => frameOfBeat(BASE + 28 + j * 0.5))];

// br.01 is grid-timed and starts in the previous hook's tail: "I got" is a pickup, "left-turn" lands on bar 60.
const BR01: Line = (() => {
  const l = line('br.01');
  const at = [bf(-2), bf(-1), bf(0), bf(2)];
  return {...l, words: l.text.split(/\s+/).map((w, i) => ({w, start: 0, end: 0, startFrame: at[i], p: 1}))};
})();
const LYRICS: Line[] = linesOf('bridge').map((l) => (l.id === 'br.01' ? BR01 : l));
const LITERAL = new Set(['br.04', 'br.06', 'br.07', 'br.08']);

const BridgeLyric: React.FC<{frame: number; kind: Kind}> = ({frame, kind}) => {
  const show = useShowLyrics();
  if (!show) return null;
  let idx = 0;
  LYRICS.forEach((l, i) => {
    if (l.startFrame - 2 <= frame) idx = i;
  });
  const l = LYRICS[idx];
  const enter = idx === 0 ? 1 : ease.outBack(clamp((frame - (l.startFrame - 2)) / 6));
  const card: ColorName = LITERAL.has(l.id) ? 'mustard' : 'paper';
  const at =
    kind === 'mirror'
      ? {x: 960, y: 1010, align: 'center' as const, rot: 0}
      : kind === 'trophy'
        ? {x: 70, y: 990, align: 'left' as const, rot: idx % 2 ? 2 : -2}
        : {x: 70, y: 990, align: 'left' as const, rot: idx % 2 ? 2 : -2};
  return <LyricCard line={l} frame={frame} size={64} x={at.x} y={at.y} align={at.align} rot={at.rot} card={card} enter={enter} width={1100} stretch={115} />;
};

const Section: React.FC<SectionProps> = () => {
  const frame = useGlobalFrame();
  const shot = shotAt(frame);
  const cutAt = bf(shot.r);
  const camPose: Pose = {...shot.pose, scale: shot.pose.scale * (shot.kind === 'mirror' ? 1 : punch(frame, cutAt, 0.04, 6))};
  const tabs = tabCountAt(frame);
  const content = {w: VERSE_WINDOW.w - 8, h: VERSE_WINDOW.h - BROWSER_CHROME_H - 8};

  return (
    <AbsoluteFill>
      <Camera pose={camPose}>
        <Desktop frame={frame} menuTitle={shot.kind === 'maps' ? 'Browser' : shot.kind === 'list' ? 'Notes' : shot.kind === 'calendar' ? 'Calendar' : 'Browser'}>
          <BrowserWindow {...VERSE_WINDOW} tabs={tabs} active={tabs - 1} url="confetti://maps/directions?avoid=right_turns">
            <MapsPage frame={frame} w={content.w} h={content.h} turnsAt={TURNS} />
          </BrowserWindow>
          {shot.kind === 'lab' && <SnackLab frame={frame} x={360} y={110} w={1200} h={720} segAt={LAB_SEGS} />}
          {shot.kind === 'list' && <CountingList frame={frame} checked={shot.checked ?? 1} at={cutAt} />}
          {shot.kind === 'calendar' && <HostileCalendar frame={frame} x={360} y={130} w={1200} h={780} marchFrom={bf(9)} />}
          {shot.kind === 'laundry' && <LaundryDynasty frame={frame} x={210} y={96} w={1500} h={860} at={LAUNDRY_AT} eighth={(k) => frameOfBeat(BASE + 12 + k * 0.5)} crownAt={bf(15)} />}
          {shot.kind === 'wait' && <WaitStack frame={frame} at={WAIT_AT} />}
          {shot.kind === 'mirror' && <MirrorApp frame={frame} x={70} y={66} w={1780} h={960} at={bf(20)} beats={MIRROR_BEATS} />}
          {shot.kind === 'trophy' && <TrophyMind frame={frame} at={TROPHIES} swayFrom={bf(28)} />}
        </Desktop>
      </Camera>
      <DebrisLayer frame={frame} pose={camPose} />
      <ConfettiField frame={frame} />
      {shot.kind === 'laundry' && <ConfettiBurst frame={frame} at={bf(15)} x={960} y={420} count={90} seed={61} life={30} />}
      {shot.kind === 'trophy' && <ConfettiBurst frame={frame} at={TROPHIES[TROPHIES.length - 1]} x={960} y={540 + (TOWER.base - TOWER.step * TROPHIES.length - 480)} count={70} seed={62} life={24} />}
      <BridgeLyric frame={frame} kind={shot.kind} />
    </AbsoluteFill>
  );
};
export default Section;
