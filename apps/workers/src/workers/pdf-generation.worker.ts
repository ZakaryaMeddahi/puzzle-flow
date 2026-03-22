import { Worker, type Job } from "bullmq";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { generateBook } from "@kdp/pdf-templates";
import type { BookOptions, PuzzleEntry } from "@kdp/pdf-templates";
import { generatePuzzle, seedToMetadata } from "@kdp/puzzle-core";
import { toUnsignedBigInt } from "./puzzle-generation.worker";
import { prisma, BookStatus } from "@kdp/shared";
import { getRedisOptions } from "../redis";
import { QUEUE_PDF_GENERATION, type PdfGenerationJobData } from "../queues";

const PDF_OUTPUT_DIR = process.env["PDF_OUTPUT_DIR"] ?? join(process.cwd(), "pdfs");
const PDF_EXPIRY_DAYS = 7;

// ── Processor ─────────────────────────────────────────────────────────────────

async function processPdfGenerationJob(
  job: Job<PdfGenerationJobData>,
): Promise<void> {
  const { bookId } = job.data;

  console.log(`[pdf-generation] Starting: bookId=${bookId}`);

  // 1. Load the book
  const book = await prisma.book.findUniqueOrThrow({ where: { id: bookId } });

  // 2. Load confirmed puzzle seeds for this book, ordered by seed (= generation order)
  const rows = await prisma.$queryRawUnsafe<
    Array<{ seed: string | bigint }>
  >(
    `
    SELECT seed
    FROM puzzle_registry
    WHERE book_id = $1
      AND status  = 'confirmed'
    ORDER BY seed ASC
    `,
    bookId,
  );

  if (rows.length === 0) {
    throw new Error(`No confirmed puzzles found for book ${bookId}`);
  }

  // 3. Reconstruct puzzles from seeds (deterministic — no extra DB storage needed)
  await job.updateProgress(5);

  const puzzleEntries: PuzzleEntry[] = rows.map((row, idx) => {
    // Seeds for hard/expert are stored as signed negatives — convert back to unsigned
    const seed = toUnsignedBigInt(BigInt(String(row.seed)));
    const { difficulty } = seedToMetadata(seed);
    const { puzzle, solution } = generatePuzzle(seed, difficulty);
    return { number: idx + 1, puzzle, solution };
  });

  // 4. Build BookOptions
  const options: BookOptions = {
    title: book.title ?? "Sudoku Puzzle Book",
    difficulty: book.difficulty as BookOptions["difficulty"],
    trimSize: book.trimSize as BookOptions["trimSize"],
    puzzles: puzzleEntries,
  };

  // 5. Generate PDF bytes
  await job.updateProgress(60);
  const pdfBytes = await generateBook(options);
  await job.updateProgress(85);

  // 6. Write to disk
  await mkdir(PDF_OUTPUT_DIR, { recursive: true });
  const filePath = join(PDF_OUTPUT_DIR, `${bookId}.pdf`);
  await writeFile(filePath, pdfBytes);

  // 7. Mark book as ready with expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + PDF_EXPIRY_DAYS);

  await prisma.book.update({
    where: { id: bookId },
    data: {
      status: BookStatus.READY,
      pdfPath: filePath,
      expiresAt,
    },
  });

  await job.updateProgress(100);
  console.log(`[pdf-generation] Done: bookId=${bookId} pages=${rows.length + 2}`);
}

// ── Export factory ────────────────────────────────────────────────────────────

export function startPdfGenerationWorker(): Worker<PdfGenerationJobData> {
  const worker = new Worker<PdfGenerationJobData>(
    QUEUE_PDF_GENERATION,
    processPdfGenerationJob,
    {
      connection: getRedisOptions(),
      concurrency: 2,
    },
  );

  worker.on("completed", (job) => {
    console.log(`[pdf-generation] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[pdf-generation] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
