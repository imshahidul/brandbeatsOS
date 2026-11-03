import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { UpdatesService } from '../../../api/src/updates/updates.service';

/**
 * Scheduled auto-apply (spec §9): every AUTO_APPLY_INTERVAL_MS (default 6h),
 * apply the latest published theme version to installs with policy 'auto' —
 * but ONLY when fully compatible. Incompatible installs are skipped with
 * reasons; nothing is ever force-updated (UpdatesService.autoApplyAll).
 */
@Injectable()
export class AutoApplyJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutoApplyJob.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(private readonly updates: UpdatesService) {}

  get intervalMs(): number {
    return Number(process.env.AUTO_APPLY_INTERVAL_MS ?? 6 * 60 * 60 * 1000);
  }

  onModuleInit(): void {
    // First tick shortly after boot so a fresh deploy picks up pending work,
    // then on the configured interval. unref() so the timer never keeps a
    // one-shot process alive.
    this.timer = setInterval(() => void this.runOnce(), this.intervalMs);
    this.timer.unref?.();
    this.logger.log(`Auto-apply scheduled every ${this.intervalMs}ms`);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** One auto-apply pass. Guarded against overlapping runs. */
  async runOnce(): Promise<{ applied: unknown[]; skipped: unknown[] }> {
    if (this.running) {
      this.logger.warn('Previous auto-apply still running; skipping tick');
      return { applied: [], skipped: [] };
    }
    this.running = true;
    try {
      const result = await this.updates.autoApplyAll();
      this.logger.log(
        `Auto-apply done: ${result.applied.length} applied, ${result.skipped.length} skipped`,
      );
      return result;
    } finally {
      this.running = false;
    }
  }
}
