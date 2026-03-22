import type { KdpTrimSize } from "./types";

const PT = 72; // points per inch

/** Page dimensions in points for each KDP trim size. */
export const PAGE_SIZE: Record<KdpTrimSize, { width: number; height: number }> = {
  "6x9":    { width: 6 * PT,   height: 9 * PT },
  "8x10":   { width: 8 * PT,   height: 10 * PT },
  "8.5x11": { width: 8.5 * PT, height: 11 * PT },
};

/** Minimum safe margins in points (0.5" all sides — KDP-safe). */
export const MARGIN = 0.5 * PT; // 36 pt

/** Compute the usable area inside the margins. */
export function usableArea(trimSize: KdpTrimSize): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const { width, height } = PAGE_SIZE[trimSize];
  return {
    x: MARGIN,
    y: MARGIN,
    width: width - 2 * MARGIN,
    height: height - 2 * MARGIN,
  };
}
