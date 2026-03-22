import { Worker, type Job } from "bullmq";
import { generatePuzzle, encodeSeed, normalizePuzzle, hashPuzzle } from "@kdp/puzzle-core";
import type { Difficulty } from "@kdp/puzzle-core";
import { prisma, PuzzleStatus } from "@kdp/shared";
import { getRedisOptions } from "../redis";
import { QUEUE_PUZZLE_GENERATION, type PuzzleGenerationJobData } from "../queues";

const INSERT_CHUNK_SIZE = 500; // rows per DB round-trip

// ── Seed reservation ──────────────────────────────────────────────────────────

/**
 * Atomically claim `count` sequence numbers for `difficulty`.
 * Creates the seed_counter row if it does not yet exist.
 * Returns the first sequence in the claimed range (1-based).
 */
async function claimSequenceRange(
  difficulty: Difficulty,
  count: number,
): Promise<bigint> {
  const rows = await prisma.$queryRawUnsafe<Array<{ next_seed: string | bigint }>>(
    `
    INSERT INTO seed_counters (difficulty, next_seed)
    VALUES ($1, $2)
    ON CONFLICT (difficulty)
    DO UPDATE SET next_seed = seed_counters.next_seed + $2
    RETURNING next_seed
    `,
    difficulty,
    count,
  );

  // next_seed is the value AFTER the increment; the range we own is
  // [nextSeed - count, nextSeed - 1]  (sequences start at 1)
  const nextSeed = BigInt(String(rows[0]!.next_seed));
  return nextSeed - BigInt(count); // first sequence in our range
}

// ── Worker processor ──────────────────────────────────────────────────────────

async function processPuzzleGenerationJob(
  job: Job<PuzzleGenerationJobData>,
): Promise<void> {
  const { difficulty, batchSize } = job.data;

  console.log(
    `[puzzle-generation] Starting: difficulty=${difficulty} batchSize=${batchSize}`,
  );

  // 1. Atomically reserve a range of sequence numbers
  const startSequence = await claimSequenceRange(difficulty, batchSize);

  // 2. Generate puzzles and accumulate rows
  const rows: Array<{
    seed: bigint;
    hash: string;
    difficulty: string;
    status: string;
  }> = [];

  for (let i = 0; i < batchSize; i++) {
    const sequence = startSequence + BigInt(i + 1); // sequences are 1-based
    const seed = encodeSeed(difficulty, 0, sequence);
    const result = generatePuzzle(seed, difficulty);
    const normalized = normalizePuzzle(result.puzzle);
    const hash = hashPuzzle(normalized);

    rows.push({
      seed,
      hash,
      difficulty,
      status: PuzzleStatus.AVAILABLE,
    });

    // Report progress every chunk
    if ((i + 1) % INSERT_CHUNK_SIZE === 0) {
      await job.updateProgress(Math.round(((i + 1) / batchSize) * 100));
    }
  }

  // 3. Bulk insert in chunks to avoid a single giant transaction
  let inserted = 0;
  for (let offset = 0; offset < rows.length; offset += INSERT_CHUNK_SIZE) {
    const chunk = rows.slice(offset, offset + INSERT_CHUNK_SIZE);
    const result = await prisma.puzzleRegistry.createMany({
      data: chunk,
      skipDuplicates: true, // idempotent — skip if seed/hash already exists
    });
    inserted += result.count;
  }

  console.log(
    `[puzzle-generation] Done: difficulty=${difficulty} generated=${batchSize} inserted=${inserted}`,
  );
}

// ── Export factory ────────────────────────────────────────────────────────────

export function startPuzzleGenerationWorker(): Worker<PuzzleGenerationJobData> {
  const worker = new Worker<PuzzleGenerationJobData>(
    QUEUE_PUZZLE_GENERATION,
    processPuzzleGenerationJob,
    {
      connection: getRedisOptions(),
      concurrency: 1, // one generation job at a time per process
    },
  );

  worker.on("completed", (job) => {
    console.log(`[puzzle-generation] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[puzzle-generation] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
