// PRE-HOOK (bars 46-49): half-time slow motion, zero gravity. The browser (96 tabs, held) comes apart gently: tabs
// lift out of their slots, the address bar slides, page blocks and icons drift; the desktop icon floats up. Two
// literal gags: ph.01 a map app where the cursor's dotted trail wanders everywhere; ph.02 straight UI lines (ruler,
// progress bar, divider) curl up and nap. ph.03 everything bobs on the beat (camera and UI; debris stays in the
// ledger). In the last half bar everything drifts back to the hook layout (HOOK_WINDOW, ICON_HOME, REST_POSE) so the
// hook can hard-cut in on the next downbeat.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SectionProps} from '../../lib/sectionRoot';
import {useGlobalFrame, useSection} from '../../lib/context';
import {Camera, Pose, REST_POSE} from '../../lib/camera';
import {Desktop, DesktopIcon} from '../../lib/chrome';
import {ConfettiField, DebrisLayer} from '../../lib/confetti';
import {KineticLine, wordsOf} from '../../lib/type';
import {clamp, ease, float, lerp, prog} from '../../lib/motion';
import {seedOf} from '../../lib/rng';
import {HOOK_WINDOW, ICON_HOME, VERSE_WINDOW, tabCountAt} from '../../data/contract';
import {barAt, beatAt, line} from '../../data/timing';
import {FloatBrowser} from './FloatBrowser';
import {MapWindow} from './MapWindow';
import {NapWindow} from './NapWindow';

type Rect = {x: number; y: number; w: number; h: number};
const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t)});
// Where the floating browser hangs mid-section: a little smaller than the verse window, so the icon shows below it.
const FLOAT_WINDOW: Rect = {x: 250, y: 128, w: 1420, h: 680};
const soft = ease.inOutSine;

const wordFrame = (id: string, starts: string) => {
  const w = wordsOf(line(id)).find((x) => x.w.toLowerCase().startsWith(starts));
  return w ? w.at : line(id).startFrame;
};

