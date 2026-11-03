import { Controller, Get, UseGuards } from '@nestjs/common';
import { TenantsService } from '../tenants/tenants.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

/**
 * Platform-level administration (spec §7, §13): cross-tenant overview
 * for the Brand Beats team. Restricted to platform_admin.
 */
@Controller('admin')
@UseGuards(RolesGuard)
@Roles('platform_admin')
export class PlatformController {
  constructor(private readonly tenants: TenantsService) {}

  /** Every merchant store on the platform, newest first. */
  @Get('tenants')
  listTenants() {
    return this.tenants.listAll();
  }
}
