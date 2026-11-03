import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomizerService } from './customizer.service';
import {
  SaveSectionsDto,
  SaveSettingsDto,
} from './dto/customizer.dto';
import { TenantGuard } from '../common/guards/tenant.guard';

type TenantReq = { tenant: { id: string } };

/**
 * Visual customizer + homepage builder (spec §5, §6).
 * Merchants change colors, buttons, text and homepage layout freely —
 * everything is validated against the theme's schemas, no code needed.
 */
@Controller('customizer')
@UseGuards(TenantGuard)
export class CustomizerController {
  constructor(private readonly customizer: CustomizerService) {}

  /** Draft + config schema + available sections (renders the editor UI). */
  @Get('installs/:installId')
  getDraft(
    @Req() req: TenantReq,
    @Param('installId') installId: string,
  ) {
    return this.customizer.getDraft(installId, req.tenant.id);
  }

  /** Save theme settings (colors, buttons, typography…). */
  @Put('installs/:installId/settings')
  saveSettings(
    @Req() req: TenantReq,
    @Param('installId') installId: string,
    @Body() dto: SaveSettingsDto,
  ) {
    return this.customizer.saveSettings(installId, req.tenant.id, dto.settings);
  }

  /** Replace the homepage layout (order = render order). */
  @Put('installs/:installId/sections')
  saveSections(
    @Req() req: TenantReq,
    @Param('installId') installId: string,
    @Body() dto: SaveSectionsDto,
  ) {
    return this.customizer.saveSections(installId, req.tenant.id, dto.sections);
  }

  /** Validate + publish the draft as an immutable snapshot. */
  @Post('installs/:installId/publish')
  publish(@Req() req: TenantReq, @Param('installId') installId: string) {
    return this.customizer.publish(installId, req.tenant.id);
  }

  /** Latest published snapshot (what the storefront renders). */
  @Get('installs/:installId/published')
  getPublished(
    @Req() req: TenantReq,
    @Param('installId') installId: string,
  ) {
    return this.customizer.getPublished(installId, req.tenant.id);
  }

  /** Assembled storefront document for the sandboxed live preview. */
  @Get('installs/:installId/preview')
  getPreview(
    @Req() req: TenantReq,
    @Param('installId') installId: string,
  ) {
    return this.customizer.getPreview(installId, req.tenant.id);
  }
}
