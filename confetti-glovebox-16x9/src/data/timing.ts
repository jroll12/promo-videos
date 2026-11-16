// Typed access to timing.json. Section code refers to time ONLY through these helpers (line ids, beat and bar
// indices), never through literal frame numbers, so a change to the grid offset moves the whole film.
import raw from '../../timing.json';

export type Word = {w: string; start: number; end: number; startFrame: number; p: number};
export type Line = {
  id: string;
  section: string;
  index: number;
  text: string;
  start: number;
  end: number;
  startFrame: number;
  endFrame: number;
  bar: number;
  bars: number;
  gridStart: number;
  gridEnd: number;
  gridStartFrame: number;
  gridEndFrame: number;
  confidence: number;
  wordsMatched: number;
  source: 'aligned' | 'grid' | 'manual';
  flags: string[];
  words: Word[];
};
export type SectionId = 'intro' | 'verse1' | 'hook1' | 'verse2' | 'prehook' | 'hook2' | 'bridge' | 'verse3' | 'hook3' | 'outro';
export type Section = {
  id: SectionId;
  type: string;
  start: number;
  end: number;
  startFrame: number;
  endFrame: number;
  startBar: number;
  bars: number;
  intensity: number;
  tailBars?: number;
};

const T = raw as unknown as {
  fps: number;
  durationInFrames: number;
  audio: {file: string; duration: number};
  tempo: {beatSec: number; barSec: number; beatsPerBar: number; gridOffsetSec: number; barPhase: number; firstBarSec: number; measuredBpm: number};
  sections: Section[];
  bars: {i: number; t: number; frame: number; section: string}[];
  beats: {i: number; t: number; frame: number; bar: number; beatInBar: number}[];
  lines: Line[];
};

export const FPS = T.fps;
export const DURATION = T.durationInFrames;
export const BPM = T.tempo.measuredBpm;
export const BEAT_SEC = T.tempo.beatSec;
export const BAR_SEC = T.tempo.barSec;
export const BEAT_FRAMES = BEAT_SEC * FPS; // 12.857..., not an integer: never accumulate it
export const BAR_FRAMES = BAR_SEC * FPS;
export const AUDIO_FILE = 'song.m4a';
export const SECTIONS = T.sections;
export const LINES = T.lines;
export const BARS = T.bars;

const FIRST_BAR = T.tempo.firstBarSec;

// --- conversions (global frames) ---
export const frameOfSec = (t: number) => Math.round(t * FPS);
// Fractional bar index at a global frame. Bar 0 beat 1 is 0.0; bar 3 beat 3 is 3.5.
export const barAt = (frame: number) => (frame / FPS - FIRST_BAR) / BAR_SEC;
// Fractional beat index counted from bar 0 beat 1 (so beat 4k is a downbeat).
export const beatAt = (frame: number) => (frame / FPS - FIRST_BAR) / BEAT_SEC;
// Global frame of a (possibly fractional) bar or beat index. Rounded once, here.
export const frameOfBar = (bar: number) => Math.round((FIRST_BAR + bar * BAR_SEC) * FPS);
export const frameOfBeat = (beat: number) => Math.round((FIRST_BAR + beat * BEAT_SEC) * FPS);
// Beats elapsed since the most recent beat (0 right on the beat, approaching 1 just before the next).
export const beatPhase = (frame: number) => {
  const b = beatAt(frame);
  return b - Math.floor(b);
};
export const barPhase = (frame: number) => {
  const b = barAt(frame);
  return b - Math.floor(b);
};

// --- lookups ---
const byId = new Map(T.lines.map((l) => [l.id, l]));
export const line = (id: string): Line => {
  const l = byId.get(id);
  if (!l) throw new Error(`unknown line ${id}`);
  return l;
};
export const linesOf = (section: SectionId): Line[] => T.lines.filter((l) => l.section === section);
export const section = (id: SectionId): Section => {
  const s = T.sections.find((x) => x.id === id);
  if (!s) throw new Error(`unknown section ${id}`);
  return s;
};
export const sectionAt = (frame: number): Section =>
  T.sections.find((s) => frame >= s.startFrame && frame < s.endFrame) ?? T.sections[T.sections.length - 1];
// The line being sung at a global frame (or the last one that started), within an optional section.
export const lineAt = (frame: number, within?: SectionId): Line | undefined => {
  const pool = within ? linesOf(within) : T.lines;
  let cur: Line | undefined;
  for (const l of pool) if (l.startFrame <= frame) cur = l;
  return cur;
};
// Word index (into line.words) being sung at a global frame, -1 before the first word. Grid lines have no words.
export const wordAt = (l: Line, frame: number) => {
  let k = -1;
  l.words.forEach((w, i) => {
    if (w.startFrame <= frame) k = i;
  });
  return k;
};

// Audio-reactive envelopes, precomputed per frame (0..1). Read-only.
import energyRaw from './energy.json';
const E = energyRaw as {rms: number[]; onset: number[]; low: number[]};
const at = (xs: number[], f: number) => xs[Math.max(0, Math.min(xs.length - 1, Math.round(f)))] ?? 0;
export const energy = (frame: number) => at(E.rms, frame);
export const onset = (frame: number) => at(E.onset, frame);
export const kick = (frame: number) => at(E.low, frame);
