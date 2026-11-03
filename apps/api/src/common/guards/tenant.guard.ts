import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { TenantsService } from '../../tenants/tenants.service';

/**
 * Enforces tenant isolation: requires an X-Tenant-Id header and verifies the
 * authenticated user is a member of that tenant. Attaches req.tenant.
 * Apply with @UseGuards(TenantGuard) on tenant-scoped controllers.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenants: TenantsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const tenantId = req.headers['x-tenant-id'] as string | undefined;
    const user = req.user as { sub: string } | undefined;

    if (!tenantId) throw new ForbiddenException('Missing X-Tenant-Id header');
    if (!user?.sub) throw new ForbiddenException('Unauthenticated');

    const membership = await this.tenants.findMembership(tenantId, user.sub);
    if (!membership) throw new ForbiddenException('Not a member of this tenant');

    req.tenant = { id: tenantId, role: membership.role };
    return true;
  }
}
