import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThemeInstall } from './theme-install.entity';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { ThemesModule } from '../themes/themes.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    ThemesModule,
    TenantsModule, // provides TenantsService for TenantGuard
    TypeOrmModule.forFeature([ThemeInstall]),
  ],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
