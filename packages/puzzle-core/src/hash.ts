import { createHash } from "crypto";

/**
 * returns a canonical 81-char representation of a puzzle.
 * anything that is not a digit 1-9 becomes '0' (empty cell).
 */
export function normalizePuzzle(puzzle: string): string {
  if (puzzle.length !== 81) {
    throw new Error(`Invalid puzzle length: expected 81, got ${puzzle.length}`);
  }
  return puzzle.replace(/[^1-9]/g, "0");
}

/** SHA-256 hex digest (64 chars) of the normalized puzzle string. */
export function hashPuzzle(normalized: string): string {
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}
