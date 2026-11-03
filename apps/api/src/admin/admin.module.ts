import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ThemesModule } from '../themes/themes.module';
import { UpdatesModule } from '../updates/updates.module';

@Module({
  imports: [ThemesModule, UpdatesModule],
  controllers: [AdminController],
})
export class AdminModule {}
