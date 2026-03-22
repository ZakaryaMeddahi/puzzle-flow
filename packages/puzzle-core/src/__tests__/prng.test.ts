import { createPrng, shuffle } from "../prng";

describe("createPrng", () => {
  it("returns values in [0, 1)", () => {
    const next = createPrng(42n);
    for (let i = 0; i < 1000; i++) {
      const v = next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("is deterministic — same seed produces same sequence", () => {
    const a = createPrng(12345n);
    const b = createPrng(12345n);
    for (let i = 0; i < 50; i++) {
      expect(a()).toBe(b());
    }
  });

  it("produces different sequences for different seeds", () => {
    const a = createPrng(1n);
    const b = createPrng(2n);
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });

  it("handles seeds that differ only in difficulty bits (high bits)", () => {
    // easy seed = 0n<<62 | 100n,  expert seed = 3n<<62 | 100n
    const easySeed   = (0n << 62n) | 100n;
    const expertSeed = (3n << 62n) | 100n;
    const a = createPrng(easySeed);
    const b = createPrng(expertSeed);
    expect(a()).not.toBe(b());
  });

  it("handles zero-like state by falling back to a non-zero seed", () => {
    // seed that maps lo^hi*const to 0 — just verify it runs without hanging
    const next = createPrng(0n);
    expect(() => next()).not.toThrow();
  });
});

describe("shuffle", () => {
  it("returns the same array reference", () => {
    const arr = [1, 2, 3];
    const next = createPrng(1n);
    expect(shuffle(arr, next)).toBe(arr);
  });

  it("preserves all elements (is a permutation)", () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const arr = [...original];
    const next = createPrng(99n);
    shuffle(arr, next);
    expect(arr.sort((a, b) => a - b)).toEqual(original);
  });

  it("is deterministic — same PRNG state produces same shuffle", () => {
    const arr1 = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const arr2 = [...arr1];
    shuffle(arr1, createPrng(7n));
    shuffle(arr2, createPrng(7n));
    expect(arr1).toEqual(arr2);
  });

  it("produces different orderings for different seeds", () => {
    const make = (seed: bigint) => {
      const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      shuffle(arr, createPrng(seed));
      return arr;
    };
    expect(make(1n)).not.toEqual(make(2n));
  });
});
