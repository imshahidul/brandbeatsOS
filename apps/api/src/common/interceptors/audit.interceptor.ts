import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../audit/audit.service';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Writes an audit entry for mutating API calls (except /auth/* to avoid
 * ever logging credential payloads). Fire-and-forget; audit failures never
 * break the request.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const shouldAudit =
      MUTATING.has(req.method) && !req.path.includes('/auth/');

    if (!shouldAudit) return next.handle();

    return next.handle().pipe(
      tap({
        next: () => {
          void this.audit
            .log({
              actorUserId: req.user?.sub ?? null,
              tenantId: req.tenant?.id ?? null,
              action: `${req.method} ${req.path}`,
            })
            .catch(() => undefined);
        },
      }),
    );
  }
}
