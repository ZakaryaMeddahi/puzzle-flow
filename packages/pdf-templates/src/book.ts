import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFileSync } from "fs";
import { join } from "path";
import type { FrontMatterConfig, PageType, Alignment } from "@kdp/shared";
import { getPageDefinition, resolveValues } from "@kdp/shared";
import type { BookOptions, BookFont } from "./types";
import { PAGE_SIZE, pageSide } from "./layout";
import { buildPagePlan } from "./page-plan";
import { renderPageFromSchema } from "./schema-renderer";
import { drawBlankPage } from "./pages/blank-page";
import { drawPuzzlePage } from "./pages/puzzle-page";
import { addAnswerPages } from "./pages/answer-page";

/** Map a BookFont name to its TTF file pair. */
function getFontFiles(font: BookFont): {
  boldFile: string;
  regularFile: string;
} {
  switch (font) {
    case "merriweather":
      return {
        boldFile: "Merriweather_24pt-Bold.ttf",
        regularFile: "Merriweather_24pt-Regular.ttf",
      };
    case "lato":
      return {
        boldFile: "Lato-Bold.ttf",
        regularFile: "Lato-Regular.ttf",
      };
    default:
      return {
        boldFile: "Roboto-Bold.ttf",
        regularFile: "Roboto-Regular.ttf",
      };
  }
}

/**
 * Generate a complete KDP-ready Sudoku puzzle book as a PDF.
 *
 * @param options     Book configuration (title, difficulty, trim size, puzzles, layout, style)
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

  // Embed TTF fonts - KDP requires fully embedded fonts.
  const { boldFile, regularFile } = getFontFiles(options.font ?? "roboto");
  const boldBytes = readFileSync(join(__dirname, "../fonts", boldFile));
  const regularBytes = readFileSync(join(__dirname, "../fonts", regularFile));
  const titleFont = await doc.embedFont(boldBytes);
  const bodyFont = await doc.embedFont(regularBytes);

  // Pre-embed all images referenced in front matter.
  const embeddedImages: Record<
    string,
    Record<string, import("pdf-lib").PDFImage>
  > = {};
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

  // Map slot kind -> pageType for front matter slots
  const SLOT_TO_PAGE_TYPE: Partial<Record<string, PageType>> = {
    title: "titlePage",
    copyright: "copyrightPage",
    "how-to-play": "howToPlay",
    introduction: "introduction",
  };

  // Resolved style options with defaults
  const labelFormat = options.labelFormat ?? "puzzle-n";
  const gridStyle = options.gridStyle ?? "standard";
  const difficultyBadge = options.difficultyBadge ?? false;
  const clueBackground = options.clueBackground ?? false;
  const watermark = options.watermark ?? false;
  const showPageNumbers = options.pageNumbers !== false; // default true

  // Track display page number - starts at 1 for the first puzzle page.
  // Front matter and blank pages are not numbered.
  let puzzleDisplayPage = 0;

  for (const slot of plan.slots) {
    if (slot.kind === "answer") continue;

    const side = pageSide(slot.pageIndex);
    const page = doc.addPage([width, height]);

    const pageType = SLOT_TO_PAGE_TYPE[slot.kind];

    if (pageType) {
      // Front matter page - rendered via schema
      const def = getPageDefinition(pageType);
      const stored = (
        frontMatter as unknown as Record<
          string,
          {
            values?: Record<string, string>;
            styles?: Record<string, { alignment: Alignment }>;
          }
        >
      )?.[pageType];
      const values = resolveValues(def, stored?.values ?? {});
      const styleOverrides = stored?.styles ?? {};

      // Pre-fill title from options if user didn't override
      if (pageType === "titlePage" && !values["title"]) {
        values["title"] = options.title;
      }

      renderPageFromSchema(
        page,
        def,
        values,
        titleFont,
        bodyFont,
        trimSize,
        side,
        embeddedImages[pageType] ?? {},
        styleOverrides,
      );
    } else if (slot.kind === "blank") {
      drawBlankPage(page);
    } else if (slot.kind === "puzzle") {
      puzzleDisplayPage++;
      drawPuzzlePage(
        page,
        titleFont,
        bodyFont,
        slot.puzzles!,
        trimSize,
        side,
        puzzlesPerPage,
        {
          labelFormat,
          gridStyle,
          difficultyBadge,
          clueBackground,
          watermark,
          pageNumber: showPageNumbers ? puzzleDisplayPage : undefined,
          pageTitle: options.title || undefined,
        },
      );
    }
  }

  const fm =
    frontMatter ?? ({ answerPages: true } as unknown as FrontMatterConfig);
  if (fm.answerPages !== false && puzzles.length > 0) {
    addAnswerPages(
      doc,
      titleFont,
      bodyFont,
      puzzles,
      trimSize,
      answerFirstPageIndex,
      {
        pageNumbers: showPageNumbers,
        firstPageNumber: puzzleDisplayPage + 1,
        gridStyle,
        clueBackground,
      },
    );
  }

  return doc.save();
}
