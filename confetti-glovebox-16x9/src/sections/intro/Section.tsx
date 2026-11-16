// INTRO (bars 0-3, spoken). Locked camera at REST_POSE. The cursor appears ("Okay."), digs the glovebox icon out of
// a cluttered Downloads window ("Yeah."), tries three wrong spots that each say no ("Where do I even put this?"),
// hovers over ICON_HOME where a dotted target appears ("Right here?"), and drops it: bounce, lid cracks open, tiny
// confetti pop ("Cool."). On bar 3.5 tabCountAt goes to 1 and a browser window with one tab rises out of the icon
// to VERSE_WINDOW, so verse 1 can start on one tab.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SectionProps} from '../../lib/sectionRoot';
import {useGlobalFrame, useSection} from '../../lib/context';
import {Camera, REST_POSE, toScreen} from '../../lib/camera';
import {AppWindow, BrowserWindow, Cursor, CursorKind, Desktop, DesktopIcon} from '../../lib/chrome';
import {ConfettiBurst, ConfettiField, DebrisLayer} from '../../lib/confetti';
import {Glyph, GlyphName} from '../../lib/glyphs';
import {C, FONT, SHAPE, hardShadow, outline} from '../../lib/theme';
import {hash, seedOf} from '../../lib/rng';
import {clamp, ease, lerp, popIn, prog} from '../../lib/motion';
import {wordsOf} from '../../lib/type';
import {ICON_HOME, ICON_LABEL, ICON_SIZE, VERSE_WINDOW, tabCountAt} from '../../data/contract';
import {frameOfBar, frameOfBeat, line} from '../../data/timing';

// ------------------------------------------------------------------ timing (all from line ids and the bar grid)

const L1 = line('in.01');
const L2 = line('in.02');
const L3 = line('in.03');
const L4 = line('in.04');
const L5 = line('in.05');
const w3 = wordsOf(L3); // Where do I even put this?
const w4 = wordsOf(L4); // Right here?

const T = {
  okay: L1.startFrame, // cursor pops in
  dlOpen: frameOfBeat(1), // Downloads window pops open
  seek: frameOfBeat(1.75), // cursor sets off for the icon
  grab: L2.startFrame, // "Yeah." grab
  free: frameOfBeat(5), // the icon comes loose from the clutter
  spot1: frameOfBar(1.5),
  leave1: frameOfBeat(6.5),
  spot2: w3[0].at, // "Where"
  leave2: w3[3].at, // "even"
  spot3: w3[5].at, // "this?"
  home: w4[1].at, // "here?"
  drop: L5.startFrame, // "Cool."
  open: frameOfBar(3.5), // tabCountAt -> 1
  end: frameOfBar(4),
};
const leave3 = Math.round(lerp(T.spot3, L4.startFrame, 0.35));

// ------------------------------------------------------------------ places (desktop px)

const DL = {x: 70, y: 96, w: 610, h: 430}; // Downloads window
const BODY_Y = DL.y + 52;
// where the glovebox is wedged in the clutter: overlapping two files, tilted, shrunk
const SLOT = {x: 556, y: 428, rot: -13, scale: 0.68};
const S1 = {x: 1400, y: 300, label: 'nope'};
const S2 = {x: 470, y: 740, label: 'not there'};
const S3 = {x: 900, y: 500, label: 'reserved for tabs'};
const SPOTS = [
  {...S1, arr: T.spot1, leave: T.leave1},
  {...S2, arr: T.spot2, leave: T.leave2},
  {...S3, arr: T.spot3, leave: leave3},
];
const HOVER = {x: ICON_HOME.x, y: ICON_HOME.y - 16};
// cursor tip relative to the icon centre while holding it (the grabbing hand sits over the icon)
const GRIP = {x: -14, y: -24};
const TUG = {x: 52, y: -12}; // how far the cursor pulls before the icon pops loose

// ------------------------------------------------------------------ keyframed paths

type K = {f: number; x: number; y: number};
const along = (keys: K[], frame: number) => {
  if (frame <= keys[0].f) return {x: keys[0].x, y: keys[0].y};
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame < b.f) {
      const e = ease.inOutCubic(clamp((frame - a.f) / Math.max(1, b.f - a.f)));
      return {x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e)};
    }
  }
  const z = keys[keys.length - 1];
  return {x: z.x, y: z.y};
};

