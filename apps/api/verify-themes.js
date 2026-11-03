/**
 * Phase 2 verification (API side) — ThemesService publishing rules,
 * using in-memory fake repositories (no DB needed).
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { ThemesService } = require('./dist/themes/themes.service');

class FakeRepo {
  constructor() { this.rows = []; this.seq = 1; }
  create(d) { return { ...d }; }
  async save(e) {
    const row = { id: e.id ?? `id-${this.seq++}`, createdAt: new Date(), ...e };
    const i = this.rows.findIndex((r) => r.id === row.id);
    if (i >= 0) this.rows[i] = { ...this.rows[i], ...row };
    else this.rows.push(row);
    return { ...row };
  }
  async findOne({ where }) {
    return this.rows.find((r) =>
      Object.entries(where).every(([k, v]) => r[k] === v),
    ) ?? null;
  }
  async find({ where, order } = {}) {
    let rows = this.rows;
    if (where) rows = rows.filter((r) => Object.entries(where).every(([k, v]) => r[k] === v));
    return rows.map((r) => ({ ...r }));
  }
}

const themeDir = path.join(__dirname, '..', '..', 'themes', 'starter-fashion');
const manifest = JSON.parse(fs.readFileSync(path.join(themeDir, 'theme.json'), 'utf8'));
const configSchema = JSON.parse(fs.readFileSync(path.join(themeDir, 'config.schema.json'), 'utf8'));

(async () => {
  let pass = 0;
  const ok = (n) => { pass++; console.log(`  PASS ${n}`); };
  const svc = new ThemesService(new FakeRepo(), new FakeRepo());

  // 1. create theme
  const theme = await svc.createTheme({ slug: 'starter-fashion', name: 'Starter Fashion' });
  assert.ok(theme.id && theme.visibility === 'private');
  ok('createTheme creates a private theme');

  // 2. duplicate slug rejected
  await assert.rejects(() => svc.createTheme({ slug: 'starter-fashion', name: 'X' }), /already taken/);
  ok('duplicate theme slug rejected');

  // 3. bad slug rejected
  await assert.rejects(() => svc.createTheme({ slug: 'Bad Slug!', name: 'X' }), /Invalid slug/);
  ok('invalid slug rejected');

  // 4. publish valid version
  const v1 = await svc.publishVersion(theme.id, {
    version: '1.0.0',
    manifest,
    configSchema,
    changelog: 'Initial release',
  });
  assert.strictEqual(v1.status, 'published');
  assert.strictEqual(v1.minPlatformVersion, '0.1.0');
  ok('publishVersion stores immutable published version');

  // 5. duplicate version rejected (immutability)
  await assert.rejects(
    () => svc.publishVersion(theme.id, { version: '1.0.0', manifest, configSchema }),
    /immutable/,
  );
  ok('re-publishing same version rejected (immutability)');

  // 6. manifest id must match theme slug
  const wrongId = { ...manifest, id: 'other-theme', version: '1.1.0' };
  await assert.rejects(
    () => svc.publishVersion(theme.id, { version: '1.1.0', manifest: wrongId, configSchema }),
    /must match the theme slug/,
  );
  ok('manifest id / theme slug mismatch rejected');

  // 7. version must match manifest.version
  await assert.rejects(
    () => svc.publishVersion(theme.id, { version: '9.9.9', manifest, configSchema }),
    /must match manifest.version/,
  );
  ok('version / manifest.version mismatch rejected');

  // 8. invalid manifest rejected via SDK
  const badManifest = { ...manifest, version: '1.1.0' };
  delete badManifest.sections;
  await assert.rejects(
    () => svc.publishVersion(theme.id, { version: '1.1.0', manifest: badManifest, configSchema }),
    /Invalid theme manifest/,
  );
  ok('invalid manifest rejected through SDK validation');

  // 9. unknown theme rejected
  await assert.rejects(
    () => svc.publishVersion('nope', { version: '1.0.0', manifest, configSchema }),
    /Theme not found/,
  );
  ok('publishing to unknown theme rejected');

  console.log(`\nALL ${pass} THEME SERVICE CHECKS PASSED`);
})().catch((e) => { console.error('FAILED:', e); process.exit(1); });
