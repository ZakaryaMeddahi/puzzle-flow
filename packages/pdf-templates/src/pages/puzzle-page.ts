import type { PDFPage, PDFFont } from "pdf-lib";
import { rgb } from "pdf-lib";
import type { PuzzleEntry, KdpTrimSize, PuzzlesPerPage } from "../types";
import { usableArea, type PageSide } from "../layout";
import { drawGrid } from "../grid";

const BLACK = rgb(0, 0, 0);
const GREY  = rgb(0.45, 0.45, 0.45);

const LABEL_SIZE = 13;
const LABEL_PAD  = 6;  // pts between label baseline and grid top

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
  const PAD = 14; // points between cells

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
    // Top-left
    { x: area.x,           y: area.y + cellH + PAD, width: cellW, height: cellH },
    // Top-right
    { x: area.x + cellW + PAD, y: area.y + cellH + PAD, width: cellW, height: cellH },
    // Bottom-left
    { x: area.x,           y: area.y,               width: cellW, height: cellH },
    // Bottom-right
    { x: area.x + cellW + PAD, y: area.y,           width: cellW, height: cellH },
  ];
}

/** Render one puzzle inside its cell area. */
function renderPuzzleCell(
  page: PDFPage,
  titleFont: PDFFont,
  bodyFont: PDFFont,
  puzzle: PuzzleEntry,
  cell: CellArea,
  compact: boolean,
): void {
  const labelSize  = compact ? 10 : LABEL_SIZE;
  const labelPad   = compact ? 4 : LABEL_PAD;
  const labelH     = titleFont.heightAtSize(labelSize);

  // Label
  const label = `Puzzle ${puzzle.number}`;
  const labelW = titleFont.widthOfTextAtSize(label, labelSize);
  const labelY = cell.y + cell.height - labelH;
  page.drawText(label, {
    x: cell.x + cell.width / 2 - labelW / 2,
    y: labelY,
    size: labelSize,
    font: titleFont,
    color: BLACK,
  });

  // Thin rule under label (only for single-puzzle layout)
  if (!compact) {
    const ruleY = labelY - 5;
    page.drawLine({
      start: { x: cell.x, y: ruleY },
      end:   { x: cell.x + cell.width, y: ruleY },
      thickness: 0.5,
      color: GREY,
    });
  }

  // Grid — square, centred in remaining cell height
  const gridAreaH = cell.height - labelH - labelPad - (compact ? 0 : 10);
  const gridSize  = Math.min(cell.width, gridAreaH) * 0.92;
  const gridX = cell.x + (cell.width  - gridSize) / 2;
  const gridY = cell.y + (gridAreaH   - gridSize) / 2;

  const cellSize = gridSize / 9;
  const fontSize = Math.max(6, Math.floor(cellSize * (compact ? 0.45 : 0.52)));

  drawGrid(page, bodyFont, puzzle.puzzle, gridX, gridY, gridSize, fontSize);
}

/**
 * Render one or more puzzles on a single PDF page.
 *
 * @param puzzles       1, 2, or 4 PuzzleEntry objects to place on this page.
 * @param puzzlesPerPage Total puzzles-per-page setting (determines layout).
 */
export function drawPuzzlePage(
  page: PDFPage,
  titleFont: PDFFont,
  bodyFont: PDFFont,
  puzzles: PuzzleEntry[],
  trimSize: KdpTrimSize,
  side: PageSide,
  puzzlesPerPage: PuzzlesPerPage,
): void {
  const area  = usableArea(trimSize, side);
  const cells = computeCells(area, puzzlesPerPage);
  const compact = puzzlesPerPage > 1;

  puzzles.forEach((puzzle, i) => {
    if (cells[i]) {
      renderPuzzleCell(page, titleFont, bodyFont, puzzle, cells[i]!, compact);
    }
  });
}
