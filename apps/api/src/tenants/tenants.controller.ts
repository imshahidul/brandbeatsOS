import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantGuard } from '../common/guards/tenant.guard';
import type { AuthPayload } from '../common/guards/jwt-auth.guard';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Post()
  create(@CurrentUser() user: AuthPayload, @Body() dto: CreateTenantDto) {
    return this.tenants.create(user.sub, dto);
  }

  @Get()
  listMine(@CurrentUser() user: AuthPayload) {
    return this.tenants.listForUser(user.sub);
  }

  /**
   * White-label branding for the merchant's storefront frontend
   * (store name, header logo, favicon). Requires X-Tenant-Id header
   * (TenantGuard) + merchant_admin role within that tenant.
   */
  @Patch(':id/branding')
  @UseGuards(TenantGuard)
  updateBranding(
    @Param('id') id: string,
    @Req() req: { tenant: { id: string; role: string } },
    @Body() dto: UpdateBrandingDto,
  ) {
    if (req.tenant.id !== id) {
      throw new ForbiddenException('Tenant mismatch');
    }
    if (req.tenant.role !== 'merchant_admin') {
      throw new ForbiddenException('Requires merchant_admin role');
    }
    return this.tenants.updateBranding(id, dto);
  }
}
