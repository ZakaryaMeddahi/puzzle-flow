import { Queue } from "bullmq";
import type { Difficulty } from "@kdp/puzzle-core";
import { getRedisOptions } from "./redis";

// ── Queue names ───────────────────────────────────────────────────────────────

export const QUEUE_PUZZLE_GENERATION = "puzzle-generation";
export const QUEUE_PDF_GENERATION = "pdf-generation";
export const QUEUE_CLEANUP = "cleanup";

// ── Job data shapes ───────────────────────────────────────────────────────────

export interface PuzzleGenerationJobData {
  difficulty: Difficulty;
  batchSize: number;
}

export interface PdfGenerationJobData {
  bookId: string;
}

export interface CleanupJobData {
  ttlMinutes: number;
}

// ── Queue singletons ──────────────────────────────────────────────────────────

export const puzzleGenerationQueue = new Queue<PuzzleGenerationJobData>(
  QUEUE_PUZZLE_GENERATION,
  { connection: getRedisOptions() },
);

export const pdfGenerationQueue = new Queue<PdfGenerationJobData>(
  QUEUE_PDF_GENERATION,
  { connection: getRedisOptions() },
);

export const cleanupQueue = new Queue<CleanupJobData>(QUEUE_CLEANUP, {
  connection: getRedisOptions(),
});
