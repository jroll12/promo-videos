// The debris ledger: every piece of confetti, receipt, crumb and paint dot that settles during the film, decided
// once, here. Sections never choose where debris lands; they only draw <DebrisLayer>. In the final hook every piece
// flies from where it landed to its place in the mural (src/lib/confetti/mural.ts).
import {CONFETTI_COLORS, C} from '../theme';
import {DURATION, line} from '../../data/timing';
import {confettiLevelAt} from '../../data/contract';
import {rng, hash} from '../rng';
import {muralTargets} from './mural';

export type DebrisKind = 'confetti' | 'receipt' | 'crumb' | 'paint';
export type Debris = {
  id: number;
  kind: DebrisKind;
  color: string;
  emit: number; // global frame it starts falling
  x: number; // landing, desktop px
  y: number;
  rot: number;
  w: number; // size when landed (world px)
  h: number;
  // mural target (world px), size and rotation in the mural
  mx: number;
  my: number;
  mw: number;
  mh: number;
  mrot: number;
  stagger: number; // 0..1, order in which pieces leave for the mural
  label?: string; // receipts only: text printed on it in the mural
};

export const SETTLED_CONFETTI = 600;
const FALL = 18; // frames from emit to landing
export const FALL_FRAMES = FALL;

const build = (): Debris[] => {
  const out: Debris[] = [];
  const r = rng(20261116);

  // 1. confetti: piece k lands when the confetti level first reaches k / SETTLED_CONFETTI.
  const emitOf: number[] = [];
  let k = 0;
  for (let f = 0; f < DURATION && k < SETTLED_CONFETTI; f++) {
    while (k < SETTLED_CONFETTI && confettiLevelAt(f) * SETTLED_CONFETTI >= k + 1) emitOf[k++] = f;
  }
  while (k < SETTLED_CONFETTI) emitOf[k++] = DURATION - 1;
  for (let i = 0; i < SETTLED_CONFETTI; i++) {
    const onFloor = r() < 0.72;
    const x = 20 + r() * 1880;
    // the floor pile grows taller as the film goes on
    const y = onFloor ? 1074 - r() * (20 + 70 * (i / SETTLED_CONFETTI)) : 70 + r() * 860;
    out.push({
      id: out.length,
      kind: 'confetti',
      color: CONFETTI_COLORS[Math.floor(r() * CONFETTI_COLORS.length)],
      emit: emitOf[i],
      x,
      y,
      rot: r() * 360,
      w: 14 + r() * 6,
      h: 8 + r() * 4,
      mx: 0, my: 0, mw: 0, mh: 0, mrot: 0, stagger: 0,
    });
  }

  // 2. receipts (17: 16 city blocks + 1 label in the mural) spill while "Wallet got receipts from a month ago" is sung.
  const wal = line('v1.13');
  for (let i = 0; i < 17; i++) {
    out.push({
      id: out.length,
      kind: 'receipt',
      color: C.paper,
      emit: Math.round(wal.startFrame + (i / 17) * (wal.endFrame - wal.startFrame)),
      x: 80 + r() * 700,
      y: 960 + r() * 100,
      rot: -40 + r() * 80,
      w: 46,
      h: 70,
      mx: 0, my: 0, mw: 0, mh: 0, mrot: 0, stagger: 0,
    });
  }

  // 3. crumbs fall like dominoes during "Crumbs in the car doing dominoes": left to right in a line.
  const cr = line('v1.14');
  for (let i = 0; i < 140; i++) {
    out.push({
      id: out.length,
      kind: 'crumb',
      color: C.mustard,
      emit: Math.round(cr.startFrame + (i / 140) * (cr.endFrame - cr.startFrame)),
      x: 900 + (i / 140) * 980 + (r() - 0.5) * 20,
      y: 1050 - r() * 30,
      rot: r() * 360,
      w: 9 + r() * 5,
      h: 9 + r() * 5,
      mx: 0, my: 0, mw: 0, mh: 0, mrot: 0, stagger: 0,
    });
  }

  // 4. paint: "Paint on the floor, little dots on the ceiling" (v2.16) then "let it splatter nonstop" (v3.11).
  const paintBatch = (id: string, n: number, ceiling: boolean) => {
    const l = line(id);
    for (let i = 0; i < n; i++) {
      const up = ceiling && i % 2 === 1;
      out.push({
        id: out.length,
        kind: 'paint',
        color: CONFETTI_COLORS[Math.floor(r() * CONFETTI_COLORS.length)],
        emit: Math.round(l.startFrame + (i / n) * (l.endFrame - l.startFrame)),
        x: 30 + r() * 1860,
        y: up ? 60 + r() * 80 : ceiling ? 990 + r() * 80 : 80 + r() * 980,
        rot: 0,
        w: 10 + r() * 16,
        h: 0,
        mx: 0, my: 0, mw: 0, mh: 0, mrot: 0, stagger: 0,
      });
    }
  };
  paintBatch('v2.16', 120, true);
  paintBatch('v3.11', 90, false);

  muralTargets(out);
  out.forEach((d) => {
    d.stagger = hash(777, d.id);
  });
  return out;
};

export const DEBRIS: Debris[] = build();
