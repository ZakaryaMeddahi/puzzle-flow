import type { PDFDocument, PDFFont } from "pdf-lib";
import { rgb } from "pdf-lib";
import type { PuzzleEntry, KdpTrimSize, GridStyle } from "../types";
import { PAGE_SIZE, usableArea, pageSide } from "../layout";
import { drawGrid } from "../grid";
import { drawPageNumber } from "../page-number";

const HEADING = rgb(0.08, 0.08, 0.08);
const SUBTLE = rgb(0.55, 0.55, 0.55);

/** Number of mini answer grids per row and column on an answer page. */
const COLS = 2;
const ROWS = 3;
const GRIDS_PER_PAGE = COLS * ROWS;

export interface AnswerPageOptions {
  /** Show page numbers in the bottom margin. */
  pageNumbers: boolean;
  /** Display page number for the first answer page (continues from puzzle pages). */
  firstPageNumber: number;
  gridStyle: GridStyle;
  clueBackground: boolean;
}

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
  firstPageIndex: number,
  opts: AnswerPageOptions = {
    pageNumbers: true,
    firstPageNumber: 1,
    gridStyle: "standard",
    clueBackground: false,
  },
): void {
  const { width, height } = PAGE_SIZE[trimSize];

  // Compute layout using a representative (recto) area for sizing
  // We'll recompute area per-page for positioning, but use fixed sizes so
  // grids don't shift in size between left and right pages.
  const sectionHeaderSize = 18;
  const sectionHeaderHeight = titleFont.heightAtSize(sectionHeaderSize) + 16;

  // Use the narrower of inner/outer widths so sizing is consistent across sides
  const rectoArea = usableArea(trimSize, "recto");
  const versoArea = usableArea(trimSize, "verso");
  const gridAreaWidth = Math.min(rectoArea.width, versoArea.width);
  const PAGE_NUM_H = 20; // pt - reserved at the bottom for the page number
  const gridAreaHeight = rectoArea.height - sectionHeaderHeight - PAGE_NUM_H;

  const padX = 16;
  const padY = 20;

  const cellW = (gridAreaWidth - padX * (COLS - 1)) / COLS;
  const cellH = (gridAreaHeight - padY * (ROWS - 1)) / ROWS;

  const labelSize = 9;
  const labelHeight = bodyFont.heightAtSize(labelSize) + 4;
  const gridSize = Math.min(cellW, cellH - labelHeight) * 0.95;
  const fontSize = Math.max(6, Math.floor((gridSize / 9) * 0.5));

  for (let pageIdx = 0; pageIdx * GRIDS_PER_PAGE < puzzles.length; pageIdx++) {
    const absolutePageIndex = firstPageIndex + pageIdx;
    const side = pageSide(absolutePageIndex);
    const area = usableArea(trimSize, side);

    const page = doc.addPage([width, height]);

    // "Answer Key" heading on first page only
    if (pageIdx === 0) {
      const headerText = "Answer Key";
      const hw = titleFont.widthOfTextAtSize(headerText, sectionHeaderSize);
      const headY =
        area.y + area.height - titleFont.heightAtSize(sectionHeaderSize);
      page.drawText(headerText, {
        x: area.x + area.width / 2 - hw / 2,
        y: headY,
        size: sectionHeaderSize,
        font: titleFont,
        color: HEADING,
      });
      // Thin rule below heading
      const ruleY = headY - 6;
      page.drawLine({
        start: { x: area.x, y: ruleY },
        end: { x: area.x + area.width, y: ruleY },
        thickness: 0.5,
        color: SUBTLE,
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
      const cellBottom =
        area.y +
        PAGE_NUM_H +
        gridAreaHeight -
        (row + 1) * (cellH + padY) +
        padY;

      const label = `#${entry.number}`;
      const lw = bodyFont.widthOfTextAtSize(label, labelSize);
      page.drawText(label, {
        x: cellLeft + (cellW - lw) / 2,
        y: cellBottom + gridSize + 3,
        size: labelSize,
        font: bodyFont,
        color: SUBTLE,
      });

      const gridLeft = cellLeft + (cellW - gridSize) / 2;
      drawGrid(
        page,
        bodyFont,
        entry.solution,
        gridLeft,
        cellBottom,
        gridSize,
        fontSize,
        opts.gridStyle,
        opts.clueBackground,
        entry.puzzle,
      );
    });

    // Page number
    if (opts.pageNumbers) {
      drawPageNumber(
        page,
        bodyFont,
        opts.firstPageNumber + pageIdx,
        side,
        area,
      );
    }
  }
}
