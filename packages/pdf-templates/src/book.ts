import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFileSync } from "fs";
import { join } from "path";
import type { FrontMatterConfig, PageType } from "@kdp/shared";
import {
  getPageDefinition,
  resolveValues,
} from "@kdp/shared";
import type { BookOptions } from "./types";
import { PAGE_SIZE, pageSide } from "./layout";
import { buildPagePlan } from "./page-plan";
import { renderPageFromSchema } from "./schema-renderer";
import { drawBlankPage }  from "./pages/blank-page";
import { drawPuzzlePage } from "./pages/puzzle-page";
import { addAnswerPages } from "./pages/answer-page";

/**
 * Generate a complete KDP-ready Sudoku puzzle book as a PDF.
 *
 * @param options     Book configuration (title, difficulty, trim size, puzzles, layout)
 * @param frontMatter Optional front matter config; defaults to all pages enabled.
 * @param imageBytes  Pre-downloaded image bytes keyed by pageType → elementId → Uint8Array.
 *                    The worker downloads S3 images before calling this function.
 * @returns           Raw PDF bytes ready to write to disk or upload.
 */
export async function generateBook(
  options: BookOptions,
  frontMatter?: FrontMatterConfig | null,
  imageBytes: Record<string, Record<string, Uint8Array>> = {},
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

  // Pre-embed all images referenced in front matter.
  // imageBytes: { titlePage: { logo: Uint8Array }, ... }
  const embeddedImages: Record<string, Record<string, import("pdf-lib").PDFImage>> = {};
  for (const [pt, pageImages] of Object.entries(imageBytes)) {
    embeddedImages[pt] = {};
    for (const [elId, bytes] of Object.entries(pageImages)) {
      try {
        embeddedImages[pt]![elId] = await doc.embedPng(bytes);
      } catch {
        embeddedImages[pt]![elId] = await doc.embedJpg(bytes);
      }
    }
  }

  const plan = buildPagePlan(puzzles, puzzlesPerPage, frontMatter);
  const firstAnswerSlot = plan.slots.find((s) => s.kind === "answer");
  const answerFirstPageIndex = firstAnswerSlot?.pageIndex ?? plan.slots.length;

  // Map slot kind → pageType for front matter slots
  const SLOT_TO_PAGE_TYPE: Partial<Record<string, PageType>> = {
    title:        "titlePage",
    copyright:    "copyrightPage",
    "how-to-play": "howToPlay",
    introduction: "introduction",
  };

  for (const slot of plan.slots) {
    if (slot.kind === "answer") continue;

    const side = pageSide(slot.pageIndex);
    const page = doc.addPage([width, height]);

    const pageType = SLOT_TO_PAGE_TYPE[slot.kind];

    if (pageType) {
      // Front matter page — rendered via schema
      const def    = getPageDefinition(pageType);
      const stored = (frontMatter as unknown as Record<string, { values?: Record<string, string> }>)?.[pageType];
      const values = resolveValues(def, stored?.values ?? {});

      // Pre-fill title from options if user didn't override
      if (pageType === "titlePage" && !values["title"]) {
        values["title"] = options.title;
      }

      renderPageFromSchema(
        page, def, values,
        titleFont, bodyFont, trimSize, side,
        embeddedImages[pageType] ?? {},
      );
    } else if (slot.kind === "blank") {
      drawBlankPage(page);
    } else if (slot.kind === "puzzle") {
      drawPuzzlePage(
        page, titleFont, bodyFont,
        slot.puzzles!, trimSize, side, puzzlesPerPage,
      );
    }
  }

  const fm = frontMatter ?? { answerPages: true } as unknown as FrontMatterConfig;
  if (fm.answerPages !== false && puzzles.length > 0) {
    addAnswerPages(doc, titleFont, bodyFont, puzzles, trimSize, answerFirstPageIndex);
  }

  return doc.save();
}
