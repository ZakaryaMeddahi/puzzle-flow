import { Worker, type Job } from "bullmq";
import { writeFile, mkdir, readFile } from "fs/promises";
import { join } from "path";
import { generateBook } from "@kdp/pdf-templates";
import type { BookOptions, PuzzleEntry, PuzzlesPerPage } from "@kdp/pdf-templates";
import { generatePuzzle, seedToMetadata } from "@kdp/puzzle-core";
import { toUnsignedBigInt } from "./puzzle-generation.worker";
import { prisma, BookStatus, getPageDefinition } from "@kdp/shared";
import type { FrontMatterConfig, PageType } from "@kdp/shared";
import { getRedisOptions } from "../redis";
import { QUEUE_PDF_GENERATION, type PdfGenerationJobData } from "../queues";

const PDF_OUTPUT_DIR = process.env["PDF_OUTPUT_DIR"] ?? join(process.cwd(), "pdfs");
const UPLOAD_DIR     = process.env["UPLOAD_DIR"]     ?? join(process.cwd(), "uploads");
const PDF_EXPIRY_DAYS = 7;

// Page types that may contain image elements
const FRONT_MATTER_PAGE_TYPES: PageType[] = [
  "titlePage",
  "copyrightPage",
  "howToPlay",
  "introduction",
];

/**
 * Read any image files referenced in frontMatter values from local disk.
 * Keys are relative paths under UPLOAD_DIR (e.g. "userId/uuid.png").
 */
async function loadFrontMatterImages(
  fm: FrontMatterConfig,
): Promise<Record<string, Record<string, Uint8Array>>> {
  const imageBytes: Record<string, Record<string, Uint8Array>> = {};

  for (const pageType of FRONT_MATTER_PAGE_TYPES) {
    const pageConfig = fm[pageType];
    if (!pageConfig?.enabled) continue;

    const def = getPageDefinition(pageType);
    const imageElements = def.elements.filter((el) => el.type === "image");

    for (const el of imageElements) {
      const key = pageConfig.values?.[el.id];
      if (!key) continue;
      try {
        const buf = await readFile(join(UPLOAD_DIR, key));
        imageBytes[pageType] ??= {};
        imageBytes[pageType]![el.id] = new Uint8Array(buf);
      } catch {
        console.warn(`[pdf-generation] Image not found on disk: ${key}`);
      }
    }
  }

  return imageBytes;
}

// ── Processor ─────────────────────────────────────────────────────────────────

async function processPdfGenerationJob(
  job: Job<PdfGenerationJobData>,
): Promise<void> {
  const { bookId } = job.data;

  console.log(`[pdf-generation] Starting: bookId=${bookId}`);

  // 1. Load the book
  const book = await prisma.book.findUniqueOrThrow({ where: { id: bookId } });

  // 2. Load confirmed puzzle seeds — order by difficulty category then id so
  //    progressive books appear easy → medium → hard → expert.
  const rows = await prisma.$queryRawUnsafe<Array<{ seed: string | bigint }>>(
    `
    SELECT seed
    FROM puzzle_registry
    WHERE book_id = $1
      AND status  = 'confirmed'
    ORDER BY
      CASE difficulty
        WHEN 'easy'   THEN 1
        WHEN 'medium' THEN 2
        WHEN 'hard'   THEN 3
        WHEN 'expert' THEN 4
        ELSE 5
      END ASC,
      id ASC
    `,
    bookId,
  );

  if (rows.length === 0) {
    throw new Error(`No confirmed puzzles found for book ${bookId}`);
  }

  // 3. Reconstruct puzzles from seeds (deterministic — no extra DB storage needed)
  await job.updateProgress(5);

  const puzzleEntries: PuzzleEntry[] = rows.map((row, idx) => {
    const seed = toUnsignedBigInt(BigInt(String(row.seed)));
    const { difficulty } = seedToMetadata(seed);
    const { puzzle, solution } = generatePuzzle(seed, difficulty);
    return { number: idx + 1, puzzle, solution };
  });

  // 4. Build BookOptions
  const validLayouts: PuzzlesPerPage[] = [1, 2, 4];
  const puzzlesPerPage: PuzzlesPerPage = validLayouts.includes(book.layout as PuzzlesPerPage)
    ? (book.layout as PuzzlesPerPage)
    : 1;

  const options: BookOptions = {
    title:        book.title ?? "Sudoku Puzzle Book",
    difficulty:   book.difficulty,
    trimSize:     book.trimSize as BookOptions["trimSize"],
    puzzles:      puzzleEntries,
    puzzlesPerPage,
  };

  // 5. Load any uploaded images from disk
  const fm = book.frontMatter as FrontMatterConfig | null;
  await job.updateProgress(20);
  const imageBytes = fm ? await loadFrontMatterImages(fm) : {};

  // 6. Generate PDF bytes
  await job.updateProgress(60);
  const pdfBytes = await generateBook(options, fm, imageBytes);
  await job.updateProgress(85);

  // 7. Write PDF to disk
  await mkdir(PDF_OUTPUT_DIR, { recursive: true });
  const filePath = join(PDF_OUTPUT_DIR, `${bookId}.pdf`);
  await writeFile(filePath, pdfBytes);

  // 8. Mark book as ready with expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + PDF_EXPIRY_DAYS);

  await prisma.book.update({
    where: { id: bookId },
    data: { status: BookStatus.READY, pdfPath: filePath, expiresAt },
  });

  await job.updateProgress(100);
  console.log(`[pdf-generation] Done: bookId=${bookId} puzzles=${rows.length}`);
}

// ── Export factory ────────────────────────────────────────────────────────────

export function startPdfGenerationWorker(): Worker<PdfGenerationJobData> {
  const worker = new Worker<PdfGenerationJobData>(
    QUEUE_PDF_GENERATION,
    processPdfGenerationJob,
    { connection: getRedisOptions(), concurrency: 2 },
  );

  worker.on("completed", (job) => {
    console.log(`[pdf-generation] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[pdf-generation] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
