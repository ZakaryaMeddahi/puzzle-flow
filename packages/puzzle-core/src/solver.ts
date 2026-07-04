/**
 * efficient Sudoku solver using:
 * - Bitmask constraint tracking (rows / cols / boxes)
 * - Minimum Remaining Values (MRV) heuristic for cell selection
 *
 * Grid: number[81], values 0 (empty) or 1-9.
 * Bit k in a mask means digit (k+1) is already used.
 */

// helpers

/** number of set bits in x (for values 0-511). */
function popcount(x: number): number {
  x = x - ((x >> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
  x = (x + (x >> 4)) & 0x0f0f0f0f;
  return (Math.imul(x, 0x01010101) >> 24) & 0x3f;
}

/** index of the lowest set bit (0-indexed). x must be non-zero. */
function lowestBit(x: number): number {
  return 31 - Math.clz32(x & -x);
}

const ROW_OF = (i: number) => (i / 9) | 0;
const COL_OF = (i: number) => i % 9;
const BOX_OF = (i: number) =>
  ((((i / 9) | 0) / 3) | 0) * 3 + (((i % 9) / 3) | 0);

// constraint initialization

interface Masks {
  rows: number[];
  cols: number[];
  boxes: number[];
}

/**
 * build bitmask constraint sets from the current grid.
 * returns null if any conflict exists (two identical digits in a row/col/box).
 */
function buildMasks(grid: number[]): Masks | null {
  const rows = new Array<number>(9).fill(0);
  const cols = new Array<number>(9).fill(0);
  const boxes = new Array<number>(9).fill(0);

  for (let i = 0; i < 81; i++) {
    const d = grid[i]!;
    if (d !== 0) {
      const bit = 1 << (d - 1);
      const r = ROW_OF(i),
        c = COL_OF(i),
        b = BOX_OF(i);
      if ((rows[r]! | cols[c]! | boxes[b]!) & bit) return null; // conflict
      rows[r]! |= bit;
      cols[c]! |= bit;
      boxes[b]! |= bit;
    }
  }
  return { rows, cols, boxes };
}

// solution counter

/**
 * count solutions in `grid`, stopping early once `max` is reached.
 * modifies `grid` during search but fully restores it before returning.
 */
export function countSolutions(grid: number[], max = 2): number {
  const masks = buildMasks(grid);
  if (!masks) return 0;
  const { rows, cols, boxes } = masks;

  function solve(): number {
    // MRV: find the empty cell with fewest available digits
    let bestPos = -1;
    let bestCount = 10;

    for (let i = 0; i < 81; i++) {
      if (grid[i] === 0) {
        const avail =
          ~(rows[ROW_OF(i)]! | cols[COL_OF(i)]! | boxes[BOX_OF(i)]!) & 0x1ff;
        const cnt = popcount(avail);
        if (cnt === 0) return 0; // dead end
        if (cnt < bestCount) {
          bestCount = cnt;
          bestPos = i;
          if (cnt === 1) break;
        }
      }
    }

    if (bestPos === -1) return 1; // fully solved

    const r = ROW_OF(bestPos),
      c = COL_OF(bestPos),
      b = BOX_OF(bestPos);
    let avail = ~(rows[r]! | cols[c]! | boxes[b]!) & 0x1ff;
    let solutions = 0;

    while (avail) {
      const bit = avail & -avail;
      avail &= avail - 1;
      const digit = lowestBit(bit) + 1;

      rows[r]! |= bit;
      cols[c]! |= bit;
      boxes[b]! |= bit;
      grid[bestPos] = digit;

      solutions += solve();

      rows[r]! &= ~bit;
      cols[c]! &= ~bit;
      boxes[b]! &= ~bit;
      grid[bestPos] = 0;

      if (solutions >= max) return solutions;
    }
    return solutions;
  }

  return solve();
}

// random fill

/**
 * fill all empty cells to produce a complete valid solution.
 * digit order within each cell is randomized via `next` (a seeded PRNG).
 * Returns true on success (always succeeds for a consistent starting grid).
 * the filled grid is left in `grid` when true is returned.
 */
export function solveFill(grid: number[], next: () => number): boolean {
  const masks = buildMasks(grid);
  if (!masks) return false;
  const { rows, cols, boxes } = masks;

  function solve(): boolean {
    // MRV
    let bestPos = -1;
    let bestCount = 10;

    for (let i = 0; i < 81; i++) {
      if (grid[i] === 0) {
        const avail =
          ~(rows[ROW_OF(i)]! | cols[COL_OF(i)]! | boxes[BOX_OF(i)]!) & 0x1ff;
        const cnt = popcount(avail);
        if (cnt === 0) return false;
        if (cnt < bestCount) {
          bestCount = cnt;
          bestPos = i;
          if (cnt === 1) break;
        }
      }
    }

    if (bestPos === -1) return true; // done

    const r = ROW_OF(bestPos),
      c = COL_OF(bestPos),
      b = BOX_OF(bestPos);
    let avail = ~(rows[r]! | cols[c]! | boxes[b]!) & 0x1ff;

    // Collect and randomize available digits
    const digits: number[] = [];
    let mask = avail;
    while (mask) {
      digits.push(lowestBit(mask & -mask) + 1);
      mask &= mask - 1;
    }
    // Fisher-Yates on the small digits array
    for (let i = digits.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      const tmp = digits[i]!;
      digits[i] = digits[j]!;
      digits[j] = tmp;
    }

    for (const digit of digits) {
      const bit = 1 << (digit - 1);
      rows[r]! |= bit;
      cols[c]! |= bit;
      boxes[b]! |= bit;
      grid[bestPos] = digit;

      if (solve()) return true;

      rows[r]! &= ~bit;
      cols[c]! &= ~bit;
      boxes[b]! &= ~bit;
      grid[bestPos] = 0;
    }
    return false;
  }

  return solve();
}
