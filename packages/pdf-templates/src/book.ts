import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFileSync } from "fs";
import { join } from "path";
import type { BookOptions } from "./types";
import { PAGE_SIZE, pageSide } from "./layout";
import { drawTitlePage } from "./pages/title-page";
import { drawPuzzlePage } from "./pages/puzzle-page";
import { addAnswerPages } from "./pages/answer-page";

/**
 * Generate a complete KDP-ready Sudoku puzzle book as a PDF.
 *
 * @param options  Book configuration (title, difficulty, trim size, puzzles)
 * @returns        Raw PDF bytes (Uint8Array) ready to write to disk or S3
 */
export async function generateBook(options: BookOptions): Promise<Uint8Array> {
  const { trimSize, puzzles } = options;
  const { width, height } = PAGE_SIZE[trimSize];

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  // Embed fonts — KDP requires fully embedded fonts (StandardFonts are not embedded)
  const boldBytes    = readFileSync(join(__dirname, "../fonts/Roboto-Bold.ttf"));
  const regularBytes = readFileSync(join(__dirname, "../fonts/Roboto-Regular.ttf"));
  const titleFont = await doc.embedFont(boldBytes);
  const bodyFont  = await doc.embedFont(regularBytes);

  // Track the 0-based page index across the whole document for gutter margins.
  // Page 0 = title (recto), page 1 = first puzzle (verso), etc.
  let pageIndex = 0;

  // ── Title page ─────────────────────────────────────────────────────────────
  const titlePage = doc.addPage([width, height]);
  drawTitlePage(titlePage, titleFont, bodyFont, options, pageSide(pageIndex++));

  // ── Puzzle pages (one per puzzle) ──────────────────────────────────────────
  for (const entry of puzzles) {
    const page = doc.addPage([width, height]);
    drawPuzzlePage(page, titleFont, bodyFont, entry, trimSize, pageSide(pageIndex++));
  }

  // ── Answer key (multiple mini grids per page) ──────────────────────────────
  addAnswerPages(doc, titleFont, bodyFont, puzzles, trimSize, pageIndex);

  return doc.save();
}
