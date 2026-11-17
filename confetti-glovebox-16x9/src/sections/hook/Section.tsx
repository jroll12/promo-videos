// HOOK: one component, three uses (hook1 0.4, hook2 0.7, hook3 1.0).
// Locked, centred, symmetrical. Camera at REST_POSE. One browser window at HOOK_WINDOW with a symmetric tab bar; the
// cursor snaps to the active tangerine tab on the first downbeat and holds, still, for the whole hook. The glovebox
// icon sits under the window at ICON_HOME. Chaos orbits the still centre: orbit confetti, loose tabs on a 3D ring
// (back half behind the window), and four gag windows on two mirrored side loops (sauce|fizz, keys|lunch).
// Final hook: the window (and everything orbiting) minimises into the glovebox, the camera pulls back to
// MURAL_POSE and the debris resolves into the mural; the last frame is exactly MURAL_POSE.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SectionProps} from '../../lib/sectionRoot';
import {useGlobalFrame, useSection} from '../../lib/context';
import {Camera, REST_POSE, toScreen, Pose} from '../../lib/camera';
import {Cursor, Desktop, DesktopIcon, fillerTab} from '../../lib/chrome';
import {ConfettiBurst, ConfettiField, DebrisLayer} from '../../lib/confetti';
import {HookType, wordsOf} from '../../lib/type';
import {barPulse, beatPulse, clamp, ease, lerp, popIn, wobble, MIN_HOLD_FRAMES} from '../../lib/motion';
import {FPS, barAt, frameOfBar, line} from '../../data/timing';
import {HOOK_INTENSITY, HOOK_WINDOW, ICON_HOME, MINIMISE_BARS, MURAL_POSE, lerpPose, minimiseAt, pullbackAt, tabCountAt} from '../../data/contract';
import {GagId, GagWindow, HookBrowser, HookLyric, StatusCard, TAB_SIDE, TabChip} from './parts';

type HookId = 'hook1' | 'hook2' | 'hook3';
const HW = HOOK_WINDOW;
// Active tab centre (world px): the tab bar is centred in the window's inner box (content-box border of 4).
const TAB_X = HW.x + 4 + TAB_SIDE + (HW.w - 2 * TAB_SIDE) / 2;
const TAB_Y = HW.y + 4 + 16 + 25;
const ACTIVE_TAB = {0: {title: 'still showing up', glyph: 'glovebox' as const}};

// Gag side loops (left; the right loop is its mirror about x = 960).
const LOOP = {x: 325, y: 750, rx: 150, ry: 125};
// Loose-tab ring: back (upper) half passes behind the window, front (lower) half in front; crossings are hidden.
const RING = {x: 960, y: 470, rx: 900, up: 420, down: 680};

const toward = (p: {x: number; y: number}, q: {x: number; y: number}, t: number) => ({x: lerp(p.x, q.x, t), y: lerp(p.y, q.y, t)});

