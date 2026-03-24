import type { KdpTrimSize } from "./types";

const PT = 72; // points per inch

/** Page dimensions in points for each KDP trim size. */
export const PAGE_SIZE: Record<KdpTrimSize, { width: number; height: number }> = {
  "6x9":    { width: 6 * PT,   height: 9 * PT },
  "8x10":   { width: 8 * PT,   height: 10 * PT },
  "8.5x11": { width: 8.5 * PT, height: 11 * PT },
};

/** Outer margin (away from spine): 0.5" */
const OUTER = 0.5 * PT; // 36 pt
/** Inner margin (toward spine/gutter): 0.75" — extra room for binding */
const INNER = 0.75 * PT; // 54 pt
/** Top / bottom margins: 0.5" */
const VERT  = 0.5 * PT; // 36 pt

/**
 * Recto = right-hand page (odd physical page: 1, 3, 5 …).
 * Verso = left-hand page  (even physical page: 2, 4, 6 …).
 *
 * Pass the 0-based page index from the PDF; index 0 is the title page (recto).
 */
export type PageSide = "recto" | "verso";

export function pageSide(pageIndex: number): PageSide {
  return pageIndex % 2 === 0 ? "recto" : "verso";
}

/** Compute the usable area inside the gutter-aware margins. */
export function usableArea(
  trimSize: KdpTrimSize,
  side: PageSide,
): { x: number; y: number; width: number; height: number } {
  const { width, height } = PAGE_SIZE[trimSize];
  // Recto: spine is on the LEFT  → left = INNER, right = OUTER
  // Verso: spine is on the RIGHT → left = OUTER, right = INNER
  const left  = side === "recto" ? INNER : OUTER;
  const right = side === "recto" ? OUTER : INNER;
  return {
    x:      left,
    y:      VERT,
    width:  width  - left - right,
    height: height - 2 * VERT,
  };
}
