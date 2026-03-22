export enum Difficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
  EXPERT = "expert",
}

export enum PuzzleStatus {
  AVAILABLE = "available",
  PENDING = "pending",
  CONFIRMED = "confirmed",
  EXPIRED = "expired",
}

export enum BookStatus {
  DRAFT = "draft",
  PENDING = "pending",
  READY = "ready",
  EXPIRED = "expired",
}

export enum UniquenessLevel {
  BOOK = "book",
  USER = "user",
  GLOBAL = "global",
}

export enum TrimSize {
  SIX_BY_NINE = "6x9",
  EIGHT_BY_TEN = "8x10",
  EIGHT_HALF_BY_ELEVEN = "8.5x11",
}

export const CONSTANTS = {
  PUZZLE_POOL_TARGET: 100_000,
  PUZZLE_POOL_REFILL_THRESHOLD: 20_000,
  PUZZLE_BATCH_SIZE: 5_000,
  RESERVATION_TTL_MINUTES: 30,
  PDF_EXPIRY_DAYS: 7,
  CLUES_BY_DIFFICULTY: {
    [Difficulty.EASY]: { min: 36, max: 45 },
    [Difficulty.MEDIUM]: { min: 27, max: 35 },
    [Difficulty.HARD]: { min: 22, max: 26 },
    [Difficulty.EXPERT]: { min: 17, max: 21 },
  },
} as const;