const ICON_KEYS: K[] = [
  {f: T.free, x: SLOT.x + TUG.x, y: SLOT.y + TUG.y},
  {f: T.spot1, x: S1.x, y: S1.y},
  {f: T.leave1, x: S1.x, y: S1.y},
  {f: T.spot2, x: S2.x, y: S2.y},
  {f: T.leave2, x: S2.x, y: S2.y},
  {f: T.spot3, x: S3.x, y: S3.y},
  {f: leave3, x: S3.x, y: S3.y},
  {f: T.home, x: HOVER.x, y: HOVER.y},
];

const CURSOR_START = {x: 1180, y: 600};
const CURSOR_PRE: K[] = [
  {f: T.okay, ...CURSOR_START},
  {f: T.seek, ...CURSOR_START},
  {f: T.grab - 4, x: SLOT.x + GRIP.x, y: SLOT.y + GRIP.y},
  {f: T.grab, x: SLOT.x + GRIP.x, y: SLOT.y + GRIP.y},
  {f: T.free, x: SLOT.x + TUG.x + GRIP.x, y: SLOT.y + TUG.y + GRIP.y},
];
const CURSOR_POST: K[] = [
  {f: T.drop + 1, x: HOVER.x + GRIP.x, y: HOVER.y + GRIP.y},
  {f: T.drop + 11, x: 1190, y: 800},
];

// rejection wiggle at a wrong spot: a quick "no" head-shake that dies out
const wiggleAt = (frame: number) => {
  let r = 0;
  let dx = 0;
  for (const s of SPOTS) {
    const d = frame - s.arr - 1;
    if (d >= 0 && frame <= s.leave + 2) {
      const k = Math.exp(-d / 7);
      r += Math.sin(d * 1.9) * 13 * k;
      dx += Math.sin(d * 1.9) * 10 * k;
    }
  }
  return {r, dx};
};

// icon state (centre, rotation, scale, stretch) at a global frame
const iconAt = (frame: number) => {
  if (frame < T.free) {
    // wedged in the clutter; during the tug it strains toward the cursor
    const t = frame >= T.grab ? ease.outQuad(prog(frame, T.grab, T.free)) : 0;
    return {x: SLOT.x + t * 10, y: SLOT.y - t * 3, rot: SLOT.rot + t * 7, scale: SLOT.scale, stretch: 1 + t * 0.16, selected: frame >= T.grab};
  }
  if (frame < T.drop) {
    const p = along(ICON_KEYS, frame);
    const q = along(ICON_KEYS, frame - 1);
    const vx = p.x - q.x;
    const w = wiggleAt(frame);
    const bob = frame >= T.home ? Math.sin((frame - T.home) * 0.32) * 3 : 0;
    const pop = SLOT.scale + (1 - SLOT.scale) * ease.outBack(prog(frame, T.free, T.free + 9));
    return {x: p.x + w.dx, y: p.y + bob, rot: clamp(vx * 0.35, -12, 12) + w.r, scale: pop, stretch: 1, selected: true};
  }
  // dropped: elastic settle onto ICON_HOME exactly
  const d = frame - T.drop;
  const t = clamp(d / 16);
  const e = ease.outElastic(t);
  const fallFrom = {x: HOVER.x, y: HOVER.y + Math.sin((T.drop - T.home) * 0.32) * 3};
  const x = t >= 1 ? ICON_HOME.x : lerp(fallFrom.x, ICON_HOME.x, e);
  const y = t >= 1 ? ICON_HOME.y : lerp(fallFrom.y, ICON_HOME.y, e);
  const squash = t >= 1 ? 1 : 1 + Math.sin(t * Math.PI * 3) * 0.08 * (1 - t);
  return {x, y, rot: 0, scale: squash, stretch: 1 / squash, selected: d < 8};
};

const cursorAt = (frame: number) => {
  if (frame < T.free) return along(CURSOR_PRE, frame);
  if (frame < T.drop + 1) {
    const i = iconAt(Math.min(frame, T.drop - 1));
    const w = wiggleAt(frame);
    return {x: i.x - w.dx * 0.4 + GRIP.x, y: i.y + GRIP.y};
  }
  return along(CURSOR_POST, frame);
};

