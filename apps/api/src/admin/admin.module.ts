import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PlatformController } from './platform.controller';
import { ThemesModule } from '../themes/themes.module';
import { UpdatesModule } from '../updates/updates.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [ThemesModule, UpdatesModule, TenantsModule],
  controllers: [AdminController, PlatformController],
})
export class AdminModule {}
