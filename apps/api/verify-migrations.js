/**
 * verify-migrations.js — runs the REAL initial migration up AND down
 * against a REAL PostgreSQL database and checks every table/column.
 *
 * Usage:  DATABASE_URL=postgres://.../bb_migration_test node verify-migrations.js
 * (create the empty database first)
 */
const { DataSource } = require('typeorm');
const { InitialSchema1793702244000 } = require('./dist/database/migrations/1793702244000-InitialSchema');

const EXPECTED = {
  users: ['id', 'email', 'password_hash', 'roles', 'is_active', 'created_at'],
  refresh_tokens: ['id', 'user_id', 'token_hash', 'expires_at', 'revoked_at', 'created_at'],
  audit_log: ['id', 'actor_user_id', 'tenant_id', 'action', 'meta', 'created_at'],
  tenants: ['id', 'name', 'slug', 'logo_url', 'favicon_url', 'created_at'],
  tenant_members: ['id', 'tenant_id', 'user_id', 'role', 'created_at'],
  themes: ['id', 'slug', 'name', 'visibility', 'monetization', 'created_at'],
  theme_versions: ['id', 'theme_id', 'version', 'manifest', 'config_schema', 'package_url', 'changelog', 'min_platform_version', 'status', 'created_at'],
  theme_installs: ['id', 'tenant_id', 'theme_id', 'active_version_id', 'auto_update_policy', 'installed_at', 'updated_at'],
  merchant_theme_settings: ['id', 'install_id', 'settings', 'sections', 'updated_at'],
  published_snapshots: ['id', 'install_id', 'version_id', 'settings', 'sections', 'label', 'published_at'],
  update_stagings: ['id', 'install_id', 'target_version_id', 'staged_settings', 'staged_sections', 'issues', 'created_at', 'updated_at'],
};

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; /* console.log('  ok -', name); */ }
  else { failed++; console.log('  FAIL -', name); }
}

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    migrations: [InitialSchema1793702244000],
    synchronize: false,
  });
  await ds.initialize();

  const qr = ds.createQueryRunner();
  const tables = async () => (await qr.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`,
  )).map((r) => r.table_name);
  const columns = async (t) => (await qr.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
    [t],
  )).map((r) => r.column_name);

  // ---- UP ----
  console.log('== migration up ==');
  await ds.runMigrations();
  const afterUp = await tables();
  for (const [table, cols] of Object.entries(EXPECTED)) {
    check(`table ${table} exists`, afterUp.includes(table));
    const actual = await columns(table);
    for (const c of cols) check(`column ${table}.${c}`, actual.includes(c));
    check(`no extra columns on ${table}`, actual.length === cols.length);
  }
  const migRows = await qr.query(`SELECT name FROM migrations`);
  check('migration recorded in migrations table',
    migRows.some((r) => r.name === 'InitialSchema1793702244000'));

  // unique constraints spot-checks (spec-critical)
  const uq = async (t) => (await qr.query(
    `SELECT conname FROM pg_constraint WHERE conrelid=$1::regclass AND contype='u'`,
    [t],
  )).map((r) => r.conname);
  check('UQ users.email', (await uq('users')).includes('UQ_users_email'));
  check('UQ tenants.slug', (await uq('tenants')).includes('UQ_tenants_slug'));
  check('UQ themes.slug', (await uq('themes')).includes('UQ_themes_slug'));
  check('UQ theme_versions(theme,version)',
    (await uq('theme_versions')).includes('UQ_theme_versions_theme_version'));
  check('UQ theme_installs(tenant,theme)',
    (await uq('theme_installs')).includes('UQ_theme_installs_tenant_theme'));
  check('UQ merchant_theme_settings.install_id',
    (await uq('merchant_theme_settings')).includes('UQ_merchant_theme_settings_install'));
  check('UQ update_stagings.install_id',
    (await uq('update_stagings')).includes('UQ_update_stagings_install'));
  check('UQ tenant_members(tenant,user)',
    (await uq('tenant_members')).includes('UQ_tenant_members_tenant_user'));
  check('UQ refresh_tokens.token_hash',
    (await uq('refresh_tokens')).includes('UQ_refresh_tokens_token_hash'));

  // idempotent re-run: second runMigrations must be a no-op
  await ds.runMigrations();
  check('re-run is a no-op', (await qr.query(`SELECT COUNT(*)::int AS n FROM migrations`))[0].n === 1);

  // ---- DOWN ----
  console.log('== migration down ==');
  await ds.undoLastMigration();
  const afterDown = await tables();
  for (const table of Object.keys(EXPECTED)) {
    check(`table ${table} dropped`, !afterDown.includes(table));
  }

  await qr.release();
  await ds.destroy();

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