const Section: React.FC<SectionProps> = ({id}) => {
  const frame = useGlobalFrame();
  const s = useSection();
  const hid = id as HookId;
  const intensity = HOOK_INTENSITY[hid];
  const final = hid === 'hook3';
  const pre = `h${hid.slice(-1)}`;
  const L = (n: number) => line(`${pre}.0${n}`);
  const lines = [1, 2, 3, 4, 5, 6, 7, 8].map(L);
  const t = frame / FPS;
  const bars = barAt(frame) - s.startBar; // bars since the hook's first downbeat
  const tabs = tabCountAt(frame);

  // ---- camera: locked; final hook pulls back to MURAL_POSE (exactly, from the end of the pull-back on)
  const pb = final ? pullbackAt(frame) : 0;
  const pose: Pose = pb >= 1 ? MURAL_POSE : pb > 0 ? lerpPose(REST_POSE, MURAL_POSE, pb) : REST_POSE;
  const iconScreen = toScreen(pose, ICON_HOME.x, ICON_HOME.y);

  // ---- minimise (final hook only)
  const m = final ? minimiseAt(frame) : 0;
  const minEnd = frameOfBar(MINIMISE_BARS[1]);
  const into = (p: {x: number; y: number}) => toward(p, ICON_HOME, ease.inCubic(m));
  const shrink = 1 - ease.inCubic(m);

  // ---- downbeat punch on the window (not the camera), stronger with intensity; cursor snaps on the first downbeat
  const punchS = 1 + (0.01 + 0.03 * intensity) * barPulse(frame, 0.6);
  const snapAt = frameOfBar(s.startBar);
  const press = frame >= snapAt ? clamp(1 - (frame - snapAt) / 10) : 0;

  // ---- gag windows on two mirrored side loops
  const P = lerp(4.5, 2.5, intensity); // bars per revolution
  const phi = (bars / P) * Math.PI * 2;
  const beat = beatPulse(frame, 0.5);
  // Spotlight: while its own line is sung, a gag window grows and steps in toward the centre so it reads as THAT
  // line's picture (blind validation round 1 found the newest window lost among the others). Others step back.
  const spot = (n: number) => {
    const l = L(n);
    return ease.inOutCubic(clamp((frame - l.startFrame + 2) / 6)) * (1 - ease.inOutCubic(clamp((frame - l.endFrame - 2) / 8)));
  };
  const gagLine: Record<GagId, number> = {sauce: 1, fizz: 2, keys: 6, lunch: 7} as Record<GagId, number>;
  const anySpot = Math.max(...[1, 2, 6, 7].map(spot));
  const loopGag = (gag: GagId, side: -1 | 1, off: number, at: number, k: number) => {
    const a = phi + off;
    const lx = LOOP.x + LOOP.rx * Math.cos(a);
    const y = LOOP.y + LOOP.ry * Math.sin(a);
    const x = side < 0 ? lx : 1920 - lx;
    const sp = spot(gagLine[gag]);
    const depth = Math.sin(a) + sp * 4;
    const p = into({x: lerp(x, 960 + side * 470, sp * 0.8), y: lerp(y, 590, sp * 0.8)});
    const sc = popIn(frame, at, 9) * (1.04 + 0.1 * Math.sin(a)) * (1 + 0.75 * sp) * (1 - 0.3 * Math.max(0, anySpot - sp)) * shrink;
    return {gag, depth, el: <GagWindow key={gag} gag={gag} cx={p.x} cy={p.y} scale={sc} rot={side * wobble(frame, 40 + k, 3)} t={t} beat={beat} />};
  };
  const gags = [loopGag('sauce', -1, 0, L(1).startFrame, 1), loopGag('fizz', 1, 0, L(2).startFrame, 2)];
  if (!final) gags.push(loopGag('keys', -1, Math.PI, L(6).startFrame, 3), loopGag('lunch', 1, Math.PI, L(7).startFrame, 4));
  gags.sort((a, b) => a.depth - b.depth);

  // ---- loose tabs on the ring, mirrored pairs, popping in on the words of ".03 too many tabs"
  const pairs = Math.round(2 + 4 * intensity);
  const Pc = lerp(6, 3, intensity);
  const w3 = wordsOf(L(3));
  const chips = Array.from({length: pairs}, (_, k) =>
    ([-1, 1] as const).map((side) => {
      const a = (bars / Pc) * Math.PI * 2 + (k / pairs) * Math.PI * 2 - 0.6;
      const sn = Math.sin(a);
      const x = RING.x + side * RING.rx * Math.cos(a);
      const y = RING.y + sn * (sn > 0 ? RING.down : RING.up);
      const p = into({x, y});
      const sc = popIn(frame, w3[Math.min(k, w3.length - 1)].at, 8) * (0.85 + 0.2 * sn) * shrink;
      const front = sn > 0;
      const el =
        sc > 0.001 ? (
          <div key={`${k}${side}`} style={{position: 'absolute', left: p.x, top: p.y, transform: `translate(-50%, -50%) scale(${sc}) rotate(${side * (8 + 10 * sn)}deg)`}}>
            <TabChip tab={fillerTab(k * 2 + (side > 0 ? 1 : 0) + 3)} />
          </div>
        ) : null;
      return {front, el};
    }),
  ).flat();

  // ---- glovebox lid: pops on ".05 confetti in the glovebox"; in the final hook it swallows the window, then bursts
  const l5 = L(5).startFrame;
  let lid = frame >= l5 && frame < l5 + MIN_HOLD_FRAMES ? ease.outBack(clamp((frame - l5) / 5)) : 0;
  const burstAt = final ? minEnd : l5;
  if (final) {
    lid = m > 0 && m < 1 ? clamp(m * 6) : frame >= minEnd && frame < minEnd + MIN_HOLD_FRAMES ? 1 - clamp((frame - minEnd - 20) / 6) : 0;
  }

  // ---- final hook: keys and lunch are sung during the pull-back, so they pop up in screen space, hold, and get
  // swallowed by the glovebox before the mural is complete.
  const late = final
    ? ([
        ['keys', -1, L(6).startFrame],
        ['lunch', 1, L(7).startFrame],
      ] as const).map(([gag, side, at]) => {
        const flyAt = at + MIN_HOLD_FRAMES + 14;
        const f = ease.inCubic(clamp((frame - flyAt) / 12));
        const home = {x: side < 0 ? 400 : 1520, y: 700};
        const p = toward(home, iconScreen, f);
        const sc = popIn(frame, at, 9) * 1.9 * (1 - f);
        if (frame >= flyAt && frame < flyAt + 14) lid = Math.max(lid, 1);
        return <GagWindow key={gag} gag={gag} cx={p.x} cy={p.y} scale={sc} rot={side * wobble(frame, 60, 3)} t={t} beat={beat} />;
      })
    : null;

  const showWindow = m < 1;
  const pulse = beatPulse(frame, 0.4);
  const bigType = final && frame >= L(5).startFrame - 4;

  return (
    <AbsoluteFill>
      <Camera pose={pose}>
        <Desktop frame={frame} showIcon={false}>
          {chips.filter((c) => !c.front).map((c) => c.el)}
          {showWindow && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 1920,
                height: 1080,
                transformOrigin: `${ICON_HOME.x}px ${ICON_HOME.y}px`,
                transform: `scale(${lerp(1, 0.05, ease.inCubic(m))}, ${lerp(1, 0.03, Math.pow(m, 0.8))})`,
                opacity: 1 - clamp((m - 0.85) / 0.15),
              }}
            >
              <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: `${TAB_X}px ${TAB_Y}px`, transform: `scale(${punchS})`}}>
                <HookBrowser {...HW} tabs={tabs} named={ACTIVE_TAB} activeWidth={320} url="confetti://glovebox/still-showing-up">
                  <StatusCard frame={frame} tabs={tabs} checkAt={L(4).startFrame} lostAt={L(8).startFrame} />
                </HookBrowser>
              </div>
              <Cursor x={TAB_X - 4} y={TAB_Y + 3} kind="pointer" press={press} />
            </div>
          )}
          {chips.filter((c) => c.front).map((c) => c.el)}
          {gags.map((g) => g.el)}
          <DesktopIcon pose={lid} />
        </Desktop>
      </Camera>
      <DebrisLayer frame={frame} pose={pose} />
      {late}
      <ConfettiBurst frame={frame} at={burstAt} x={final ? iconScreen.x : ICON_HOME.x} y={final ? iconScreen.y - 20 : ICON_HOME.y - 30} count={final ? 150 : Math.round(40 + 60 * intensity)} power={final ? 0.9 : 0.6} spread={80} life={40} seed={70 + Math.round(intensity * 10)} />
      <ConfettiField frame={frame} mode="orbit" spin={1 + intensity} />
      {bigType ? (
        <HookType section={hid} frame={frame} intensity={intensity} y={140} pulse={pulse} />
      ) : (
        <HookLyric lines={lines} frame={frame} intensity={intensity} top={230} pulse={pulse} />
      )}
    </AbsoluteFill>
  );
};
export default Section;