const Section: React.FC<SectionProps> = () => {
  const frame = useGlobalFrame();
  const s = useSection();
  const bar = barAt(frame) - s.startBar; // 0..4 inside the section

  // ---- global float envelope: lifts off over bar 1, drifts back home over the last half bar
  const settle = soft(prog(bar, 3.42, 3.97));
  const liftOff = soft(prog(bar, 0, 1));
  const loose = (0.35 + 0.65 * liftOff) * (1 - settle);
  // ph.03: the mess has a rhythm. Smooth lift on every beat, only during bar 3 (bar index 2 in the section).
  const rhythm = prog(bar, 1.9, 2.1) * (1 - prog(bar, 2.95, 3.35)) * (1 - settle);
  const lift = (1 + Math.cos(2 * Math.PI * beatAt(frame))) / 2;

  // ---- camera: slow half-time float, slightly zoomed so edges never show, settles exactly on REST_POSE
  const cf = float(frame, seedOf('ph-cam'), 22);
  const d = 1 - settle;
  const pose: Pose = {
    x: REST_POSE.x + cf.x * d,
    y: REST_POSE.y + cf.y * d - rhythm * lift * 9,
    scale: REST_POSE.scale * (1 + 0.07 * d),
    rot: REST_POSE.rot + cf.rot * 0.28 * d,
  };

  // ---- browser: verse window -> floating window -> hook window
  const r = lerpRect(lerpRect(VERSE_WINDOW, FLOAT_WINDOW, liftOff), HOOK_WINDOW, settle);
  const bf = float(frame, seedOf('ph-browser'), 18);
  const browser = {
    x: r.x + bf.x * loose,
    y: r.y + bf.y * loose - rhythm * lift * 8,
    w: r.w,
    h: r.h,
    rot: bf.rot * 0.4 * loose,
  };

  // ---- desktop icon floats up off its spot, then drifts home
  const icf = float(frame, seedOf('ph-icon'), 34);
  const icon = {
    x: ICON_HOME.x + icf.x * loose,
    y: ICON_HOME.y + (icf.y - 46) * loose - rhythm * lift * 10,
    rot: icf.rot * 2.4 * loose,
  };

  // ---- ph.01 map gag: trail walks from the line start to "map", holds, then the window floats off left
  const l1 = line('ph.01');
  const mapWord = wordFrame('ph.01', 'map');
  const trail = soft(prog(frame, l1.startFrame, mapWord + 6));
  const mapIn = ease.outCubic(prog(bar, -0.12, 0.15));
  const mapOut = soft(prog(bar, 1.47, 2.3));
  const mf = float(frame, seedOf('ph-map'), 16);
  const map = {
    x: 110 + mf.x - mapOut * 820,
    y: 250 + mf.y - mapOut * 160,
    rot: -3 + mf.rot * 0.5 - mapOut * 14,
    scale: lerp(0.9, 1, mapIn),
    show: mapIn > 0 && mapOut < 1,
  };

  // ---- ph.02 nap gag: the lines are straight on "straight line", curl on "takes a nap", snore, float off right
  const takes = wordFrame('ph.02', 'takes');
  const nap = wordFrame('ph.02', 'nap');
  const curlDur = Math.max(14, nap - takes + 4);
  const curls = [0, 4, 8].map((o) => soft(prog(frame, takes + o, takes + o + curlDur)) * (1 + 0.035 * Math.sin((frame - takes) / 7 + o)));
  const snore = clamp(prog(frame, nap - 2, nap + 8));
  const napIn = ease.outCubic(prog(bar, 0.88, 1.12));
  const napOut = soft(prog(bar, 2.5, 3.25));
  const nf = float(frame, seedOf('ph-nap'), 16);
  const napW = {
    x: 1090 + nf.x + napOut * 860,
    y: 268 + nf.y - napOut * 140,
    rot: 2.5 + nf.rot * 0.5 + napOut * 12,
    scale: lerp(0.88, 1, napIn),
    show: napIn > 0 && napOut < 1,
  };

  // ---- lyric cards (ph.03, ph.04): soft floating paper cards
  const k3 = float(frame, seedOf('ph-card3'), 14);
  const k4 = float(frame, seedOf('ph-card4'), 14);

  return (
    <AbsoluteFill>
      <Camera pose={pose}>
        <Desktop frame={frame} showIcon={false}>
          <FloatBrowser frame={frame} {...browser} tabs={tabCountAt(frame)} loose={loose} bob={rhythm} url="confetti://glovebox/zero-g" />
          <div style={{position: 'absolute', left: 0, top: 0, transform: `rotate(${icon.rot}deg)`, transformOrigin: `${icon.x}px ${icon.y}px`}}>
            <DesktopIcon x={icon.x} y={icon.y} />
          </div>
          {map.show && (
            <div style={{opacity: mapIn * (1 - prog(mapOut, 0.7, 1))}}>
              <MapWindow x={map.x} y={map.y} rot={map.rot} scale={map.scale} progress={trail} frame={frame} />
            </div>
          )}
          {napW.show && (
            <div style={{opacity: napIn * (1 - prog(napOut, 0.7, 1))}}>
              <NapWindow x={napW.x} y={napW.y} rot={napW.rot} scale={napW.scale} curls={curls} snore={snore} frame={frame} />
            </div>
          )}
        </Desktop>
      </Camera>
      <DebrisLayer frame={frame} pose={pose} />
      <ConfettiField frame={frame} mode="float" speed={0.5} />
      <AbsoluteFill style={{transform: `translate(${k3.x}px, ${k3.y}px)`}}>
        <KineticLine line={line('ph.03')} frame={frame} x={960} y={560} size={58} rot={-2 + k3.rot * 0.3} card="paper" tail={6} />
      </AbsoluteFill>
      <AbsoluteFill style={{transform: `translate(${k4.x}px, ${k4.y}px)`}}>
        <KineticLine line={line('ph.04')} frame={frame} x={960} y={590} size={58} rot={1.5 + k4.rot * 0.3 * (1 - settle)} card="paper" tail={10} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
export default Section;
