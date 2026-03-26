import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFileSync } from "fs";
import { join } from "path";
import type { FrontMatterConfig } from "@kdp/shared";
import type { BookOptions } from "./types";
import { PAGE_SIZE, pageSide } from "./layout";
import { buildPagePlan } from "./page-plan";
import { drawTitlePage }    from "./pages/title-page";
import { drawCopyrightPage } from "./pages/copyright-page";
import { drawHowToPlayPage } from "./pages/how-to-play-page";
import { drawIntroPage }    from "./pages/intro-page";
import { drawBlankPage }    from "./pages/blank-page";
import { drawPuzzlePage }   from "./pages/puzzle-page";
import { addAnswerPages }   from "./pages/answer-page";

/**
 * Generate a complete KDP-ready Sudoku puzzle book as a PDF.
 *
 * @param options     Book configuration (title, difficulty, trim size, puzzles, layout)
 * @param frontMatter Optional front matter config; defaults to all pages enabled.
 * @returns           Raw PDF bytes ready to write to disk or upload.
 */
export async function generateBook(
  options: BookOptions,
  frontMatter?: FrontMatterConfig | null,
): Promise<Uint8Array> {
  const { trimSize, puzzles, puzzlesPerPage } = options;
  const { width, height } = PAGE_SIZE[trimSize];

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  // Embed TTF fonts — KDP requires fully embedded fonts.
  const boldBytes    = readFileSync(join(__dirname, "../fonts/Roboto-Bold.ttf"));
  const regularBytes = readFileSync(join(__dirname, "../fonts/Roboto-Regular.ttf"));
  const titleFont = await doc.embedFont(boldBytes);
  const bodyFont  = await doc.embedFont(regularBytes);

  // Pre-compute the full page sequence before rendering.
  const plan = buildPagePlan(puzzles, puzzlesPerPage, frontMatter);

  // Find the pageIndex of the first answer slot (for addAnswerPages).
  const firstAnswerSlot = plan.slots.find((s) => s.kind === "answer");
  const answerFirstPageIndex = firstAnswerSlot?.pageIndex ?? plan.slots.length;

  for (const slot of plan.slots) {
    if (slot.kind === "answer") continue; // handled below via addAnswerPages

    const side = pageSide(slot.pageIndex);
    const page = doc.addPage([width, height]);

    switch (slot.kind) {
      case "title":
        drawTitlePage(page, titleFont, bodyFont, options, side);
        break;
      case "copyright":
        drawCopyrightPage(page, titleFont, bodyFont, trimSize, side);
        break;
      case "how-to-play":
        drawHowToPlayPage(page, titleFont, bodyFont, trimSize, side);
        break;
      case "introduction":
        drawIntroPage(page, titleFont, bodyFont, trimSize, side, frontMatter?.introText ?? "");
        break;
      case "blank":
        drawBlankPage(page);
        break;
      case "puzzle":
        drawPuzzlePage(
          page,
          titleFont,
          bodyFont,
          slot.puzzles!,
          trimSize,
          side,
          puzzlesPerPage,
        );
        break;
    }
  }

  // Answer pages (addAnswerPages handles its own addPage loop internally).
  const fm = frontMatter ?? { answerPages: true } as FrontMatterConfig;
  if (fm.answerPages !== false && puzzles.length > 0) {
    addAnswerPages(doc, titleFont, bodyFont, puzzles, trimSize, answerFirstPageIndex);
  }

  return doc.save();
}
