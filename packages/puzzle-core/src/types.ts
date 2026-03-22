// difficulty is a string union so it's compatible with the @kdp/shared Difficulty enum
// (whose members are identical string values).
export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface PuzzleResult {
  seed: bigint;
  difficulty: Difficulty;
  /** 81-char string; digits 1-9 are clues, '0' is an empty cell */
  puzzle: string;
  /** 81-char string; complete, fully solved grid */
  solution: string;
}

export interface SeedMetadata {
  difficulty: Difficulty;
  shard: number;
  sequence: bigint;
}

export const CLUES_BY_DIFFICULTY: Record<
  Difficulty,
  { min: number; max: number }
> = {
  easy: { min: 36, max: 45 },
  medium: { min: 27, max: 35 },
  hard: { min: 22, max: 26 },
  expert: { min: 17, max: 21 },
};
