import type { PDFPage, PDFFont } from "pdf-lib";
import { rgb } from "pdf-lib";
import type { PageSide } from "./layout";

const GREY = rgb(0.45, 0.45, 0.45);
const SIZE = 9;

/**
 * Draw a page number in the bottom margin.
 *
 * - Recto (odd/right) pages: bottom-right
 * - Verso (even/left)  pages: bottom-left
 *
 * @param area  The usable-area rectangle — area.y is the bottom of content,
 *              which equals the top of the bottom margin.
 */
export function drawPageNumber(
  page: PDFPage,
  font: PDFFont,
  pageNum: number,
  side: PageSide,
  area: { x: number; y: number; width: number },
): void {
  const text  = String(pageNum);
  const textW = font.widthOfTextAtSize(text, SIZE);
  const textH = font.heightAtSize(SIZE);

  // Place the number just inside the bottom of the usable area so it stays
  // within KDP's required minimum margin (≥ 0.25" from page edge).
  // area.y = 36pt (0.5") — positioning at area.y puts the baseline at 36pt from edge.
  const y = area.y;

  const x = side === "recto"
    ? area.x + area.width - textW  // right-aligned
    : area.x;                       // left-aligned

  page.drawText(text, { x, y, size: SIZE, font, color: GREY });
}
