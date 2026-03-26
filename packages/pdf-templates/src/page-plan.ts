import type { FrontMatterConfig } from "@kdp/shared";
import type { PuzzleEntry, PuzzlesPerPage } from "./types";

export type PageSlotKind =
  | "title"
  | "copyright"
  | "how-to-play"
  | "introduction"
  | "blank"
  | "puzzle"
  | "answer";

export interface PageSlot {
  kind: PageSlotKind;
  /** 0-based index within the PDF document — determines recto/verso. */
  pageIndex: number;
  /** Only set for puzzle slots — the puzzles to render on this page. */
  puzzles?: PuzzleEntry[];
}

export interface PagePlan {
  slots: PageSlot[];
  /** 0-based pageIndex where the first puzzle page starts. */
  puzzleStartIndex: number;
}

/** Standard Sudoku rules used when the user leaves How to Play blank. */
export const DEFAULT_HOW_TO_PLAY_TEXT =
  "Fill in the 9×9 grid so that every row, every column, and every " +
  "3×3 box contains the digits 1 through 9. Each digit may appear " +
  "only once in each row, column, and box. No mathematics required — " +
  "only logic and patience.";

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * Build the complete ordered page slot list before any PDF rendering begins.
 * This lets the TOC (if added later) know page numbers in advance, and
 * guarantees puzzles always start on a recto (right-hand / even pageIndex) page.
 */
export function buildPagePlan(
  puzzles: PuzzleEntry[],
  puzzlesPerPage: PuzzlesPerPage,
  frontMatter?: FrontMatterConfig | null,
): PagePlan {
  const fm = frontMatter ?? {
    titlePage: true,
    copyrightPage: true,
    howToPlay: true,
    introduction: false,
    answerPages: true,
  };

  const slots: PageSlot[] = [];
  let idx = 0;

  if (fm.titlePage) {
    slots.push({ kind: "title", pageIndex: idx++ });
  }
  if (fm.copyrightPage) {
    slots.push({ kind: "copyright", pageIndex: idx++ });
  }
  if (fm.howToPlay) {
    slots.push({ kind: "how-to-play", pageIndex: idx++ });
  }
  if (fm.introduction && fm.introText?.trim()) {
    slots.push({ kind: "introduction", pageIndex: idx++ });
  }

  // Ensure puzzles start on recto (even pageIndex).
  if (idx % 2 !== 0) {
    slots.push({ kind: "blank", pageIndex: idx++ });
  }

  const puzzleStartIndex = idx;

  // Group puzzles into pages.
  const pages = chunk(puzzles, puzzlesPerPage);
  for (const group of pages) {
    slots.push({ kind: "puzzle", pageIndex: idx++, puzzles: group });
  }

  // Answer pages.
  if (fm.answerPages && puzzles.length > 0) {
    const answerPageCount = Math.ceil(puzzles.length / 6);
    for (let i = 0; i < answerPageCount; i++) {
      slots.push({ kind: "answer", pageIndex: idx++ });
    }
  }

  return { slots, puzzleStartIndex };
}