// lid: shut, pops open a crack on landing, opens wider as the browser rises out of it
const lidAt = (frame: number) => {
  const crack = 0.32 * ease.outElastic(prog(frame, T.drop + 2, T.drop + 18));
  const wide = 0.38 * ease.outCubic(prog(frame, T.open - 2, T.open + 8));
  return crack + wide;
};

// ------------------------------------------------------------------ local props

const FILES: {g: GlyphName; label: string}[] = [
  {g: 'taxes', label: 'taxes(2).pdf'},
  {g: 'receipt', label: 'receipt_88'},
  {g: 'waffle', label: 'waffle.jpg'},
  {g: 'taco', label: 'taco.png'},
  {g: 'pickle', label: 'pickle.gif'},
  {g: 'phone', label: 'IMG_4412'},
  {g: 'cup', label: 'fizz.svg'},
  {g: 'key', label: 'keys??'},
  {g: 'notebook', label: 'notes.txt'},
  {g: 'sauce', label: 'sauce.zip'},
  {g: 'popper', label: 'popper.mp3'},
  {g: 'calendar', label: 'cal (3).ics'},
  {g: 'cart', label: 'cart.csv'},
  {g: 'dog', label: 'dog.mov'},
  {g: 'box', label: 'untitled'},
];

// Cluttered Downloads window (localProp). Files jostle a little; the glovebox itself is drawn outside, on top.
const DownloadsWindow: React.FC<{frame: number}> = ({frame}) => {
  const enter = popIn(frame, T.dlOpen, 9);
  const exit = 1 - ease.inCubic(prog(frame, T.drop + 8, T.drop + 16));
  const s = enter * exit;
  if (s <= 0.001) return null;
  const seed = seedOf('intro-downloads');
  const emptySlot = frame >= T.free;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: `${DL.x + 40}px ${DL.y + 26}px`, transform: `scale(${s})`}}>
      <AppWindow x={DL.x} y={DL.y} w={DL.w} h={DL.h} title="Downloads (412)" glyph="box">
        {FILES.map((f, i) => {
          const c = i % 5;
          const r = Math.floor(i / 5);
          const jx = (hash(seed, i) - 0.5) * 22;
          const jy = (hash(seed + 1, i) - 0.5) * 18;
          const rot = (hash(seed + 2, i) - 0.5) * 22;
          return (
            <div key={i} style={{position: 'absolute', left: 25 + c * 112 + jx, top: 10 + r * 120 + jy, width: 112, textAlign: 'center', transform: `rotate(${rot}deg)`}}>
              <div style={{display: 'flex', justifyContent: 'center'}}>
                <Glyph name={f.g} size={64} />
              </div>
              <div style={{marginTop: 4, fontFamily: FONT.mono, fontWeight: 600, fontSize: 14, color: C.ink2, whiteSpace: 'nowrap'}}>{f.label}</div>
            </div>
          );
        })}
      </AppWindow>
      {/* the gap the glovebox leaves behind */}
      {emptySlot && (
        <div
          style={{
            position: 'absolute',
            left: SLOT.x - 42,
            top: SLOT.y - 42,
            width: 84,
            height: 84,
            borderRadius: SHAPE.radiusSmall,
            border: `3px dashed ${C.ink2}`,
            transform: `rotate(${SLOT.rot}deg)`,
            opacity: 0.8,
          }}
        />
      )}
    </div>
  );
};

