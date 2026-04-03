import type { PDFPage, PDFFont } from "pdf-lib";
import { rgb } from "pdf-lib";
import type {
  PuzzleEntry,
  KdpTrimSize,
  PuzzlesPerPage,
  PuzzleLabelFormat,
  GridStyle,
} from "../types";
import { usableArea, type PageSide } from "../layout";
import { drawGrid } from "../grid";
import { drawPageNumber } from "../page-number";

const HEADING = rgb(0.08, 0.08, 0.08);
const SUBTLE  = rgb(0.55, 0.55, 0.55);

/**
 * Draw a filled 5-pointed star centred at (cx, cy) in PDF coordinate space.
 * Uses drawSvgPath so no glyph support is required from the embedded font.
 * The path is defined in SVG convention (y-down); pdf-lib flips it to PDF (y-up).
 */
function drawFilledStar(page: PDFPage, cx: number, cy: number, size: number): void {
  const R = size * 0.50; // outer radius
  const r = size * 0.20; // inner radius  — gives a classic sharp star

  const segs: string[] = [];
  for (let k = 0; k < 5; k++) {
    // Outer point — clockwise from the top in SVG (y-down) convention
    const oa = (k * 72 - 90) * (Math.PI / 180);
    const ox = R * Math.cos(oa);
    const oy = R * Math.sin(oa);
    segs.push((k === 0 ? "M" : "L") + ` ${ox.toFixed(3)} ${oy.toFixed(3)}`);
    // Inner point
    const ia = oa + 36 * (Math.PI / 180);
    segs.push(`L ${(r * Math.cos(ia)).toFixed(3)} ${(r * Math.sin(ia)).toFixed(3)}`);
  }
  segs.push("Z");

  page.drawSvgPath(segs.join(" "), { x: cx, y: cy, color: SUBTLE });
}

const LABEL_SIZE = 13;
const LABEL_PAD  = 6; // pts between label baseline and grid top

/** Number of difficulty stars per level. */
const DIFFICULTY_STARS: Record<string, number> = {
  easy:   1,
  medium: 2,
  hard:   3,
  expert: 4,
};

interface CellArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Divide the usable area into equal cells for 1, 2, or 4 puzzles. */
function computeCells(
  area: ReturnType<typeof usableArea>,
  puzzlesPerPage: PuzzlesPerPage,
): CellArea[] {
  const PAD = 20; // points between cells

  if (puzzlesPerPage === 1) {
    return [{ x: area.x, y: area.y, width: area.width, height: area.height }];
  }

  if (puzzlesPerPage === 2) {
    const cellH = (area.height - PAD) / 2;
    return [
      // Top cell (higher y value in pdf-lib = visually higher)
      { x: area.x, y: area.y + cellH + PAD, width: area.width, height: cellH },
      // Bottom cell
      { x: area.x, y: area.y,               width: area.width, height: cellH },
    ];
  }

  // puzzlesPerPage === 4: 2×2 grid
  const cellW = (area.width  - PAD) / 2;
  const cellH = (area.height - PAD) / 2;
  return [
    { x: area.x,              y: area.y + cellH + PAD, width: cellW, height: cellH },
    { x: area.x + cellW + PAD, y: area.y + cellH + PAD, width: cellW, height: cellH },
    { x: area.x,              y: area.y,               width: cellW, height: cellH },
    { x: area.x + cellW + PAD, y: area.y,               width: cellW, height: cellH },
  ];
}

function formatLabel(puzzle: PuzzleEntry, format: PuzzleLabelFormat): string {
  switch (format) {
    case "hash-n": return `#${puzzle.number}`;
    case "no-n":   return `No. ${puzzle.number}`;
    case "n":      return String(puzzle.number);
    default:       return `Puzzle ${puzzle.number}`;
  }
}

/** Render one puzzle inside its cell area. */
function renderPuzzleCell(
  page: PDFPage,
  titleFont: PDFFont,
  bodyFont: PDFFont,
  puzzle: PuzzleEntry,
  cell: CellArea,
  compact: boolean,
  puzzlesPerPage: PuzzlesPerPage,
  labelFormat: PuzzleLabelFormat,
  gridStyle: GridStyle,
  showBadge: boolean,
  clueBackground: boolean,
): void {
  const labelSize = compact ? 10 : LABEL_SIZE;
  const labelPad  = compact ? 4  : LABEL_PAD;
  const labelH    = titleFont.heightAtSize(labelSize);

  const label  = formatLabel(puzzle, labelFormat);
  const labelW = titleFont.widthOfTextAtSize(label, labelSize);

  // Difficulty badge: drawn stars to the right of the label
  const starSize    = compact ? 7 : 9;
  const starGap     = compact ? 2 : 3;
  const starCount   = showBadge && puzzle.difficulty
    ? (DIFFICULTY_STARS[puzzle.difficulty] ?? 0)
    : 0;
  const badgeTotalW = starCount > 0 ? starCount * starSize + (starCount - 1) * starGap : 0;

  // Compute label x so that (label + badge) is centered in the cell
  const totalW  = labelW + (starCount > 0 ? 8 + badgeTotalW : 0);
  const labelX  = cell.x + cell.width / 2 - totalW / 2;
  const labelY  = cell.y + cell.height - labelH;

  page.drawText(label, {
    x:    labelX,
    y:    labelY,
    size: labelSize,
    font: titleFont,
    color: HEADING,
  });

  // Draw difficulty stars (geometric, font-independent)
  if (starCount > 0) {
    const starsStartX = labelX + labelW + 8;
    const starCenterY = labelY + labelH * 0.5; // vertically centred on the label cap-height
    for (let d = 0; d < starCount; d++) {
      const cx = starsStartX + d * (starSize + starGap) + starSize / 2;
      drawFilledStar(page, cx, starCenterY, starSize);
    }
  }


  // Grid — square, horizontally centred, top-aligned below the label for
  // single-puzzle (avoids a large gap when width constrains the grid size),
  // vertically centred for compact multi-puzzle layouts.
  const gridAreaH = cell.height - labelH - labelPad;
  const gridFill  = puzzlesPerPage === 1 ? 0.96 : 0.92;
  const gridSize  = Math.min(cell.width, gridAreaH) * gridFill;
  const gridX = cell.x + (cell.width - gridSize) / 2;
  const gridY = cell.y + gridAreaH - gridSize - 6; // small gap below the label

  const cellSize = gridSize / 9;
  const fontSize = Math.max(6, Math.floor(cellSize * (compact ? 0.45 : 0.52)));

  drawGrid(page, bodyFont, puzzle.puzzle, gridX, gridY, gridSize, fontSize, gridStyle, clueBackground);
}

