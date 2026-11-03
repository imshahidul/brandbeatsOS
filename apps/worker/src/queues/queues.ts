import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

/**
 * Queue topology for background work (spec: preview builds, update
 * notifications, scheduled auto-apply).
 *
 * Queues are the stable contract: producers enqueue by name, processors
 * are registered in PROCESSORS below. A processor that isn't implemented
 * yet returns an explicit "not implemented" marker instead of silently
 * dropping the job — check the result, not the silence.
 */
export const QUEUE_NAMES = {
  /** Push/email fan-out when a theme update becomes available (backlog: provider). */
  updateNotifications: 'update-notifications',
  /** Async storefront preview renders (backlog: renderer). */
  previewBuilds: 'preview-builds',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

let connection: IORedis | null = null;

/** Shared Redis connection. BullMQ requires maxRetriesPerRequest: null. */
export function getRedisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

export function getQueue(name: QueueName): Queue {
  return new Queue(name, { connection: getRedisConnection() });
}

type Processor = (job: Job) => Promise<Record<string, unknown>>;

export const PROCESSORS: Record<QueueName, Processor> = {
  [QUEUE_NAMES.updateNotifications]: async (job) => ({
    delivered: false,
    reason: 'notification provider not wired yet (see HANDOVER.md backlog)',
    jobId: job.id ?? null,
  }),
  [QUEUE_NAMES.previewBuilds]: async (job) => ({
    built: false,
    reason: 'preview renderer not implemented yet (see HANDOVER.md backlog)',
    jobId: job.id ?? null,
  }),
};

/**
 * Starts one BullMQ Worker per queue. Only call when Redis is reachable
 * (the worker enables this via WORKER_QUEUES_ENABLED=true).
 */
export function startProcessors(): Worker[] {
  return (Object.keys(PROCESSORS) as QueueName[]).map(
    (name) => new Worker(name, PROCESSORS[name], { connection: getRedisConnection() }),
  );
}