// A wrong spot saying no: pink dashed drop zone, a no-sign, a chip with the reason (localProp).
const NoSpot: React.FC<{frame: number; x: number; y: number; label: string; arr: number; leave: number}> = ({frame, x, y, label, arr, leave}) => {
  const enter = popIn(frame, arr + 1, 7);
  const fade = 1 - prog(frame, leave + 2, leave + 9);
  if (enter <= 0 || fade <= 0) return null;
  const d = frame - arr - 1;
  const shakeX = d >= 0 ? Math.sin(d * 2.2) * 7 * Math.exp(-d / 6) : 0;
  const box = ICON_SIZE + 44;
  return (
    <div style={{position: 'absolute', left: x + shakeX, top: y, opacity: fade}}>
      <div
        style={{
          position: 'absolute',
          left: -box / 2,
          top: -box / 2,
          width: box,
          height: box,
          borderRadius: SHAPE.radius,
          border: `5px dashed ${C.pink}`,
          transform: `scale(${enter})`,
          boxSizing: 'border-box',
        }}
      />
      {/* no-sign badge */}
      <svg width={64} height={64} viewBox="0 0 64 64" style={{position: 'absolute', left: box / 2 - 40, top: -box / 2 - 26, transform: `scale(${enter})`, overflow: 'visible'}}>
        <circle cx={32} cy={32} r={26} fill={C.pink} stroke={C.ink} strokeWidth={4} />
        <circle cx={32} cy={32} r={14} fill="none" stroke={C.paper} strokeWidth={6} />
        <path d="M22 42 L42 22" stroke={C.paper} strokeWidth={6} strokeLinecap="round" />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: box / 2 + 14,
          transform: `translateX(-50%) scale(${enter})`,
          transformOrigin: 'top center',
          whiteSpace: 'nowrap',
          background: C.pink,
          border: outline(3),
          borderRadius: SHAPE.radiusSmall,
          boxShadow: hardShadow(4),
          padding: '4px 14px',
          fontFamily: FONT.display,
          fontWeight: 900,
          fontStretch: '112%',
          fontSize: 26,
          color: C.ink,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
    </div>
  );
};

// Faint dotted landing target at ICON_HOME (localProp).
const HomeTarget: React.FC<{frame: number}> = ({frame}) => {
  const enter = popIn(frame, L4.startFrame, 8);
  const gone = 1 - ease.inCubic(prog(frame, T.drop + 1, T.drop + 9));
  const s = enter * gone;
  if (s <= 0.001) return null;
  const pulse = 1 + Math.sin((frame - L4.startFrame) * 0.3) * 0.04;
  const box = ICON_SIZE + 56;
  return (
    <svg
      width={box}
      height={box}
      viewBox={`0 0 ${box} ${box}`}
      style={{position: 'absolute', left: ICON_HOME.x - box / 2, top: ICON_HOME.y - box / 2, transform: `scale(${s * pulse})`, overflow: 'visible'}}
    >
      <rect x={4} y={4} width={box - 8} height={box - 8} rx={SHAPE.radius + 6} fill="none" stroke={C.ink2} strokeWidth={5} strokeDasharray="1 14" strokeLinecap="round" />
      <path
        d={`M${box / 2} ${box / 2 - 18} V${box / 2 + 18} M${box / 2 - 18} ${box / 2} H${box / 2 + 18}`}
        stroke={C.tangerine}
        strokeWidth={5}
        strokeLinecap="round"
      />
    </svg>
  );
};

// Drag tooltip that rides next to the icon; carries the spoken lines as UI text (localProp).
const DragTip: React.FC<{frame: number; x: number; y: number}> = ({frame, x, y}) => {
  if (frame < T.free || frame >= T.drop) return null;
  const text = frame < L3.startFrame ? `Move '${ICON_LABEL}' to…` : frame < L4.startFrame ? 'where do I even put this?' : `Move '${ICON_LABEL}' here?`;
  const keyFrame = frame < L3.startFrame ? T.free : frame < L4.startFrame ? L3.startFrame : L4.startFrame;
  const s = popIn(frame, keyFrame, 7);
  const home = frame >= L4.startFrame;
  return (
    <div
      style={{
        position: 'absolute',
        left: x + 74,
        top: y - 112,
        transform: `scale(${s})`,
        transformOrigin: 'bottom left',
        whiteSpace: 'nowrap',
        background: home ? C.mustard : C.paper,
        border: outline(3),
        borderRadius: SHAPE.radiusSmall,
        boxShadow: hardShadow(5),
        padding: '6px 14px',
        fontFamily: FONT.mono,
        fontWeight: 700,
        fontSize: 24,
        color: C.ink,
        zIndex: 45,
      }}
    >
      {text}
    </div>
  );
};

// "Cool." confirmation chip after the drop (localProp).
const CoolChip: React.FC<{frame: number}> = ({frame}) => {
  const s = popIn(frame, T.drop + 4, 8) * (1 - prog(frame, T.open + 6, T.open + 12));
  if (s <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: ICON_HOME.x + 86,
        top: ICON_HOME.y - 96,
        transform: `scale(${s}) rotate(-4deg)`,
        transformOrigin: 'bottom left',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: C.pickle,
        border: outline(3),
        borderRadius: SHAPE.radiusSmall,
        boxShadow: hardShadow(5),
        padding: '5px 14px 5px 10px',
        fontFamily: FONT.display,
        fontWeight: 900,
        fontStretch: '112%',
        fontSize: 28,
        color: C.ink,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      <svg width={26} height={26} viewBox="0 0 26 26">
        <path d="M4 14 L10 20 L22 6" fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      cool.
    </div>
  );
};

