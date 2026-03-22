export type KdpTrimSize = "6x9" | "8x10" | "8.5x11";
export type PuzzleDifficulty = "easy" | "medium" | "hard" | "expert";

export interface PuzzleEntry {
  /** 1-based puzzle number within the book */
  number: number;
  /** 81-char string; '0' or '.' = empty cell */
  puzzle: string;
  /** 81-char string; all digits 1-9, no blanks */
  solution: string;
}

export interface BookOptions {
  title: string;
  difficulty: PuzzleDifficulty;
  trimSize: KdpTrimSize;
  puzzles: PuzzleEntry[];
}
