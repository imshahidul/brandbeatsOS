/**
 * verify-migration-schema.js — guards against schema drift between the
 * TypeORM entities (dev `synchronize`) and the hand-written migrations
 * (production `migrationsRun`).
 *
 * Builds schema A from entities via synchronize, schema B from migrations,
 * then diffs table/column names, types, nullability and defaults.
 * Constraint NAMES are intentionally ignored (TypeORM generates hashes).
 *
 * Usage:
 *   SYNC_URL=postgres://.../bb_sync_test MIGRATION_URL=postgres://.../bb_migration_test \
 *     node verify-migration-schema.js
 * (create both empty databases first)
 */
const { DataSource } = require('typeorm');
const { InitialSchema1793702244000 } = require('./dist/database/migrations/1793702244000-InitialSchema');
const { AddProducts1793790000000 } = require('./dist/database/migrations/1793790000000-AddProducts');
const { User } = require('./dist/users/user.entity');
const { RefreshToken } = require('./dist/auth/refresh-token.entity');
const { AuditLog } = require('./dist/audit/audit-log.entity');
const { Tenant } = require('./dist/tenants/tenant.entity');
const { TenantMember } = require('./dist/tenants/tenant-member.entity');
const { Theme } = require('./dist/themes/theme.entity');
const { ThemeVersion } = require('./dist/themes/theme-version.entity');
const { ThemeInstall } = require('./dist/marketplace/theme-install.entity');
const { MerchantThemeSettings } = require('./dist/customizer/merchant-theme-settings.entity');
const { PublishedSnapshot } = require('./dist/customizer/published-snapshot.entity');
const { UpdateStaging } = require('./dist/updates/update-staging.entity');
const { Product } = require('./dist/products/product.entity');

const ENTITIES = [User, RefreshToken, AuditLog, Tenant, TenantMember, Theme, ThemeVersion, ThemeInstall, MerchantThemeSettings, PublishedSnapshot, UpdateStaging, Product];

async function snapshot(url, setup) {
  const ds = new DataSource({ type: 'postgres', url, entities: ENTITIES, migrations: [InitialSchema1793702244000, AddProducts1793790000000], synchronize: false });
  await ds.initialize();
  await setup(ds);
  const rows = await ds.query(
    `SELECT table_name, column_name, udt_name, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema='public' AND table_name NOT IN ('migrations')
     ORDER BY table_name, ordinal_position`,
  );
  await ds.destroy();
  return rows.map(
    (r) => `${r.table_name}.${r.column_name}:${r.udt_name}:${r.is_nullable}:${(r.column_default || '').replace(/::[a-z ]+/g, '')}`,
  );
}

async function main() {
  const a = new Set(await snapshot(process.env.SYNC_URL, async (ds) => {
    ds.setOptions({ synchronize: true });
    await ds.synchronize();
  }));
  const b = new Set(await snapshot(process.env.MIGRATION_URL, async (ds) => {
    await ds.runMigrations();
  }));
  const onlyA = [...a].filter((x) => !b.has(x));
  const onlyB = [...b].filter((x) => !a.has(x));
  let failed = 0;
  for (const x of onlyA) { console.log('  only in entities :', x); failed++; }
  for (const x of onlyB) { console.log('  only in migration:', x); failed++; }
  if (failed === 0) console.log('SCHEMA_MATCH: entities == migration');
  else console.log(`SCHEMA_MISMATCH: ${failed} differences`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