// Browser rising out of the icon from bar 3.5, one tab, landing exactly on VERSE_WINDOW by the section end.
const RisingBrowser: React.FC<{frame: number}> = ({frame}) => {
  const tabs = tabCountAt(frame);
  if (tabs < 1) return null;
  const e = ease.outCubic(prog(frame, T.open, T.end - 3));
  const s = lerp(0.06, 1, e);
  const bottom = VERSE_WINDOW.y + VERSE_WINDOW.h;
  const startBottom = ICON_HOME.y - ICON_SIZE * 0.3;
  const dy = lerp(startBottom - bottom, 0, e);
  return (
    <div
      style={{
        position: 'absolute',
        left: VERSE_WINDOW.x,
        top: VERSE_WINDOW.y,
        width: VERSE_WINDOW.w,
        height: VERSE_WINDOW.h,
        transformOrigin: '50% 100%',
        transform: `translateY(${dy}px) scale(${s})`,
      }}
    >
      <BrowserWindow
        x={0}
        y={0}
        w={VERSE_WINDOW.w}
        h={VERSE_WINDOW.h}
        tabs={tabs}
        named={{0: {title: 'new tab', glyph: 'glovebox'}}}
        active={0}
        newestPop={popIn(frame, T.open + 3, 8)}
        url="confetti://glovebox"
      />
    </div>
  );
};

// ------------------------------------------------------------------ section

const Section: React.FC<SectionProps> = () => {
  const frame = useGlobalFrame();
  useSection();
  const pose = REST_POSE; // locked for the whole intro

  const icon = iconAt(frame);
  const cur = cursorAt(frame);
  const cursorOn = frame >= T.okay;
  const kind: CursorKind =
    frame >= T.drop + 1 ? 'arrow' : frame >= T.grab ? 'grabbing' : frame >= T.grab - 8 ? 'grab' : 'arrow';
  const press =
    frame >= T.grab && frame < T.grab + 10
      ? 1 - (frame - T.grab) / 10
      : frame >= T.drop && frame < T.drop + 10
        ? 1 - (frame - T.drop) / 10
        : frame >= T.okay && frame < T.okay + 8
          ? 1 - (frame - T.okay) / 8
          : 0;
  const burst = toScreen(pose, ICON_HOME.x, ICON_HOME.y - ICON_SIZE * 0.3);

  return (
    <AbsoluteFill>
      <Camera pose={pose}>
        <Desktop frame={frame} showIcon={false} menuTitle={frame >= T.open ? 'Browser' : 'Desktop'}>
          <DownloadsWindow frame={frame} />
          {SPOTS.map((s, i) => (
            <NoSpot key={i} frame={frame} {...s} />
          ))}
          <HomeTarget frame={frame} />
          {/* the browser rises out from behind the glovebox, so the icon stays in front, at home, to the last frame */}
          <RisingBrowser frame={frame} />
          {frame >= T.dlOpen + 3 && (
            <div style={{position: 'absolute', left: icon.x, top: icon.y, width: 0, height: 0, transform: `rotate(${icon.rot}deg) scale(${icon.scale * icon.stretch}, ${icon.scale})`}}>
              <DesktopIcon x={0} y={0} pose={lidAt(frame)} selected={icon.selected} />
            </div>
          )}
          <CoolChip frame={frame} />
          <DragTip frame={frame} x={icon.x} y={icon.y} />
          {cursorOn && <Cursor x={cur.x} y={cur.y} kind={kind} press={press} scale={1.6 * popIn(frame, T.okay, 8)} frame={frame} />}
        </Desktop>
      </Camera>
      <DebrisLayer frame={frame} pose={pose} />
      <ConfettiBurst frame={frame} at={T.drop + 3} x={burst.x} y={burst.y} count={36} power={0.42} life={34} spread={80} seed={seedOf('intro-lid')} />
      <ConfettiField frame={frame} />
    </AbsoluteFill>
  );
};
export default Section;
