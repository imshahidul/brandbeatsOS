import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

/**
 * Fail fast in production: never boot with a missing or placeholder DATABASE_URL.
 * (Mirrors apps/api/src/main.ts; the worker needs no JWT_SECRET — no HTTP/auth here.)
 */
function assertProdEnv(): void {
  if (process.env.NODE_ENV !== 'production') return;
  const value = process.env.DATABASE_URL;
  if (!value || value.includes('change-me')) {
    throw new Error(
      'Refusing to boot: DATABASE_URL is missing or still a placeholder (production)',
    );
  }
}

async function bootstrap(): Promise<void> {
  assertProdEnv();
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['log', 'warn', 'error'],
  });
  app.enableShutdownHooks();
  new Logger('Worker').log('Brand Beats worker started');
}

void bootstrap();
