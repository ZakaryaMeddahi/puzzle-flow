import { Worker, type Job } from "bullmq";
import { prisma, CONSTANTS } from "@kdp/shared";
import { getRedisOptions } from "../redis";
import { QUEUE_CLEANUP, type CleanupJobData } from "../queues";

// ── Processor ─────────────────────────────────────────────────────────────────

async function processCleanupJob(job: Job<CleanupJobData>): Promise<void> {
  const { ttlMinutes } = job.data;

  const result = await prisma.$executeRawUnsafe(
    `
    UPDATE puzzle_registry
    SET status      = 'available',
        user_id     = NULL,
        book_id     = NULL,
        reserved_at = NULL
    WHERE status      = 'pending'
      AND reserved_at < NOW() - ($1 || ' minutes')::interval
    `,
    String(ttlMinutes),
  );

  console.log(`[cleanup] Released ${result} stale reservations (TTL=${ttlMinutes}m)`);
}

// ── Export factory ────────────────────────────────────────────────────────────

export function startCleanupWorker(): Worker<CleanupJobData> {
  const worker = new Worker<CleanupJobData>(
    QUEUE_CLEANUP,
    processCleanupJob,
    { connection: getRedisOptions() },
  );

  worker.on("completed", (job) => {
    console.log(`[cleanup] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[cleanup] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
