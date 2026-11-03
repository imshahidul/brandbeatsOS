import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantThemeSettings } from './merchant-theme-settings.entity';
import { PublishedSnapshot } from './published-snapshot.entity';
import { CustomizerService } from './customizer.service';
import { CustomizerController } from './customizer.controller';
import { ThemesModule } from '../themes/themes.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    ThemesModule,
    MarketplaceModule,
    TenantsModule,
    ProductsModule,
    TypeOrmModule.forFeature([MerchantThemeSettings, PublishedSnapshot]),
  ],
  controllers: [CustomizerController],
  providers: [CustomizerService],
  exports: [CustomizerService],
})
export class CustomizerModule {}
