// OUTRO (bars 88 to the end). Starts on exactly the final hook's last picture: the "You are here" mural at
// MURAL_POSE. The map then "loads the route": a buffering spinner sits in the pin's head, a route panel is stuck at
// 99% and prints the spoken lines as UI text. On "snacks" a taco drops onto the pin, the bar hits 100%, and the end
// card resolves (STILL NOT LOST. / JUST CREATIVELY DELAYED. / WITH SNACKS.) while the camera pushes gently into the
// pin, then everything holds still for the ring-out.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SectionProps} from '../../lib/sectionRoot';
import {useGlobalFrame} from '../../lib/context';
import {Camera, Pose, toScreen} from '../../lib/camera';
import {Cursor, Desktop, Spinner} from '../../lib/chrome';
import {ConfettiBurst, ConfettiField, DebrisLayer} from '../../lib/confetti';
import {PIN, screenToWorld} from '../../lib/confetti/mural';
import {Glyph} from '../../lib/glyphs';
import {LyricCard, wordsOf} from '../../lib/type';
import {C, FONT, SHAPE, hardShadow, outline} from '../../lib/theme';
import {MURAL_POSE} from '../../data/contract';
import {Line, beatAt, frameOfBeat, line, section} from '../../data/timing';
import {beatIndex, beatPulse, clamp, ease, popIn, prog} from '../../lib/motion';

// ---------------------------------------------------------------- timing anchors (all derived, no literal frames)

const S = section('outro');
const H308 = line('h3.08');
const L1 = line('out.01');
const L2 = line('out.02');
const L3 = line('out.03');
const W3 = wordsOf(L3);
const LAND = W3[W3.length - 1].at; // the taco lands on "snacks"
const FALL_FROM = LAND - 10;
const LOAD_IN = L1.startFrame - 4; // spinner + route panel pop in just before "Still not lost."
const FILL_END = frameOfBeat(beatAt(LOAD_IN) + 1.5); // bar creeps to 99% then sticks
const PANEL_OUT = frameOfBeat(beatAt(LAND) + 0.75);
const CARD_AT = [LAND, frameOfBeat(beatAt(LAND) + 1), frameOfBeat(beatAt(LAND) + 2)];
const PUSH = [LAND, frameOfBeat(beatAt(LAND) + 4)] as const; // gentle push, then still for the ring-out
const XFADE_END = frameOfBeat(beatAt(S.startFrame) + 2); // hook's orbiting confetti hands over to a slow float

// ---------------------------------------------------------------- camera: MURAL_POSE, then a gentle push about the pin

const PIN_WORLD = screenToWorld(PIN.cx, PIN.cy);
const PUSH_SCALE = 0.38;
const poseAt = (frame: number): Pose => {
  const t = ease.inOutSine(prog(frame, PUSH[0], PUSH[1]));
  if (t <= 0) return MURAL_POSE;
  const s = Math.exp(Math.log(MURAL_POSE.scale) + (Math.log(PUSH_SCALE) - Math.log(MURAL_POSE.scale)) * t);
  // zoom about the pin's screen point, so the pin stays put and the map grows around it
  return {x: PIN_WORLD.x - (PIN.cx - 960) / s, y: PIN_WORLD.y - (PIN.cy - 540) / s, scale: s, rot: 0};
};

// ---------------------------------------------------------------- local props

// A line of words popping in on their sung frames; the sung word turns tangerine. In-picture UI text, not a lyric card.
const SungWords: React.FC<{l: Line; frame: number; size: number}> = ({l, frame, size}) => {
  const ws = wordsOf(l);
  let k = -1;
  ws.forEach((w, i) => {
    if (w.at <= frame) k = i;
  });
  const sung = frame <= l.endFrame;
  return (
    <div style={{fontFamily: FONT.display, fontWeight: 900, fontStretch: '125%', fontSize: size, lineHeight: 1.05, textTransform: 'uppercase', color: C.ink, whiteSpace: 'nowrap'}}>
      {ws.map((w, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            marginRight: size * 0.24,
            transform: `scale(${frame < w.at ? 0 : ease.outBack(clamp((frame - w.at) / 6), 2.2)})`,
            transformOrigin: '50% 80%',
            color: sung && i === k ? C.tangerine : C.ink,
          }}
        >
          {w.w}
        </span>
      ))}
    </div>
  );
};

