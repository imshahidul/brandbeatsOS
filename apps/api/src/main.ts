import 'reflect-metadata';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { json } from 'express';
import { AppModule } from './app.module';

/**
 * Fail fast in production: never boot with missing or placeholder secrets.
 * This is the cheapest secret-leak prevention there is.
 */
function assertProdEnv(): void {
  if (process.env.NODE_ENV !== 'production') return;
  for (const key of ['DATABASE_URL', 'JWT_SECRET']) {
    const value = process.env[key];
    if (!value || value.includes('change-me')) {
      throw new Error(
        `Refusing to boot: ${key} is missing or still a placeholder (production)`,
      );
    }
  }
}

async function bootstrap() {
  assertProdEnv();
  const app = await NestFactory.create(AppModule);

  app.use(helmet()); // secure HTTP headers, hides X-Powered-By
  app.use(json({ limit: '1mb' })); // reject oversized bodies early

  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // URI versioning: controllers get /v1/... automatically.
  // Breaking changes ship as /v2/... while /v1 keeps working.
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`brand-beats-api listening on :${port}`);
}
void bootstrap();
