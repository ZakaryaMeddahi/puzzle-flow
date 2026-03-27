import { Difficulty, TrimSize, UniquenessLevel } from "./enums";

// ── Book DTOs ────────────────────────────────────────────────────────────────

export interface CreateBookDto {
  title?: string;
  trimSize: TrimSize;
  difficulty: Difficulty;
  pageCount: number;
  uniquenessLevel: UniquenessLevel;
}

export interface BookResponse {
  id: string;
  userId: string;
  title: string | null;
  trimSize: string;
  difficulty: string;
  pageCount: number;
  status: string;
  pdfPath: string | null;
  expiresAt: Date | null;
  createdAt: Date;
}

// ── Puzzle DTOs ──────────────────────────────────────────────────────────────

export interface ReservePuzzlesDto {
  difficulty: Difficulty;
  count: number;
  uniquenessLevel: UniquenessLevel;
  userId: string;
  bookId?: string;
}

export interface PuzzleReservation {
  id: string;
  seed: bigint;
  hash: string;
  difficulty: string;
}

// ── Worker Job Payloads ──────────────────────────────────────────────────────

export interface PuzzleGenerationJob {
  difficulty: Difficulty;
  batchSize: number;
}

export interface PdfGenerationJob {
  bookId: string;
  userId: string;
}

// ── Seed Metadata ────────────────────────────────────────────────────────────

export interface SeedMetadata {
  difficulty: Difficulty;
  shard: number;
  sequence: bigint;
}
