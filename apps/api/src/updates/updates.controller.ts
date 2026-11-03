import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UpdatesService } from './updates.service';
import {
  RollbackDto,
  StageSectionsDto,
  StageSettingsDto,
  TargetVersionDto,
} from './dto/updates.dto';
import { TenantGuard } from '../common/guards/tenant.guard';

type TenantReq = { tenant: { id: string } };

/**
 * Safe theme update system (spec §9): update notifications, compatibility
 * checks, staging, merchant-approved apply with automatic backup,
 * and one-click rollback. Nothing here ever silently overwrites
 * merchant content.
 */
@Controller('updates')
@UseGuards(TenantGuard)
export class UpdatesController {
  constructor(private readonly updates: UpdatesService) {}

  /** Update notifications: installs with newer published versions. */
  @Get()
  listAvailable(@Req() req: TenantReq) {
    return this.updates.listAvailable(req.tenant.id);
  }

  /** Compatibility report for a target version (no mutation). */
  @Post(':installId/check')
  check(
    @Req() req: TenantReq,
    @Param('installId') installId: string,
    @Body() dto: TargetVersionDto,
  ) {
    return this.updates.check(installId, req.tenant.id, dto.targetVersionId);
  }

  /** Start staging an update (seeded from current draft). */
  @Post(':installId/stage')
  stage(
    @Req() req: TenantReq,
    @Param('installId') installId: string,
    @Body() dto: TargetVersionDto,
  ) {
    return this.updates.stageUpdate(installId, req.tenant.id, dto.targetVersionId);
  }

  @Get(':installId/stage')
  getStaging(@Req() req: TenantReq, @Param('installId') installId: string) {
    return this.updates.getStaging(installId, req.tenant.id);
  }

  /** Fix staged settings against the TARGET version's schema. */
  @Put(':installId/stage/settings')
  updateStagedSettings(
    @Req() req: TenantReq,
    @Param('installId') installId: string,
    @Body() dto: StageSettingsDto,
  ) {
    return this.updates.updateStagedSettings(
      installId,
      req.tenant.id,
      dto.settings,
    );
  }

  @Put(':installId/stage/sections')
  updateStagedSections(
    @Req() req: TenantReq,
    @Param('installId') installId: string,
    @Body() dto: StageSectionsDto,
  ) {
    return this.updates.updateStagedSections(
      installId,
      req.tenant.id,
      dto.sections,
    );
  }

  @Delete(':installId/stage')
  discardStaging(
    @Req() req: TenantReq,
    @Param('installId') installId: string,
  ) {
    return this.updates.discardStaging(installId, req.tenant.id);
  }

  /** Merchant approves: backup → switch version → publish snapshot. */
  @Post(':installId/stage/apply')
  apply(@Req() req: TenantReq, @Param('installId') installId: string) {
    return this.updates.applyStaged(installId, req.tenant.id);
  }

  /** Rollback targets (newest first). */
  @Get(':installId/snapshots')
  listSnapshots(
    @Req() req: TenantReq,
    @Param('installId') installId: string,
  ) {
    return this.updates.listSnapshots(installId, req.tenant.id);
  }

  /** One-click rollback to a previous snapshot. */
  @Post(':installId/rollback')
  rollback(
    @Req() req: TenantReq,
    @Param('installId') installId: string,
    @Body() dto: RollbackDto,
  ) {
    return this.updates.rollback(installId, req.tenant.id, dto.snapshotId);
  }
}
