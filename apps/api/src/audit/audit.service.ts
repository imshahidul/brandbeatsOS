import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private readonly logs: Repository<AuditLog>,
  ) {}

  log(entry: {
    actorUserId?: string | null;
    tenantId?: string | null;
    action: string;
    meta?: Record<string, unknown>;
  }): Promise<AuditLog> {
    return this.logs.save(
      this.logs.create({
        actorUserId: entry.actorUserId ?? null,
        tenantId: entry.tenantId ?? null,
        action: entry.action,
        meta: entry.meta ?? null,
      }),
    );
  }
}
