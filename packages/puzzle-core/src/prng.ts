/**
 * Mulberry32 seeded PRNG.
 * folds all 64 bits of the BigInt seed into a 32-bit initial state so that seeds
 * differing only in high bits (e.g. difficulty bits) produce distinct sequences.
 */
export function createPrng(seed: bigint): () => number {
  const lo = Number(seed & 0xffffffffn);
  const hi = Number((seed >> 32n) & 0xffffffffn);
  // XOR-fold the upper half in using a large odd constant for good mixing
  let state = (lo ^ Math.imul(hi, 0x9e3779b9)) >>> 0;
  if (state === 0) state = 0x6d2b79f5;

  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

/** Fisher-Yates in-place shuffle. returns the same array for chaining. */
export function shuffle<T>(arr: T[], next: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}
