// Kinetic lyric type. Hook lines are always on screen as large type (HookType). Verse lines appear only when they
// carry a punchline (KineticLine). Both render nothing when showLyrics is false.
import React from 'react';
import {C, FONT, SHAPE, hardShadow, outline, ColorName} from '../theme';
import {Line, SectionId, linesOf, wordAt, frameOfBeat, beatAt} from '../../data/timing';
import {useShowLyrics} from '../context';
import {clamp, ease} from '../motion';

// Words of a line with per-word start frames. Grid lines (no word timing) spread words evenly over the first
// 3 beats of the line so they still land musically.
export const wordsOf = (l: Line) => {
  const parts = l.text.split(/\s+/).filter(Boolean);
  if (l.words.length === parts.length) return parts.map((w, i) => ({w, at: l.words[i].startFrame}));
  if (l.words.length > 0) {
    // the aligner sometimes splits differently; fall back to proportional mapping onto aligned word starts
    return parts.map((w, i) => ({w, at: l.words[Math.min(l.words.length - 1, Math.floor((i / parts.length) * l.words.length))].startFrame}));
  }
  const b0 = beatAt(l.startFrame);
  return parts.map((w, i) => ({w, at: frameOfBeat(b0 + (i / Math.max(1, parts.length - 1)) * 3)}));
};

const Word: React.FC<{w: string; at: number; frame: number; size: number; active: boolean; color: string; activeColor: string; pop: number}> = ({
  w,
  at,
  frame,
  size,
  active,
  color,
  activeColor,
  pop,
}) => {
  const d = frame - at;
  const s = d < 0 ? 0 : ease.outBack(clamp(d / 7), 2.2);
  return (
    <span
      style={{
        display: 'inline-block',
        transform: `scale(${s}) translateY(${active ? -pop * size * 0.06 : 0}px)`,
        transformOrigin: '50% 80%',
        color: active ? activeColor : color,
        marginRight: size * 0.24,
        opacity: d < 0 ? 0 : 1,
      }}
    >
      {w}
    </span>
  );
};

// One line of big type on a sticker card. `frame` is GLOBAL.
export const LyricCard: React.FC<{
  line: Line;
  frame: number;
  size?: number;
  x?: number;
  y?: number;
  width?: number;
  align?: 'center' | 'left' | 'right';
  rot?: number;
  card?: ColorName | 'none';
  color?: ColorName;
  activeColor?: ColorName;
  stretch?: number; // font-stretch %, 100..125
  pulse?: number; // 0..1 beat pulse to bounce the active word
  enter?: number; // 0..1 card scale-in
}> = ({line, frame, size = 96, x = 960, y = 540, width = 1700, align = 'center', rot = 0, card = 'paper', color = 'ink', activeColor = 'tangerine', stretch = 125, pulse = 0, enter = 1}) => {
  const show = useShowLyrics();
  if (!show || enter <= 0) return null;
  const words = wordsOf(line);
  const k = wordAt(line, frame);
  const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 'max-content',
        maxWidth: width,
        transform: `translate(${tx}, -50%) rotate(${rot}deg) scale(${enter})`,
        textAlign: align,
        fontFamily: FONT.display,
        fontWeight: 900,
        fontStretch: `${stretch}%`,
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: -size * 0.01,
        padding: card === 'none' ? 0 : `${size * 0.14}px ${size * 0.3}px ${size * 0.18}px`,
        background: card === 'none' ? 'transparent' : C[card],
        border: card === 'none' ? 'none' : outline(SHAPE.stroke + 1),
        borderRadius: SHAPE.radius,
        boxShadow: card === 'none' ? 'none' : hardShadow(SHAPE.shadow + 2),
        textTransform: 'uppercase',
        zIndex: 60,
      }}
    >
      {words.map((w, i) => (
        <Word key={i} w={w.w} at={w.at} frame={frame} size={size} active={i === k} color={C[color]} activeColor={C[activeColor]} pop={pulse} />
      ))}
    </div>
  );
};

// Hook type: the current hook line, always on screen from the first hook line to the end of the section. Locked,
// centred. Size grows with intensity (hook1 0.4 -> 104px, hook3 1.0 -> 140px).
export const HookType: React.FC<{section: SectionId; frame: number; intensity: number; y?: number; pulse?: number}> = ({section, frame, intensity, y = 140, pulse = 0}) => {
  const lines = linesOf(section);
  let cur = lines[0];
  for (const l of lines) if (l.startFrame - 4 <= frame) cur = l;
  if (frame < lines[0].startFrame - 4) return null;
  const size = 80 + 60 * intensity;
  const sinceStart = frame - (cur.startFrame - 4);
  return <LyricCard line={cur} frame={frame} size={size} y={y} pulse={pulse} enter={ease.outBack(clamp(sinceStart / 6))} />;
};

// A verse punchline: smaller, can sit anywhere, tilted, disappears at the line's end (+ `tail` frames).
export const KineticLine: React.FC<{line: Line; frame: number; x?: number; y?: number; size?: number; rot?: number; card?: ColorName | 'none'; tail?: number; align?: 'center' | 'left' | 'right'; width?: number}> = ({
  line,
  frame,
  x = 960,
  y = 900,
  size = 64,
  rot = -2,
  card = 'mustard',
  tail = 8,
  align = 'center',
  width = 1500,
}) => {
  if (frame < line.startFrame - 2 || frame > line.endFrame + tail) return null;
  const out = frame > line.endFrame ? 1 - (frame - line.endFrame) / tail : 1;
  return <LyricCard line={line} frame={frame} size={size} x={x} y={y} rot={rot} card={card} enter={clamp(out)} align={align} width={width} stretch={112} />;
};
