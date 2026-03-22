import "dotenv/config";
import { startPuzzleGenerationWorker } from "./workers/puzzle-generation.worker";
import { startCleanupWorker } from "./workers/cleanup.worker";
import { startPdfGenerationWorker } from "./workers/pdf-generation.worker";
import { startPoolMonitor } from "./workers/pool-monitor";
import { cleanupQueue } from "./queues";
import { CONSTANTS } from "@kdp/shared";

const CLEANUP_REPEAT_MS = 5 * 60 * 1_000; // every 5 minutes

async function registerRepeatableJobs(): Promise<void> {
  await cleanupQueue.add(
    "cleanup",
    { ttlMinutes: CONSTANTS.RESERVATION_TTL_MINUTES },
    {
      repeat: { every: CLEANUP_REPEAT_MS },
      jobId: "cleanup:stale-reservations",
    },
  );
  console.log("[workers] Repeatable cleanup job registered (every 5 min)");
}

async function main(): Promise<void> {
  console.log("[workers] Starting KDP workers…");

  await registerRepeatableJobs();

  const puzzleWorker = startPuzzleGenerationWorker();
  const pdfWorker    = startPdfGenerationWorker();
  const cleanupWorker = startCleanupWorker();
  const monitorTimer  = startPoolMonitor();

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[workers] ${signal} received — shutting down gracefully`);
    clearInterval(monitorTimer);
    await Promise.all([
      puzzleWorker.close(),
      pdfWorker.close(),
      cleanupWorker.close(),
    ]);
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT",  () => void shutdown("SIGINT"));

  console.log("[workers] All workers running. Waiting for jobs…");
}

main().catch((err) => {
  console.error("[workers] Fatal error:", err);
  process.exit(1);
});
