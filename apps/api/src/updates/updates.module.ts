import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpdateStaging } from './update-staging.entity';
import { UpdatesService } from './updates.service';
import { UpdatesController } from './updates.controller';
import { ThemesModule } from '../themes/themes.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { CustomizerModule } from '../customizer/customizer.module';
import { MerchantThemeSettings } from '../customizer/merchant-theme-settings.entity';
import { PublishedSnapshot } from '../customizer/published-snapshot.entity';
import { ThemeInstall } from '../marketplace/theme-install.entity';

@Module({
  imports: [
    ThemesModule,
    MarketplaceModule,
    CustomizerModule,
    TypeOrmModule.forFeature([
      UpdateStaging,
      PublishedSnapshot,
      MerchantThemeSettings,
      ThemeInstall,
    ]),
  ],
  controllers: [UpdatesController],
  providers: [UpdatesService],
  exports: [UpdatesService],
})
export class UpdatesModule {}
