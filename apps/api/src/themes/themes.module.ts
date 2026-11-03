import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Theme } from './theme.entity';
import { ThemeVersion } from './theme-version.entity';
import { ThemesService } from './themes.service';

/**
 * Phase 2: domain layer only (entities + publishing service).
 * HTTP surface (marketplace/admin controllers) lands in Phase 3.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Theme, ThemeVersion])],
  providers: [ThemesService],
  exports: [ThemesService],
})
export class ThemesModule {}
