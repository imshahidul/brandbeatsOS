/**
 * verify-worker.js — boots the REAL worker against REAL PostgreSQL + Redis
 * and checks: context boots, auto-apply runs clean on an empty DB, the
 * scheduler is registered, and both BullMQ queues process jobs end-to-end.
 *
 * Usage:
 *   DATABASE_URL=postgres://.../bb_worker_test REDIS_URL=redis://localhost:6379 \
 *     WORKER_QUEUES_ENABLED=true node verify-worker.js
 */
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { QueueEvents } = require('bullmq');
const { WorkerModule } = require('./dist/worker/src/worker.module');
const { AutoApplyJob } = require('./dist/worker/src/jobs/auto-apply.job');
const { QUEUE_NAMES, PROCESSORS, getQueue, getRedisConnection } = require('./dist/worker/src/queues/queues');

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; }
  else { failed++; console.log('  FAIL -', name); }
}

async function main() {
  console.log('== worker boot ==');
  const app = await NestFactory.createApplicationContext(WorkerModule, { logger: false });
  check('application context boots', !!app);

  const job = app.get(AutoApplyJob);
  check('AutoApplyJob registered', !!job);
  check('default interval is 6h', job.intervalMs === 6 * 60 * 60 * 1000);

  console.log('== auto-apply on empty DB ==');
  const result = await job.runOnce();
  check('runOnce resolves', !!result);
  check('nothing applied on empty DB', Array.isArray(result.applied) && result.applied.length === 0);
  check('nothing skipped on empty DB', Array.isArray(result.skipped) && result.skipped.length === 0);

  // overlapping-run guard
  job.running = true;
  const guarded = await job.runOnce();
  check('overlapping run is skipped', guarded.applied.length === 0 && guarded.skipped.length === 0);
  job.running = false;

  console.log('== queues (real Redis) ==');
  check('both queues defined', QUEUE_NAMES.updateNotifications === 'update-notifications' && QUEUE_NAMES.previewBuilds === 'preview-builds');
  check('both processors registered', !!PROCESSORS['update-notifications'] && !!PROCESSORS['preview-builds']);

  for (const name of Object.values(QUEUE_NAMES)) {
    const queue = getQueue(name);
    const events = new QueueEvents(name, { connection: getRedisConnection() });
    await events.waitUntilReady();
    const j = await queue.add('test', { ping: 1 });
    const res = await j.waitUntilFinished(events, 15000);
    check(`queue ${name} processes a job`, !!res);
    check(`queue ${name} returns honest not-implemented marker`, res && res.reason && /not .* yet/.test(res.reason));
    await queue.obliterate({ force: true });
    await events.close();
    await queue.close();
  }

  await app.close();
  const conn = getRedisConnection();
  conn.disconnect();

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