// The map's route panel: buffering, a progress bar stuck at 99%, and the spoken lines as status text.
const RoutePanel: React.FC<{frame: number}> = ({frame}) => {
  const enter = popIn(frame, LOAD_IN, 8) * (frame < PANEL_OUT ? 1 : 1 - ease.inCubic(clamp((frame - PANEL_OUT) / 6)));
  if (enter <= 0) return null;
  const done = frame >= LAND;
  const pct = done ? 100 : Math.round(99 * ease.outCubic(prog(frame, LOAD_IN, FILL_END)));
  const dots = '.'.repeat((beatIndex(frame) % 3) + 1);
  return (
    <div
      style={{
        position: 'absolute',
        left: 960,
        top: 874,
        width: 1060,
        transform: `translate(-50%, -50%) scale(${enter})`,
        background: C.paper,
        border: outline(SHAPE.stroke + 1),
        borderRadius: SHAPE.radius,
        boxShadow: hardShadow(SHAPE.shadow + 2),
        padding: '18px 30px 20px',
        boxSizing: 'border-box',
        zIndex: 40,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONT.mono, fontWeight: 700, fontSize: 30, color: C.ink}}>
        <Glyph name="pin" size={44} />
        <span>{done ? 'route loaded' : `buffering route${dots}`}</span>
        <div style={{flex: 1}} />
        <span style={{fontWeight: 800, color: done ? C.pickle : C.ink}}>{pct}%</span>
      </div>
      <div style={{marginTop: 12, height: 30, border: outline(SHAPE.stroke), borderRadius: SHAPE.radiusSmall, background: C.paper2, overflow: 'hidden'}}>
        <div style={{width: `${pct}%`, height: '100%', background: done ? C.pickle : C.tangerine, borderRight: pct < 100 ? outline(SHAPE.thin) : 'none'}} />
      </div>
      <div style={{marginTop: 14, minHeight: 124}}>
        {frame >= L1.startFrame - 2 && <SungWords l={L1} frame={frame} size={54} />}
        {frame >= L2.startFrame - 2 && <SungWords l={L2} frame={frame} size={54} />}
      </div>
    </div>
  );
};

