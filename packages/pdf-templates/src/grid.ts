import type { PDFPage, PDFFont } from "pdf-lib";
import { rgb } from "pdf-lib";

const BLACK = rgb(0, 0, 0);
const THIN = 0.5; // pt -- cell border thickness
const THICK = 2; // pt -- 3×3 box border thickness

/**
 * Draw a Sudoku grid onto `page`.
 *
 * @param page      Target PDF page
 * @param font      Font used for clue digits
 * @param grid      81-char string ('0'/'.' = empty, '1'-'9' = clue)
 * @param startX    Left edge of the grid (points)
 * @param startY    Bottom edge of the grid (points, pdf-lib coords)
 * @param size      Side length of the square grid (points)
 * @param fontSize  Size of clue digits
 * @param gridStyle "standard" = solid black lines; "minimal" = lighter grey lines
 */
export function drawGrid(
  page: PDFPage,
  font: PDFFont,
  grid: string,
  startX: number,
  startY: number,
  size: number,
  fontSize: number,
  gridStyle: "standard" | "minimal" = "standard",
  clueBackground = false,
  /** When provided, used instead of `grid` to decide which cells get a background.
   *  Pass the original puzzle string when drawing a solution grid. */
  clueMask?: string,
): void {
  const cell = size / 9;

  const boxColor = gridStyle === "minimal" ? rgb(0.55, 0.55, 0.55) : BLACK;
  const cellColor = gridStyle === "minimal" ? rgb(0.78, 0.78, 0.78) : BLACK;
  const boxThick = gridStyle === "minimal" ? 1.5 : THICK;

  // clue cell backgrounds (drawn first so grid lines appear on top)
  if (clueBackground) {
    const bgColor = rgb(0.88, 0.88, 0.88);
    const mask = clueMask ?? grid;
    for (let i = 0; i < 81; i++) {
      const ch = mask[i]!;
      if (ch === "0" || ch === ".") continue;
      const col = i % 9;
      const row = (i / 9) | 0;
      page.drawRectangle({
        x: startX + col * cell,
        y: startY + (8 - row) * cell,
        width: cell,
        height: cell,
        color: bgColor,
      });
    }
  }

  // horizontal lines
  for (let r = 0; r <= 9; r++) {
    const y = startY + r * cell;
    const isBox = r % 3 === 0;
    page.drawLine({
      start: { x: startX, y },
      end: { x: startX + size, y },
      thickness: isBox ? boxThick : THIN,
      color: isBox ? boxColor : cellColor,
    });
  }

  // vertical lines
  for (let c = 0; c <= 9; c++) {
    const x = startX + c * cell;
    const isBox = c % 3 === 0;
    page.drawLine({
      start: { x, y: startY },
      end: { x, y: startY + size },
      thickness: isBox ? boxThick : THIN,
      color: isBox ? boxColor : cellColor,
    });
  }

  // clue digits
  for (let i = 0; i < 81; i++) {
    const ch = grid[i]!;
    if (ch === "0" || ch === ".") continue;

    const col = i % 9;
    const row = (i / 9) | 0; // 0 = top row

    // In pdf-lib, y=0 is the bottom of the page, so row 0 maps to the top
    // of the grid (highest y). We subtract (row+1)*cell and add half a cell
    // for vertical centering.
    const charWidth = font.widthOfTextAtSize(ch, fontSize);
    const charHeight = font.heightAtSize(fontSize) * 0.6; // optical centre

    const x = startX + col * cell + (cell - charWidth) / 2;
    const y = startY + (8 - row) * cell + (cell - charHeight) / 2;

    page.drawText(ch, { x, y, size: fontSize, font, color: BLACK });
  }
}
