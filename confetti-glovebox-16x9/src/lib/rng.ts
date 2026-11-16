// Seeded randomness. Math.random is banned in this project (tools/continuity.mjs checks); use these instead.

// mulberry32: small, fast, good enough for layout. Same seed -> same sequence on every machine.
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Stateless hash of (seed, i) -> [0,1). Use when you need the i-th random value without a running generator.
export const hash = (seed: number, i: number = 0) => {
  let h = (seed * 374761393 + i * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
};

// Seed from a string, so call sites can write seedOf('verse1-popups').
export const seedOf = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

export const range = (r: () => number, lo: number, hi: number) => lo + (hi - lo) * r();
export const pick = <T,>(r: () => number, xs: readonly T[]) => xs[Math.floor(r() * xs.length) % xs.length];

// Smooth deterministic noise in [-1,1] for camera shake and wobble.
export const noise1 = (seed: number, t: number) => {
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  const a = hash(seed, i) * 2 - 1;
  const b = hash(seed, i + 1) * 2 - 1;
  return a + (b - a) * u;
};
