import type { PDFPage, PDFFont } from "pdf-lib";
import { rgb } from "pdf-lib";
import type { PuzzleEntry } from "../types";
import type { KdpTrimSize } from "../types";
import { usableArea } from "../layout";
import { drawGrid } from "../grid";

const BLACK = rgb(0, 0, 0);
const GREY  = rgb(0.45, 0.45, 0.45);

/**
 * Render a single puzzle page.
 * Layout: header line with puzzle number, centred grid below.
 */
export function drawPuzzlePage(
  page: PDFPage,
  titleFont: PDFFont,
  bodyFont: PDFFont,
  puzzle: PuzzleEntry,
  trimSize: KdpTrimSize,
): void {
  const area = usableArea(trimSize);

  // ── Header ─────────────────────────────────────────────────────────────────
  const headerText = `Puzzle ${puzzle.number}`;
  const headerSize = 16;
  const headerWidth = titleFont.widthOfTextAtSize(headerText, headerSize);
  const headerY = area.y + area.height - titleFont.heightAtSize(headerSize);

  page.drawText(headerText, {
    x: area.x + area.width / 2 - headerWidth / 2,
    y: headerY,
    size: headerSize,
    font: titleFont,
    color: BLACK,
  });

  // Thin rule under header
  const ruleY = headerY - 6;
  page.drawLine({
    start: { x: area.x, y: ruleY },
    end:   { x: area.x + area.width, y: ruleY },
    thickness: 0.5,
    color: GREY,
  });

  // ── Grid ───────────────────────────────────────────────────────────────────
  // The grid is square; use the smaller of usable width / height-below-header.
  const belowHeader = ruleY - 12 - area.y; // available height for the grid
  const gridSize = Math.min(area.width, belowHeader) * 0.92;

  const gridX = area.x + (area.width - gridSize) / 2;
  const gridY = area.y + (belowHeader - gridSize) / 2;

  const cellSize = gridSize / 9;
  const fontSize = Math.floor(cellSize * 0.52);

  drawGrid(page, bodyFont, puzzle.puzzle, gridX, gridY, gridSize, fontSize);
}