// One end-card phrase: big Archivo 900 on a paper or mustard sticker card. Part of the picture (always renders).
const EndCard: React.FC<{frame: number; at: number; text: string; hot?: string; y: number; size: number; card: 'paper' | 'mustard'; rot?: number; glyph?: boolean}> = ({
  frame,
  at,
  text,
  hot,
  y,
  size,
  card,
  rot = 0,
  glyph = false,
}) => {
  const enter = popIn(frame, at, 9);
  if (enter <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 960,
        top: y,
        width: 'max-content',
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${enter})`,
        display: 'flex',
        alignItems: 'center',
        gap: size * 0.3,
        fontFamily: FONT.display,
        fontWeight: 900,
        fontStretch: '125%',
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: -size * 0.01,
        textTransform: 'uppercase',
        color: C.ink,
        padding: `${size * 0.14}px ${size * 0.3}px ${size * 0.18}px`,
        background: C[card],
        border: outline(SHAPE.stroke + 1),
        borderRadius: SHAPE.radius,
        boxShadow: hardShadow(SHAPE.shadow + 2),
        zIndex: 70,
      }}
    >
      <span>
        {text.split(' ').map((w, i, all) => (
          <span key={i} style={{color: hot && w === hot ? C.tangerine : C.ink, marginRight: i < all.length - 1 ? size * 0.24 : 0}}>
            {w}
          </span>
        ))}
      </span>
      {glyph && <Glyph name="taco" size={size * 1.15} />}
    </div>
  );
};

// ---------------------------------------------------------------- section

const Section: React.FC<SectionProps> = () => {
  const frame = useGlobalFrame();
  const pose = poseAt(frame);
  const zoom = pose.scale / MURAL_POSE.scale;
  const pin = toScreen(pose, PIN_WORLD.x, PIN_WORLD.y);

  // hand-off: the final hook's line keeps its card until it is sung out, then lets go
  const hookOut = frame <= H308.endFrame ? 1 : 1 - ease.inCubic(clamp((frame - H308.endFrame) / 6));

  // confetti: the hook's orbit crossfades into a slow float, which then just drifts for the rest of the film
  const xf = ease.inOutSine(prog(frame, S.startFrame, XFADE_END));

  // spinner in the pin's head: in with the route panel, out when the taco lands
  const spinIn = popIn(frame, LOAD_IN, 8) * (frame < LAND ? 1 : 1 - clamp((frame - LAND) / 4));

  // taco: falls onto the pin head, lands on "snacks" with a squash, then sits still
  const fallT = clamp((frame - FALL_FROM) / (LAND - FALL_FROM));
  const sinceLand = frame - LAND;
  const squash = sinceLand >= 0 ? 0.32 * Math.exp(-sinceLand / 5) * Math.cos(sinceLand * 0.85) : 0;
  const tacoY = frame < LAND ? -140 + (pin.y - 20 + 140) * ease.inQuad(fallT) : pin.y - 20;
  const tacoSize = 210 * zoom;

  return (
    <AbsoluteFill>
      <Camera pose={pose}>
        <Desktop frame={frame} />
      </Camera>
      <DebrisLayer frame={frame} pose={pose} />

      {/* buffering badge over the pin's hole */}
      {spinIn > 0 && (
        <div style={{position: 'absolute', left: pin.x, top: pin.y, transform: `translate(-50%, -50%) scale(${spinIn})`}}>
          <div style={{position: 'absolute', left: -78, top: -78, width: 156, height: 156, borderRadius: 78, background: C.paper, border: outline(SHAPE.stroke), boxShadow: hardShadow(6)}} />
          <Spinner x={0} y={0} size={170} frame={frame} />
        </div>
      )}
      {spinIn > 0 && (
        <AbsoluteFill style={{opacity: clamp(spinIn)}}>
          <Cursor x={pin.x + 96} y={pin.y + 40} kind="wait" frame={frame} />
        </AbsoluteFill>
      )}

      {/* the snack */}
      {frame >= FALL_FROM && (
        <div
          style={{
            position: 'absolute',
            left: pin.x,
            top: tacoY,
            transform: `translate(-50%, -50%) rotate(${frame < LAND ? -24 * (1 - fallT) : 0}deg) scale(${1 + squash}, ${1 - squash})`,
            transformOrigin: '50% 75%',
            zIndex: 30,
          }}
        >
          <Glyph name="taco" size={tacoSize} />
        </div>
      )}

      <ConfettiField frame={frame} mode="orbit" spin={2} opacity={1 - xf} />
      <ConfettiField frame={frame} mode="float" speed={0.5} opacity={xf} />
      <ConfettiBurst frame={frame} at={LAND} x={pin.x} y={pin.y - 20} count={90} power={0.7} life={36} seed={88} spread={160} />

      <RoutePanel frame={frame} />

      {/* end card: the three phrases, in the picture (renders with or without lyric cards) */}
      <EndCard frame={frame} at={CARD_AT[0]} text="Still not lost." hot="lost." y={150} size={128} card="paper" />
      <EndCard frame={frame} at={CARD_AT[1]} text="Just creatively delayed." hot="delayed." y={838} size={76} card="paper" />
      <EndCard frame={frame} at={CARD_AT[2]} text="With snacks." y={966} size={76} card="mustard" rot={-2} glyph />

      {/* the final hook's last line, held over the seam */}
      {hookOut > 0 && <LyricCard line={H308} frame={frame} size={140} y={140} pulse={beatPulse(frame, 0.4)} enter={hookOut} />}
    </AbsoluteFill>
  );
};
export default Section;
