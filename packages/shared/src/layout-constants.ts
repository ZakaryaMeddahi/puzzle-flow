/**
 * Shared layout constants used by both the React preview (CSS px) and
 * the pdf-lib renderer (typographic points). All zone values are expressed
 * as fractions (0–1) of the usable area so each renderer can apply them
 * to its own coordinate system.
 */

export type ElementZone = "header" | "upper" | "center" | "lower" | "footer";
export type TextSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type FontWeight = "regular" | "bold";
export type Alignment = "left" | "center" | "right";
export type VerticalAlignment = "top" | "middle" | "bottom";

// ── Book-level style options ──────────────────────────────────────────────────

/** The three available font families for front matter text and puzzle labels. */
export type BookFont = "roboto" | "merriweather" | "lato";

/** How puzzle numbers are displayed on puzzle pages. */
export type PuzzleLabelFormat = "puzzle-n" | "hash-n" | "no-n" | "n";

/** Visual style of the Sudoku grid lines. */
export type GridStyle = "standard" | "minimal";

export const BOOK_FONTS: BookFont[] = ["roboto", "merriweather", "lato"];

export const FONT_LABELS: Record<BookFont, string> = {
  roboto:       "Roboto",
  merriweather: "Merriweather",
  lato:         "Lato",
};

export const FONT_DESCRIPTIONS: Record<BookFont, string> = {
  roboto:       "Clean sans-serif (default)",
  merriweather: "Classic serif, great readability",
  lato:         "Friendly humanist sans-serif",
};

/** CSS font-family stacks for browser preview approximation. */
export const FONT_FAMILY_CSS: Record<BookFont, string> = {
  roboto:       "'Roboto', 'Helvetica Neue', Arial, sans-serif",
  merriweather: "'Merriweather', Georgia, 'Times New Roman', serif",
  lato:         "'Lato', 'Helvetica Neue', Arial, sans-serif",
};

export const LABEL_FORMAT_EXAMPLES: Record<PuzzleLabelFormat, string> = {
  "puzzle-n": "Puzzle 1",
  "hash-n":   "#1",
  "no-n":     "No. 1",
  "n":        "1",
};

/** Fraction from the TOP of the usable area where each zone begins (0 = top, 1 = bottom). */
export const ZONE_TOP_FRAC: Record<ElementZone, number> = {
  header: 0.00,
  upper:  0.14,
  center: 0.38,
  lower:  0.62,
  footer: 0.82,
};

/** Fraction of the usable area height that each zone occupies. */
export const ZONE_HEIGHT_FRAC: Record<ElementZone, number> = {
  header: 0.14,
  upper:  0.24,
  center: 0.24,
  lower:  0.20,
  footer: 0.18,
};

/** Font sizes for React preview (CSS px, calibrated for a ~300px-wide preview panel). */
export const TEXT_SIZE_PX: Record<TextSize, number> = {
  xs:    9,
  sm:   11,
  md:   13,
  lg:   17,
  xl:   22,
  "2xl": 28,
};

/** Font sizes for pdf-lib rendering (typographic points). */
export const TEXT_SIZE_PT: Record<TextSize, number> = {
  xs:    8,
  sm:   10,
  md:   12,
  lg:   16,
  xl:   20,
  "2xl": 28,
};
