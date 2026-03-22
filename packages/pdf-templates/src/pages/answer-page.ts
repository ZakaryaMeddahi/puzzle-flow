import type { PDFDocument, PDFFont } from "pdf-lib";
import { rgb } from "pdf-lib";
import type { PuzzleEntry } from "../types";
import type { KdpTrimSize } from "../types";
import { PAGE_SIZE, usableArea } from "../layout";
import { drawGrid } from "../grid";

const BLACK = rgb(0, 0, 0);
const GREY  = rgb(0.45, 0.45, 0.45);

/** Number of mini answer grids per row and column on an answer page. */
const COLS = 2;
const ROWS = 3;
const GRIDS_PER_PAGE = COLS * ROWS;

/**
 * Append all answer-key pages to `doc`.
 * Each page holds up to 6 mini grids (2 columns × 3 rows) with puzzle numbers.
 */
export function addAnswerPages(
  doc: PDFDocument,
  titleFont: PDFFont,
  bodyFont: PDFFont,
  puzzles: PuzzleEntry[],
  trimSize: KdpTrimSize,
): void {
  const { width, height } = PAGE_SIZE[trimSize];
  const area = usableArea(trimSize);

  // ── Header height ──────────────────────────────────────────────────────────
  const sectionHeaderSize = 18;
  const sectionHeaderHeight = titleFont.heightAtSize(sectionHeaderSize) + 16;

  const gridAreaHeight = area.height - sectionHeaderHeight;
  const gridAreaWidth  = area.width;

  // Padding between grids
  const padX = 16;
  const padY = 20;

  const cellW = (gridAreaWidth  - padX * (COLS - 1)) / COLS;
  const cellH = (gridAreaHeight - padY * (ROWS - 1)) / ROWS;

  // Leave room for the puzzle-number label above each grid
  const labelSize = 9;
  const labelHeight = bodyFont.heightAtSize(labelSize) + 4;
  const gridSize = Math.min(cellW, cellH - labelHeight) * 0.95;
  const fontSize = Math.max(6, Math.floor(gridSize / 9 * 0.5));

  for (let pageIdx = 0; pageIdx * GRIDS_PER_PAGE < puzzles.length; pageIdx++) {
    const page = doc.addPage([width, height]);

    // Section header only on first answer page
    if (pageIdx === 0) {
      const headerText = "Answer Key";
      const hw = titleFont.widthOfTextAtSize(headerText, sectionHeaderSize);
      page.drawText(headerText, {
        x: area.x + area.width / 2 - hw / 2,
        y: area.y + area.height - titleFont.heightAtSize(sectionHeaderSize),
        size: sectionHeaderSize,
        font: titleFont,
        color: BLACK,
      });
    }

    const slice = puzzles.slice(
      pageIdx * GRIDS_PER_PAGE,
      (pageIdx + 1) * GRIDS_PER_PAGE,
    );

    slice.forEach((entry, idx) => {
      const col = idx % COLS;
      const row = (idx / COLS) | 0;

      const cellLeft = area.x + col * (cellW + padX);
      // y is measured from bottom; row 0 is the top row visually
      const cellBottom =
        area.y +
        gridAreaHeight -
        (row + 1) * (cellH + padY) +
        padY;

      // Puzzle-number label
      const label = `#${entry.number}`;
      const lw = bodyFont.widthOfTextAtSize(label, labelSize);
      page.drawText(label, {
        x: cellLeft + (cellW - lw) / 2,
        y: cellBottom + gridSize + 3,
        size: labelSize,
        font: bodyFont,
        color: GREY,
      });

      // Mini solution grid
      const gridLeft = cellLeft + (cellW - gridSize) / 2;
      drawGrid(page, bodyFont, entry.solution, gridLeft, cellBottom, gridSize, fontSize);
    });
  }
}
