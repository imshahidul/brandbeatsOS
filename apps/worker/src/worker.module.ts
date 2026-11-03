import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../api/src/database/database.module';
import { UpdatesModule } from '../../api/src/updates/updates.module';
import { AutoApplyJob } from './jobs/auto-apply.job';
import { startProcessors } from './queues/queues';

/**
 * Background worker: scheduled auto-apply + BullMQ queue processors.
 * No HTTP — this is a pure application context (NestFactory.createApplicationContext).
 *
 * It reuses the API's DatabaseModule and UpdatesModule directly (same
 * process-local code, same database). UpdatesModule is self-sufficient:
 * it imports TenantsModule itself for its controller's TenantGuard. In production the API owns schema
 * migrations; the worker boots after the API is healthy (see
 * deploy/docker-compose.yml depends_on) so they never race.
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, UpdatesModule],
  providers: [AutoApplyJob],
})
export class WorkerModule implements OnModuleInit {
  private readonly logger = new Logger(WorkerModule.name);

  onModuleInit(): void {
    if (process.env.WORKER_QUEUES_ENABLED === 'true') {
      const workers = startProcessors();
      this.logger.log(`Started ${workers.length} queue processor(s)`);
    } else {
      this.logger.log('Queue processors disabled (WORKER_QUEUES_ENABLED != "true")');
    }
  }
}