export interface PuzzlePageOptions {
  labelFormat:     PuzzleLabelFormat;
  gridStyle:       GridStyle;
  difficultyBadge: boolean;
  clueBackground:  boolean;
  /** When provided a page number is drawn in the bottom margin. */
  pageNumber?: number;
  /** Book title shown as a subtle section header at the top of each puzzle page. */
  pageTitle?: string;
  /** Stamp a free-trial watermark at the very bottom of the page. */
  watermark?: boolean;
}

/**
 * Render one or more puzzles on a single PDF page.
 *
 * @param puzzles       1, 2, or 4 PuzzleEntry objects to place on this page.
 * @param puzzlesPerPage Total puzzles-per-page setting (determines layout).
 */
const HEADER_TITLE_SIZE = 9;   // pt — subtle, not competing with puzzles
const HEADER_RULE_GAP   = 22;  // pt — space between rule and first puzzle cell
const HEADER_TOTAL_H    = HEADER_TITLE_SIZE + 4 + HEADER_RULE_GAP; // ~27pt

export function drawPuzzlePage(
  page: PDFPage,
  titleFont: PDFFont,
  bodyFont: PDFFont,
  puzzles: PuzzleEntry[],
  trimSize: KdpTrimSize,
  side: PageSide,
  puzzlesPerPage: PuzzlesPerPage,
  opts: PuzzlePageOptions,
): void {
  const fullArea = usableArea(trimSize, side);

  // ── Page header ─────────────────────────────────────────────────────────────
  if (opts.pageTitle) {
    const titleW = bodyFont.widthOfTextAtSize(opts.pageTitle, HEADER_TITLE_SIZE);
    const titleX = fullArea.x + (fullArea.width - titleW) / 2;
    const titleY = fullArea.y + fullArea.height - bodyFont.heightAtSize(HEADER_TITLE_SIZE);
    page.drawText(opts.pageTitle, {
      x: titleX, y: titleY,
      size: HEADER_TITLE_SIZE,
      font: bodyFont,
      color: SUBTLE,
    });
    // Thin rule below the title text
    const ruleY = titleY - 4;
    page.drawLine({
      start: { x: fullArea.x,              y: ruleY },
      end:   { x: fullArea.x + fullArea.width, y: ruleY },
      thickness: 0.4,
      color: SUBTLE,
    });
  }

  // Shrink area available to puzzle cells so they don't overlap the header
  const headerReserved = opts.pageTitle ? HEADER_TOTAL_H : 0;
  const area = {
    ...fullArea,
    height: fullArea.height - headerReserved,
  };

  const cells   = computeCells(area, puzzlesPerPage);
  const compact = puzzlesPerPage > 1;

  puzzles.forEach((puzzle, i) => {
    if (cells[i]) {
      renderPuzzleCell(
        page, titleFont, bodyFont, puzzle, cells[i]!,
        compact, puzzlesPerPage, opts.labelFormat, opts.gridStyle, opts.difficultyBadge, opts.clueBackground,
      );
    }
  });

  if (opts.pageNumber !== undefined) {
    drawPageNumber(page, bodyFont, opts.pageNumber, side, area);
  }

  if (opts.watermark) {
    const WATERMARK_TEXT = "Generated by PuzzleFlow — puzzleflow.app";
    const WATERMARK_SIZE = 7;
    const wColor = rgb(0.70, 0.70, 0.70);
    const textW = bodyFont.widthOfTextAtSize(WATERMARK_TEXT, WATERMARK_SIZE);
    page.drawText(WATERMARK_TEXT, {
      x:    fullArea.x + (fullArea.width - textW) / 2,
      y:    fullArea.y - bodyFont.heightAtSize(WATERMARK_SIZE) - 2,
      size: WATERMARK_SIZE,
      font: bodyFont,
      color: wColor,
    });
  }
}
