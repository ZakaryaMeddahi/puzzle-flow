import type { PDFPage, PDFFont } from "pdf-lib";
import { rgb } from "pdf-lib";
import type { BookOptions } from "../types";
import { usableArea, type PageSide } from "../layout";

const BLACK = rgb(0, 0, 0);
const GREY  = rgb(0.45, 0.45, 0.45);

const DIFFICULTY_LABEL: Record<string, string> = {
  easy:        "Easy",
  medium:      "Medium",
  hard:        "Hard",
  expert:      "Expert",
  progressive: "Progressive",
};

/**
 * Render the title page.
 * Lays out: book title (large), difficulty label (medium), puzzle count (small).
 */
export function drawTitlePage(
  page: PDFPage,
  titleFont: PDFFont,
  bodyFont: PDFFont,
  options: BookOptions,
  side: PageSide,
): void {
  const { trimSize, title, difficulty, puzzles } = options;
  const area = usableArea(trimSize, side);
  const midX = area.x + area.width / 2;
  const midY = area.y + area.height / 2;

  // ── Title ──────────────────────────────────────────────────────────────────
  const titleSize = 36;
  const titleWidth = titleFont.widthOfTextAtSize(title, titleSize);
  page.drawText(title, {
    x: midX - titleWidth / 2,
    y: midY + 48,
    size: titleSize,
    font: titleFont,
    color: BLACK,
  });

  // ── Difficulty ─────────────────────────────────────────────────────────────
  const diffLabel = `${DIFFICULTY_LABEL[difficulty] ?? difficulty} Puzzles`;
  const diffSize = 20;
  const diffWidth = titleFont.widthOfTextAtSize(diffLabel, diffSize);
  page.drawText(diffLabel, {
    x: midX - diffWidth / 2,
    y: midY + 8,
    size: diffSize,
    font: titleFont,
    color: GREY,
  });

  // ── Puzzle count ───────────────────────────────────────────────────────────
  const countLabel = `${puzzles.length} puzzles`;
  const countSize = 14;
  const countWidth = bodyFont.widthOfTextAtSize(countLabel, countSize);
  page.drawText(countLabel, {
    x: midX - countWidth / 2,
    y: midY - 24,
    size: countSize,
    font: bodyFont,
    color: GREY,
  });
}
