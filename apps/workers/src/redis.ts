import type { ConnectionOptions } from "bullmq";

const REDIS_URL = process.env["REDIS_URL"] ?? "redis://localhost:6379";

/**
 * Parse REDIS_URL into a plain ConnectionOptions object.
 * Passing options (instead of a Redis instance) lets BullMQ manage its own
 * ioredis connection, avoiding version-mismatch type errors.
 */
export function getRedisOptions(): ConnectionOptions {
  const url = new URL(REDIS_URL);
  const options: ConnectionOptions = {
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 6379,
    maxRetriesPerRequest: null,
  };
  if (url.password) {
    options.password = url.password;
  }
  return options;
}
