import { normalizePuzzle, hashPuzzle } from "../hash";

const ZEROS = "0".repeat(81);
const DIGITS = "123456789".repeat(9);

describe("normalizePuzzle", () => {
  it("passes through an all-zeros string unchanged", () => {
    expect(normalizePuzzle(ZEROS)).toBe(ZEROS);
  });

  it("passes through an all-digit string unchanged", () => {
    expect(normalizePuzzle(DIGITS)).toBe(DIGITS);
  });

  it("replaces '.' with '0'", () => {
    const input = ".".repeat(81);
    expect(normalizePuzzle(input)).toBe(ZEROS);
  });

  it("replaces spaces and other non-digit characters with '0'", () => {
    const input = " ".repeat(81);
    expect(normalizePuzzle(input)).toBe(ZEROS);
  });

  it("keeps clue digits intact and normalises empty markers", () => {
    const input = "1" + ".".repeat(80);
    const result = normalizePuzzle(input);
    expect(result[0]).toBe("1");
    expect(result.slice(1)).toBe("0".repeat(80));
  });

  it("throws for strings shorter than 81 characters", () => {
    expect(() => normalizePuzzle("0".repeat(80))).toThrow();
  });

  it("throws for strings longer than 81 characters", () => {
    expect(() => normalizePuzzle("0".repeat(82))).toThrow();
  });
});

describe("hashPuzzle", () => {
  it("returns a 64-character hex string", () => {
    const h = hashPuzzle(ZEROS);
    expect(h).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(h)).toBe(true);
  });

  it("is deterministic — same input always produces same hash", () => {
    expect(hashPuzzle(ZEROS)).toBe(hashPuzzle(ZEROS));
  });

  it("produces different hashes for different inputs", () => {
    const a = hashPuzzle(ZEROS);
    const b = hashPuzzle("1" + "0".repeat(80));
    expect(a).not.toBe(b);
  });

  it("known SHA-256 value for all-zeros", () => {
    // Pre-computed: echo -n "000...0" (81 zeros) | sha256sum
    const { createHash } = require("crypto") as typeof import("crypto");
    const expected = createHash("sha256").update(ZEROS, "utf8").digest("hex");
    expect(hashPuzzle(ZEROS)).toBe(expected);
  });
});
