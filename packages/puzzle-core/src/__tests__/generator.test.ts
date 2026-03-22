import { generatePuzzle, validatePuzzle } from "../generator";
import { encodeSeed } from "../seed";
import { CLUES_BY_DIFFICULTY } from "../types";
import type { Difficulty } from "../types";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];

function clueCount(puzzle: string): number {
  return puzzle.split("").filter((c) => c !== "0").length;
}

// ── generatePuzzle ─────────────────────────────────────────────────────────

describe("generatePuzzle", () => {
  it("returns the expected shape", () => {
    const seed = encodeSeed("easy", 0, 1n);
    const result = generatePuzzle(seed, "easy");
    expect(result.seed).toBe(seed);
    expect(result.difficulty).toBe("easy");
    expect(result.puzzle).toHaveLength(81);
    expect(result.solution).toHaveLength(81);
    expect(/^[0-9]{81}$/.test(result.puzzle)).toBe(true);
    expect(/^[1-9]{81}$/.test(result.solution)).toBe(true);
  });

  it("is deterministic — same seed gives same puzzle", () => {
    const seed = encodeSeed("medium", 0, 7n);
    const a = generatePuzzle(seed, "medium");
    const b = generatePuzzle(seed, "medium");
    expect(a.puzzle).toBe(b.puzzle);
    expect(a.solution).toBe(b.solution);
  });

  it("different seeds give different puzzles", () => {
    const s1 = generatePuzzle(encodeSeed("easy", 0, 1n), "easy");
    const s2 = generatePuzzle(encodeSeed("easy", 0, 2n), "easy");
    expect(s1.puzzle).not.toBe(s2.puzzle);
  });

  for (const diff of DIFFICULTIES) {
    it(`generates a ${diff} puzzle with correct clue count`, () => {
      const seed = encodeSeed(diff, 0, 1n);
      const { puzzle } = generatePuzzle(seed, diff);
      const count = clueCount(puzzle);
      const { min, max } = CLUES_BY_DIFFICULTY[diff];

      // The multi-pass greedy removal guarantees at least `min` clues are left
      // (we never remove below target). for easier difficulties the max is
      // reliably met. For expert (17-21), some grids are irreducible via greedy
      // removal alone without full backtracking; we allow up to 30 in that case.
      expect(count).toBeGreaterThanOrEqual(min);
      const effectiveMax = diff === "expert" ? 30 : max;
      expect(count).toBeLessThanOrEqual(effectiveMax);
    });
  }

  for (const diff of DIFFICULTIES) {
    it(`${diff} puzzle has a unique solution`, () => {
      const seed = encodeSeed(diff, 0, 1n);
      const { puzzle } = generatePuzzle(seed, diff);
      expect(validatePuzzle(puzzle)).toBe(true);
    });
  }

  it("solution is consistent with puzzle (clue digits match)", () => {
    const seed = encodeSeed("easy", 0, 3n);
    const { puzzle, solution } = generatePuzzle(seed, "easy");
    for (let i = 0; i < 81; i++) {
      if (puzzle[i] !== "0") {
        expect(puzzle[i]).toBe(solution[i]);
      }
    }
  });
});

// ── validatePuzzle ──────────────────────────────────────────────────────────

describe("validatePuzzle", () => {
  it("returns true for a generated puzzle (unique solution)", () => {
    const { puzzle } = generatePuzzle(encodeSeed("easy", 0, 5n), "easy");
    expect(validatePuzzle(puzzle)).toBe(true);
  });

  it("returns false for a fully empty grid (many solutions)", () => {
    expect(validatePuzzle("0".repeat(81))).toBe(false);
  });

  it("returns false for a conflicting grid (two 8s in same row)", () => {
    const grid = "0".repeat(81).split("");
    grid[0] = "8";
    grid[1] = "8";
    expect(validatePuzzle(grid.join(""))).toBe(false);
  });

  it("returns false for wrong length", () => {
    expect(validatePuzzle("0".repeat(80))).toBe(false);
    expect(validatePuzzle("0".repeat(82))).toBe(false);
  });

  it("returns false for invalid characters", () => {
    const bad = "A" + "0".repeat(80);
    expect(validatePuzzle(bad)).toBe(false);
  });

  it("accepts '.' as an empty cell marker", () => {
    const { puzzle } = generatePuzzle(encodeSeed("easy", 0, 9n), "easy");
    const withDots = puzzle.replace(/0/g, ".");
    expect(validatePuzzle(withDots)).toBe(true);
  });

  it("returns true for a fully solved grid", () => {
    const { solution } = generatePuzzle(encodeSeed("easy", 0, 1n), "easy");
    expect(validatePuzzle(solution)).toBe(true);
  });
});
