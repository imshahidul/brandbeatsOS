import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import {
  InstallThemeDto,
  ListThemesQuery,
  SwitchVersionDto,
  UpdateAutoUpdateDto,
} from './dto/marketplace.dto';
import { TenantGuard } from '../common/guards/tenant.guard';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplace: MarketplaceService) {}

  /** Browse public themes. `installed` reflects the caller's tenant. */
  @Get('themes')
  @UseGuards(TenantGuard)
  listThemes(
    @Req() req: { tenant: { id: string } },
    @Query() query: ListThemesQuery,
  ) {
    return this.marketplace.listThemes(req.tenant.id, query);
  }

  @Get('themes/:slug')
  @UseGuards(TenantGuard)
  getTheme(
    @Req() req: { tenant: { id: string } },
    @Param('slug') slug: string,
  ) {
    return this.marketplace.getThemeDetail(req.tenant.id, slug);
  }

  /** Install the latest published version of a theme. */
  @Post('installs')
  @UseGuards(TenantGuard)
  install(
    @Req() req: { tenant: { id: string } },
    @Body() dto: InstallThemeDto,
  ) {
    return this.marketplace.installTheme(req.tenant.id, dto.slug);
  }

  @Get('installs')
  @UseGuards(TenantGuard)
  listInstalls(@Req() req: { tenant: { id: string } }) {
    return this.marketplace.listInstalls(req.tenant.id);
  }

  /** Switch an install to another published version of the same theme. */
  @Post('installs/:id/switch')
  @UseGuards(TenantGuard)
  switchVersion(
    @Req() req: { tenant: { id: string } },
    @Param('id') id: string,
    @Body() dto: SwitchVersionDto,
  ) {
    return this.marketplace.switchVersion(id, req.tenant.id, dto.versionId);
  }

  @Patch('installs/:id/auto-update')
  @UseGuards(TenantGuard)
  setAutoUpdate(
    @Req() req: { tenant: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateAutoUpdateDto,
  ) {
    return this.marketplace.setAutoUpdatePolicy(id, req.tenant.id, dto.policy);
  }

  @Delete('installs/:id')
  @UseGuards(TenantGuard)
  uninstall(
    @Req() req: { tenant: { id: string } },
    @Param('id') id: string,
  ) {
    return this.marketplace.uninstall(id, req.tenant.id);
  }
}
