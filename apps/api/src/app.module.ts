import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import appConfig from './config/app.config';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { AuditModule } from './audit/audit.module';
import { ThemesModule } from './themes/themes.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { AdminModule } from './admin/admin.module';
import { CustomizerModule } from './customizer/customizer.module';
import { UpdatesModule } from './updates/updates.module';
import { ProductsModule } from './products/products.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    DatabaseModule,
    UsersModule,
    AuthModule,
    TenantsModule,
    AuditModule,
    ThemesModule,
    MarketplaceModule,
    AdminModule,
    CustomizerModule,
    UpdatesModule,
    ProductsModule,
  ],
  controllers: [HealthController],
  providers: [
    // Auth is enforced globally; routes opt out with @Public().
    // RolesGuard runs after JwtAuthGuard and honors @Roles(...).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
