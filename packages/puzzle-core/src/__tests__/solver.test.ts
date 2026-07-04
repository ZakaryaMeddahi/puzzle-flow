import { countSolutions, solveFill } from "../solver";
import { createPrng } from "../prng";

// A known-valid complete solution (band-shifting pattern - every row, col, box has 1-9)
const SOLUTION = "123456789456789123789123456234567891567891234891234567345678912678912345912345678";
const FULL_GRID = SOLUTION.split("").map(Number);

// One empty cell - exactly one solution
const UNIQUE_PUZZLE = ("0" + SOLUTION.slice(1)).split("").map(Number);

// All zeros - many solutions
const AMBIGUOUS_PUZZLE = new Array<number>(81).fill(0);

// Two 8s in the same row - impossible grid
function makeConflicting(): number[] {
  const grid = new Array<number>(81).fill(0);
  grid[0] = 8;
  grid[1] = 8;
  return grid;
}

describe("countSolutions", () => {
  it("returns 1 for a puzzle with exactly one empty cell", () => {
    expect(countSolutions([...UNIQUE_PUZZLE])).toBe(1);
  });

  it("returns 1 for a fully solved grid", () => {
    expect(countSolutions([...FULL_GRID])).toBe(1);
  });

  it("returns 0 for a conflicting (invalid) grid", () => {
    expect(countSolutions(makeConflicting())).toBe(0);
  });

  it("returns 2+ for an all-empty grid (many solutions)", () => {
    expect(countSolutions([...AMBIGUOUS_PUZZLE])).toBeGreaterThanOrEqual(2);
  });

  it("does not modify the input grid", () => {
    const grid = [...UNIQUE_PUZZLE];
    const before = [...grid];
    countSolutions(grid);
    expect(grid).toEqual(before);
  });

  it("respects the max parameter and stops early", () => {
    // All-empty grid has many solutions - should cap at max=1
    expect(countSolutions([...AMBIGUOUS_PUZZLE], 1)).toBe(1);
  });
});

describe("solveFill", () => {
  it("fills an empty grid with a valid complete solution", () => {
    const grid = new Array<number>(81).fill(0);
    const ok = solveFill(grid, createPrng(1n));
    expect(ok).toBe(true);
    expect(grid.every((v) => v >= 1 && v <= 9)).toBe(true);

    const check = (cells: number[]) =>
      new Set(cells).size === 9 && cells.every((v) => v >= 1 && v <= 9);

    for (let r = 0; r < 9; r++) {
      expect(check(grid.slice(r * 9, r * 9 + 9))).toBe(true);
    }
    for (let c = 0; c < 9; c++) {
      expect(check(Array.from({ length: 9 }, (_, r) => grid[r * 9 + c]!))).toBe(true);
    }
  });

  it("is deterministic - same seed produces same filled grid", () => {
    const a = new Array<number>(81).fill(0);
    const b = new Array<number>(81).fill(0);
    solveFill(a, createPrng(42n));
    solveFill(b, createPrng(42n));
    expect(a).toEqual(b);
  });

  it("produces different grids for different seeds", () => {
    const a = new Array<number>(81).fill(0);
    const b = new Array<number>(81).fill(0);
    solveFill(a, createPrng(1n));
    solveFill(b, createPrng(2n));
    expect(a).not.toEqual(b);
  });

  it("returns false for a conflicting starting grid", () => {
    expect(solveFill(makeConflicting(), createPrng(1n))).toBe(false);
  });

  it("the filled grid passes countSolutions returning 1", () => {
    const grid = new Array<number>(81).fill(0);
    solveFill(grid, createPrng(99n));
    expect(countSolutions(grid)).toBe(1);
  });
});
