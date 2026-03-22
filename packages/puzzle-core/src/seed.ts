/**
 * seed bit layout (64-bit BigInt):
 *   Bits 63-62 -> Difficulty  (00=easy, 01=medium, 10=hard, 11=expert)
 *   Bits 61-54 -> Shard       (8 bits, reserved for future sharding)
 *   Bits 53-0  -> Sequence    (54-bit auto-increment counter per difficulty)
 */
import type { Difficulty, SeedMetadata } from "./types";

const DIFFICULTY_TO_BITS: Record<Difficulty, bigint> = {
  easy: 0n,
  medium: 1n,
  hard: 2n,
  expert: 3n,
};

const BITS_TO_DIFFICULTY: readonly [
  Difficulty,
  Difficulty,
  Difficulty,
  Difficulty,
] = ["easy", "medium", "hard", "expert"];

const SEQUENCE_MASK = (1n << 54n) - 1n; // bits 53-0

export function encodeSeed(
  difficulty: Difficulty,
  shard: number,
  sequence: bigint,
): bigint {
  const diffBits = DIFFICULTY_TO_BITS[difficulty];
  const shardBits = BigInt(shard) & 0xffn; // 8 bits
  return (diffBits << 62n) | (shardBits << 54n) | (sequence & SEQUENCE_MASK);
}

export function seedToMetadata(seed: bigint): SeedMetadata {
  const diffIndex = Number((seed >> 62n) & 3n);
  const shard = Number((seed >> 54n) & 0xffn);
  const sequence = seed & SEQUENCE_MASK;

  return {
    difficulty: BITS_TO_DIFFICULTY[diffIndex],
    shard,
    sequence,
  };
}
