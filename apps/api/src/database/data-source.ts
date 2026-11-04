import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../users/user.entity';
import { RefreshToken } from '../auth/refresh-token.entity';
import { AuditLog } from '../audit/audit-log.entity';
import { Tenant } from '../tenants/tenant.entity';
import { TenantMember } from '../tenants/tenant-member.entity';
import { Theme } from '../themes/theme.entity';
import { ThemeVersion } from '../themes/theme-version.entity';
import { ThemeInstall } from '../marketplace/theme-install.entity';
import { MerchantThemeSettings } from '../customizer/merchant-theme-settings.entity';
import { PublishedSnapshot } from '../customizer/published-snapshot.entity';
import { UpdateStaging } from '../updates/update-staging.entity';
import { Product } from '../products/product.entity';
import { InitialSchema1793702244000 } from './migrations/1793702244000-InitialSchema';
import { AddProducts1793790000000 } from './migrations/1793790000000-AddProducts';
import { AddProductSpecs1793800000000 } from './migrations/1793800000000-AddProductSpecs';
import { AddShowcaseSections1793810000000 } from './migrations/1793810000000-AddShowcaseSections';

config();

/**
 * TypeORM CLI data-source (`npm run migration:generate` etc.).
 * Migrations are listed explicitly — no glob patterns, so it works
 * identically from src (ts-node) and dist (compiled JS).
 */
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    User,
    RefreshToken,
    AuditLog,
    Tenant,
    TenantMember,
    Theme,
    ThemeVersion,
    ThemeInstall,
    MerchantThemeSettings,
    PublishedSnapshot,
    UpdateStaging,
    Product,
  ],
  migrations: [InitialSchema1793702244000, AddProducts1793790000000, AddProductSpecs1793800000000, AddShowcaseSections1793810000000],
  synchronize: false,
});
