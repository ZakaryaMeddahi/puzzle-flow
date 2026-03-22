import { encodeSeed, seedToMetadata } from "../seed";
import type { Difficulty } from "../types";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];
const EXPECTED_BITS: bigint[] = [0n, 1n, 2n, 3n];

describe("encodeSeed", () => {
  it("places difficulty in bits 63-62", () => {
    for (let i = 0; i < 4; i++) {
      const seed = encodeSeed(DIFFICULTIES[i]!, 0, 0n);
      expect((seed >> 62n) & 3n).toBe(EXPECTED_BITS[i]);
    }
  });

  it("places shard in bits 61-54", () => {
    const seed = encodeSeed("easy", 255, 0n);
    expect((seed >> 54n) & 0xffn).toBe(255n);
  });

  it("places sequence in bits 53-0", () => {
    const seq = 999_999n;
    const seed = encodeSeed("easy", 0, seq);
    expect(seed & ((1n << 54n) - 1n)).toBe(seq);
  });

  it("clamps shard to 8 bits", () => {
    // shard = 256 (0x100) should be stored as 0 (overflow masked)
    const seed = encodeSeed("easy", 256, 0n);
    expect((seed >> 54n) & 0xffn).toBe(0n);
  });

  it("clamps sequence to 54 bits", () => {
    const maxSeq = (1n << 54n) - 1n;
    const seed = encodeSeed("easy", 0, maxSeq + 1n);
    expect(seed & maxSeq).toBe(0n); // wrapped to 0
  });
});

describe("seedToMetadata", () => {
  it("correctly decodes each difficulty", () => {
    for (const diff of DIFFICULTIES) {
      const seed = encodeSeed(diff, 0, 1n);
      expect(seedToMetadata(seed).difficulty).toBe(diff);
    }
  });

  it("correctly decodes shard", () => {
    const seed = encodeSeed("medium", 127, 0n);
    expect(seedToMetadata(seed).shard).toBe(127);
  });

  it("correctly decodes sequence", () => {
    const seq = 42_000n;
    const seed = encodeSeed("hard", 0, seq);
    expect(seedToMetadata(seed).sequence).toBe(seq);
  });

  it("round-trips encode → decode for all difficulties", () => {
    for (const diff of DIFFICULTIES) {
      for (const seq of [1n, 100n, (1n << 53n) - 1n]) {
        const seed = encodeSeed(diff, 5, seq);
        const meta = seedToMetadata(seed);
        expect(meta.difficulty).toBe(diff);
        expect(meta.shard).toBe(5);
        expect(meta.sequence).toBe(seq);
      }
    }
  });
});
