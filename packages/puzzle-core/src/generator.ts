import { createPrng, shuffle } from "./prng";
import { solveFill, countSolutions } from "./solver";
import type { Difficulty, PuzzleResult } from "./types";
import { CLUES_BY_DIFFICULTY } from "./types";

/**
 * deterministically generate a Sudoku puzzle from a seed.
 * same seed always produces the same puzzle.
 */
export function generatePuzzle(
  seed: bigint,
  difficulty: Difficulty,
): PuzzleResult {
  const next = createPrng(seed);

  // 1. create a complete valid solution
  const solution = new Array<number>(81).fill(0);
  solveFill(solution, next); // always succeeds for an empty grid

  // 2. remove cells to reach the target clue count
  const { min, max } = CLUES_BY_DIFFICULTY[difficulty];
  const targetClues = min + Math.floor(next() * (max - min + 1));

  const puzzle = [...solution];
  let cluesLeft = 81;

  // multi-pass greedy removal: each pass shuffles the remaining clue positions
  // and tries to remove them. Stops when we hit the target or no further
  // removals are possible (all remaining clues are essential).
  while (cluesLeft > targetClues) {
    const filledPositions = shuffle(
      puzzle.reduce<number[]>((acc, v, i) => {
        if (v !== 0) acc.push(i);
        return acc;
      }, []),
      next,
    );

    let removedThisPass = 0;
    for (const pos of filledPositions) {
      if (cluesLeft <= targetClues) break;

      const saved = puzzle[pos]!;
      puzzle[pos] = 0;

      if (countSolutions([...puzzle]) === 1) {
        cluesLeft--;
        removedThisPass++;
      } else {
        puzzle[pos] = saved; // removal creates ambiguity - keep the clue
      }
    }

    if (removedThisPass === 0) break; // stuck - no more removals possible
  }

  return {
    seed,
    difficulty,
    puzzle: puzzle.join(""),
    solution: solution.join(""),
  };
}

/**
 * Confirm a puzzle string has exactly one solution.
 * Accepts '0' or '.' for empty cells; rejects anything else.
 */
export function validatePuzzle(puzzle: string): boolean {
  if (puzzle.length !== 81) return false;
  if (!/^[0-9.]{81}$/.test(puzzle)) return false;
  const grid = Array.from(puzzle, (c) => (c === "." ? 0 : Number(c)));
  return countSolutions(grid) === 1;
}
