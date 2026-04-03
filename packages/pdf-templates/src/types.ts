import type { BookFont, PuzzleLabelFormat, GridStyle } from "@kdp/shared";

export type { BookFont, PuzzleLabelFormat, GridStyle };

export type KdpTrimSize = "6x9" | "8x10" | "8.5x11";
export type PuzzleDifficulty = "easy" | "medium" | "hard" | "expert";

export interface PuzzleEntry {
  /** 1-based puzzle number within the book */
  number: number;
  /** 81-char string; '0' or '.' = empty cell */
  puzzle: string;
  /** 81-char string; all digits 1-9, no blanks */
  solution: string;
  /** Difficulty level — used for the difficulty badge feature */
  difficulty?: string;
}

export type PuzzlesPerPage = 1 | 2 | 4;

export interface BookOptions {
  title: string;
  difficulty: string;
  trimSize: KdpTrimSize;
  puzzles: PuzzleEntry[];
  puzzlesPerPage: PuzzlesPerPage;
  /** Font family for front matter text and puzzle labels. Default: "roboto" */
  font?: BookFont;
  /** Show page numbers on puzzle and answer pages. Default: true */
  pageNumbers?: boolean;
  /** Puzzle label format on puzzle pages. Default: "puzzle-n" → "Puzzle 1" */
  labelFormat?: PuzzleLabelFormat;
  /** Grid line visual style. Default: "standard" */
  gridStyle?: GridStyle;
  /** Show difficulty star indicators next to puzzle labels. Default: false */
  difficultyBadge?: boolean;
  /** Shade pre-filled clue cells with a light grey background. Default: false */
  clueBackground?: boolean;
  /** Stamp a free-trial watermark footer on every puzzle page. Default: false */
  watermark?: boolean;
}
