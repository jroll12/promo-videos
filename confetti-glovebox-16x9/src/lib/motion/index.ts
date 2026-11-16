// Easing and beat-locked motion helpers. All pure functions of a frame number.
import {beatAt, barAt, BEAT_FRAMES, frameOfBeat} from '../../data/timing';
import {hash, noise1} from '../rng';

export const clamp = (x: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// Map x from [a,b] to [0,1], clamped.
export const prog = (x: number, a: number, b: number) => clamp((x - a) / (b - a));

export const ease = {
  linear: (t: number) => t,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inCubic: (t: number) => t * t * t,
  outExpo: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  // Overshoots then settles: the house "pop" for anything that appears.
  outBack: (t: number, s = 1.9) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  // Bouncy settle, for things that land.
  outElastic: (t: number) =>
    t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
};

// Pop-in: 0 before `at`, overshoots to 1 over `dur` frames.
export const popIn = (frame: number, at: number, dur = 8) => (frame < at ? 0 : ease.outBack(clamp((frame - at) / dur)));

// 1 on every beat, decaying to 0 over `decayBeats`. Use for flashes, punches, scale bumps.
export const beatPulse = (frame: number, decayBeats = 0.5, everyBeats = 1, offsetBeats = 0) => {
  const b = (beatAt(frame) - offsetBeats) / everyBeats;
  const since = (b - Math.floor(b)) * everyBeats; // beats since the last hit
  return Math.exp(-since / Math.max(0.01, decayBeats) * 3);
};
// Same, on bar downbeats.
export const barPulse = (frame: number, decayBeats = 1) => beatPulse(frame, decayBeats, 4);

// Index of the current beat (integer, global). Handy for "change something every beat" logic.
export const beatIndex = (frame: number) => Math.floor(beatAt(frame) + 1e-6);
export const barIndex = (frame: number) => Math.floor(barAt(frame) + 1e-6);
// Frames since the current beat started.
export const framesSinceBeat = (frame: number) => frame - frameOfBeat(beatIndex(frame));

// Half-time float for the pre-hook: slow drift on two axes, one cycle per 2 bars. Returns px offsets and degrees.
export const float = (frame: number, seed: number, amp = 24) => {
  const t = beatAt(frame) / 8; // one unit per 2 bars
  return {
    x: noise1(seed, t * 1.3) * amp,
    y: Math.sin((t + hash(seed, 1)) * Math.PI * 2) * amp,
    rot: noise1(seed + 7, t) * 6,
  };
};

// Wobble for hand-drawn liveliness: tiny, cheap, deterministic.
export const wobble = (frame: number, seed: number, amp = 2) => noise1(seed, frame / 6) * amp;

// "Hold" helper for gags: a gag must be readable for at least 2 beats.
export const MIN_HOLD_FRAMES = Math.ceil(BEAT_FRAMES * 2);
