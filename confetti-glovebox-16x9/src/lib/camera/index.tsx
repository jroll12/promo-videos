// Camera: one transform around the world (the 1920x1080 desktop). Pose = world point at screen centre, zoom, rotation.
// Verses: whip pans, zoom punches, jump cuts on beats. Hooks: REST_POSE, locked. Pre-hook: slow float.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Pose, REST_POSE} from '../../data/contract';
import {beatAt, frameOfBeat} from '../../data/timing';
import {C} from '../theme';
import {clamp, ease, lerp} from '../motion';
import {hash, noise1} from '../rng';

export type {Pose};
export {REST_POSE};

export const poseTransform = (p: Pose) =>
  `translate(960px, 540px) rotate(${p.rot}deg) scale(${p.scale}) translate(${-p.x}px, ${-p.y}px)`;

// World -> screen for one point under a pose (for screen-space layers such as DebrisLayer and cursor overlays).
export const toScreen = (p: Pose, wx: number, wy: number) => {
  const r = (p.rot * Math.PI) / 180;
  const dx = (wx - p.x) * p.scale;
  const dy = (wy - p.y) * p.scale;
  return {x: 960 + dx * Math.cos(r) - dy * Math.sin(r), y: 540 + dx * Math.sin(r) + dy * Math.cos(r)};
};

export const Camera: React.FC<{pose: Pose; blur?: number; background?: string; children: React.ReactNode}> = ({
  pose,
  blur = 0,
  background = C.paper2,
  children,
}) => (
  <AbsoluteFill style={{overflow: 'hidden', background}}>
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 1920,
        height: 1080,
        transformOrigin: '0 0',
        transform: poseTransform(pose),
        filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

export const addPose = (a: Pose, d: Partial<Pose>): Pose => ({
  x: a.x + (d.x ?? 0),
  y: a.y + (d.y ?? 0),
  scale: a.scale * (d.scale ?? 1),
  rot: a.rot + (d.rot ?? 0),
});
export const pose = (x = 960, y = 540, scale = 1, rot = 0): Pose => ({x, y, scale, rot});

// Whip pan from `from` to `to`, starting at global frame `at`, lasting `dur` frames (default 6, about half a beat).
// Returns the pose and a blur amount; put the blur on <Camera blur> and draw <WhipLines> with `amount`.
export const whip = (frame: number, at: number, from: Pose, to: Pose, dur = 6) => {
  const t = clamp((frame - at) / dur);
  const e = ease.inOutCubic(t);
  const speed = t <= 0 || t >= 1 ? 0 : Math.sin(Math.PI * t); // 0..1, peaks mid-whip
  return {
    pose: {x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, e), scale: lerp(from.scale, to.scale, e), rot: lerp(from.rot, to.rot, e)},
    blur: speed * 14,
    amount: speed,
    angle: (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI,
  };
};

// Zoom punch: multiplies scale by up to (1 + amount) on hit frame `at`, decaying over `decay` frames.
export const punch = (frame: number, at: number, amount = 0.12, decay = 9) =>
  frame < at ? 1 : 1 + amount * Math.exp(-((frame - at) / decay) * 3);

// Jump cuts on the beat grid: from global beat `startBeat`, switch to the next pose every `every` beats.
// Poses cycle; `seed` adds a small deterministic jitter so repeats never look identical.
export const jumpCut = (frame: number, startBeat: number, every: number, poses: Pose[], seed = 1): Pose => {
  const k = Math.max(0, Math.floor((beatAt(frame) - startBeat) / every + 1e-6));
  const p = poses[k % poses.length];
  return {x: p.x + (hash(seed, k) - 0.5) * 30, y: p.y + (hash(seed + 1, k) - 0.5) * 20, scale: p.scale, rot: p.rot + (hash(seed + 2, k) - 0.5) * 2};
};
// Frame on which jump cut k happens (for syncing things to cuts).
export const jumpCutFrame = (startBeat: number, every: number, k: number) => frameOfBeat(startBeat + every * k);

// Handheld shake in px and degrees. amp ~4 for verses, 0 for hooks.
export const shake = (frame: number, seed: number, amp = 4): Partial<Pose> => ({
  x: noise1(seed, frame / 3) * amp,
  y: noise1(seed + 11, frame / 3) * amp,
  rot: noise1(seed + 23, frame / 5) * amp * 0.08,
});

// Speed lines drawn over everything during a whip. Screen space.
export const WhipLines: React.FC<{amount: number; angle?: number; seed?: number}> = ({amount, angle = 0, seed = 3}) => {
  if (amount < 0.05) return null;
  const lines = Array.from({length: 22}, (_, i) => ({
    y: hash(seed, i) * 1080,
    len: 300 + hash(seed, i + 50) * 900,
    x: hash(seed, i + 100) * 1920 - 400,
    w: 4 + hash(seed, i + 150) * 10,
  }));
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: amount * 0.85, transform: `rotate(${angle}deg) scale(1.6)`}}>
      <svg width={1920} height={1080}>
        {lines.map((l, i) => (
          <rect key={i} x={l.x} y={l.y} width={l.len} height={l.w} rx={l.w / 2} fill={i % 3 === 0 ? C.paper : C.ink} opacity={i % 3 === 0 ? 0.9 : 0.35} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

// Flash frame for jump cuts: a single-frame paper flash that decays in 3 frames.
export const CutFlash: React.FC<{frame: number; at: number; color?: string}> = ({frame, at, color = C.paper}) => {
  const d = frame - at;
  if (d < 0 || d > 3) return null;
  return <AbsoluteFill style={{background: color, opacity: (1 - d / 3) * 0.7, pointerEvents: 'none'}} />;
};
