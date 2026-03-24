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

// Total batch slots per difficulty needed to fill the pool from zero.
// Stable slot IDs prevent the monitor from re-enqueueing already-queued batches.
const TOTAL_SLOTS = Math.ceil(
  CONSTANTS.PUZZLE_POOL_TARGET / CONSTANTS.PUZZLE_BATCH_SIZE,
);

// ── Refill logic ──────────────────────────────────────────────────────────────

async function checkAndRefill(): Promise<void> {
  const counts = await getAvailableCounts();

  for (const difficulty of DIFFICULTIES) {
    const available = counts[difficulty] ?? 0;

    if (available < CONSTANTS.PUZZLE_POOL_REFILL_THRESHOLD) {
      // Enqueue all slots with stable IDs. BullMQ silently ignores any slot
      // whose ID already exists in waiting/active state, so this is safe to
      // call every minute without compounding the queue.
      const needed = Math.ceil(
        (CONSTANTS.PUZZLE_POOL_TARGET - available) / CONSTANTS.PUZZLE_BATCH_SIZE,
      );
      const slots = Math.min(needed, TOTAL_SLOTS);

      console.log(
        `[pool-monitor] ${difficulty}: available=${available} enqueueing up to ${slots} slot(s)`,
      );

      for (let slot = 0; slot < slots; slot++) {
        const jobId = `refill_${difficulty}_slot_${slot}`;

        // Skip if the job already exists in any non-terminal state.
        // BullMQ deduplicates waiting jobs by ID but NOT active ones.
        const existing = await puzzleGenerationQueue.getJob(jobId);
        if (existing) {
          const state = await existing.getState();
          if (state === "waiting" || state === "active" || state === "delayed") {
            continue;
          }
        }

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
