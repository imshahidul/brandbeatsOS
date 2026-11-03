import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ThemesService } from '../themes/themes.service';
import { UpdatesService } from '../updates/updates.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  AdminCreateThemeDto,
  AdminPublishVersionDto,
  AdminUpdateThemeDto,
} from './dto/admin.dto';

/**
 * Brand Beats platform administration (spec §7): theme releases,
 * visibility, deprecation. Restricted to platform_admin.
 */
@Controller('admin/themes')
@UseGuards(RolesGuard)
@Roles('platform_admin')
export class AdminController {
  constructor(
    private readonly themes: ThemesService,
    private readonly updates: UpdatesService,
  ) {}

  @Post()
  createTheme(@Body() dto: AdminCreateThemeDto) {
    return this.themes.createTheme(dto);
  }

  @Get()
  listThemes() {
    return this.themes.listAllThemes();
  }

  @Post(':id/versions')
  publishVersion(
    @Param('id') id: string,
    @Body() dto: AdminPublishVersionDto,
  ) {
    return this.themes.publishVersion(id, dto);
  }

  @Patch(':id')
  updateTheme(
    @Param('id') id: string,
    @Body() dto: AdminUpdateThemeDto,
  ) {
    return this.themes.updateTheme(id, dto);
  }

  /**
   * Executes the automatic update policy across all installs with
   * policy 'auto'. Only fully-compatible updates are applied;
   * incompatible installs are reported, never force-updated.
   */
  @Post('updates/auto-apply')
  autoApply() {
    return this.updates.autoApplyAll();
  }
}
