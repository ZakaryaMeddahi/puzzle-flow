import { prisma, Difficulty, CONSTANTS } from "@kdp/shared";
import { puzzleGenerationQueue } from "../queues";

const DIFFICULTIES = [
  Difficulty.EASY,
  Difficulty.MEDIUM,
  Difficulty.HARD,
  Difficulty.EXPERT,
] as const;

const CHECK_INTERVAL_MS = 60_000; // check every minute

// ── Pool size query ───────────────────────────────────────────────────────────

async function getAvailableCounts(): Promise<Record<string, number>> {
  const rows = await prisma.puzzleRegistry.groupBy({
    by: ["difficulty"],
    where: { status: "available" },
    _count: { id: true },
  });

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.difficulty] = row._count.id;
  }
  return counts;
}

// ── Refill logic ──────────────────────────────────────────────────────────────

async function checkAndRefill(): Promise<void> {
  const counts = await getAvailableCounts();

  for (const difficulty of DIFFICULTIES) {
    const available = counts[difficulty] ?? 0;

    if (available < CONSTANTS.PUZZLE_POOL_REFILL_THRESHOLD) {
      // How many batches do we need to reach the target?
      const deficit = CONSTANTS.PUZZLE_POOL_TARGET - available;
      const batches = Math.ceil(deficit / CONSTANTS.PUZZLE_BATCH_SIZE);

      console.log(
        `[pool-monitor] ${difficulty}: available=${available} deficit=${deficit} enqueueing ${batches} batch(es)`,
      );

      for (let i = 0; i < batches; i++) {
        // Use a deduplicated job ID per difficulty+batch so that rapid restarts
        // don't flood the queue with duplicates.
        const jobId = `refill:${difficulty}:${Date.now()}:${i}`;
        await puzzleGenerationQueue.add(
          "generate",
          { difficulty, batchSize: CONSTANTS.PUZZLE_BATCH_SIZE },
          {
            jobId,
            attempts: 3,
            backoff: { type: "exponential", delay: 5_000 },
          },
        );
      }
    } else {
      console.log(`[pool-monitor] ${difficulty}: available=${available} (ok)`);
    }
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────

export function startPoolMonitor(): NodeJS.Timeout {
  // Run immediately on startup, then on the interval
  checkAndRefill().catch((err) =>
    console.error("[pool-monitor] Error:", err),
  );

  return setInterval(() => {
    checkAndRefill().catch((err) =>
      console.error("[pool-monitor] Error:", err),
    );
  }, CHECK_INTERVAL_MS);
}
