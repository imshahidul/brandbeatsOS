/**
 * Phase 5 verification — Safe Theme Update System,
 * using in-memory fake repositories (no DB needed).
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { ThemesService } = require('./dist/themes/themes.service');
const { MarketplaceService } = require('./dist/marketplace/marketplace.service');
const { TenantsService } = require('./dist/tenants/tenants.service');
const { CustomizerService } = require('./dist/customizer/customizer.service');
const { ProductsService } = require('./dist/products/products.service');
const { UpdatesService } = require('./dist/updates/updates.service');

class FakeRepo {
  constructor() { this.rows = []; this.seq = 1; }
  create(d) { return { ...d }; }
  async save(e) {
    const n = this.seq++;
    // monotonic timestamps so "latest" ordering is deterministic
    const row = { id: e.id ?? `id-${n}`, createdAt: new Date(Date.now() + n), updatedAt: new Date(Date.now() + n), publishedAt: new Date(Date.now() + n), ...e };
    const i = this.rows.findIndex((r) => r.id === row.id);
    if (i >= 0) this.rows[i] = { ...this.rows[i], ...row };
    else this.rows.push(row);
    return { ...row };
  }
  async findOne({ where, order } = {}) {
    const rows = await this.find({ where, order });
    return rows[0] ?? null;
  }
  async find({ where, order } = {}) {
    let rows = this.rows;
    if (where) rows = rows.filter((r) => Object.entries(where).every(([k, v]) => r[k] === v));
    if (order) {
      const [k, dir] = Object.entries(order)[0];
      rows = [...rows].sort((a, b) => (dir === 'DESC' ? b[k] - a[k] : a[k] - b[k]));
    }
    return rows.map((r) => ({ ...r }));
  }
  async remove(e) { this.rows = this.rows.filter((r) => r.id !== e.id); }
}

const themeDir = path.join(__dirname, '..', '..', 'themes', 'starter-fashion');
const manifest = JSON.parse(fs.readFileSync(path.join(themeDir, 'theme.json'), 'utf8'));
const configSchema = JSON.parse(fs.readFileSync(path.join(themeDir, 'config.schema.json'), 'utf8'));

const GOOD_SETTINGS = {
  brand: { primaryColor: '#111111', accentColor: '#c9a227', fontFamily: 'inter' },
  layout: { borderRadius: 'md', containerWidth: 'wide' },
};
const GOOD_SECTIONS = [
  { id: 'sec_hero_1', type: 'hero-banner', settings: { title: 'Hello' } },
];

(async () => {
  let pass = 0;
  const ok = (n) => { pass++; console.log(`  PASS ${n}`); };

  const themes = new ThemesService(new FakeRepo(), new FakeRepo());
  const tenants = new TenantsService(new FakeRepo(), new FakeRepo());

  // Shared repos so services see the same data (like a real DB would give them)
  const sharedDrafts = new FakeRepo();
  const sharedSnaps = new FakeRepo();
  const sharedInstalls = new FakeRepo();
  const sharedStagings = new FakeRepo();
  const market2 = new MarketplaceService(themes, sharedInstalls);
  const cust2 = new CustomizerService(themes, market2, tenants, new ProductsService(new FakeRepo()), sharedDrafts, sharedSnaps);
  const T = new UpdatesService(themes, market2, cust2, sharedStagings, sharedSnaps, sharedDrafts, sharedInstalls);

  // Seed: tenant, theme v1.0.0 public, install, customized + published
  const tenant = await tenants.create('user-1', { name: 'Store' });
  const theme = await themes.createTheme({ slug: 'starter-fashion', name: 'Starter Fashion' });
  await themes.publishVersion(theme.id, { version: '1.0.0', manifest, configSchema, changelog: 'First release' });
  await themes.updateTheme(theme.id, { visibility: 'public' });
  const install = await market2.installTheme(tenant.id, 'starter-fashion');
  await cust2.saveSettings(install.id, tenant.id, GOOD_SETTINGS);
  await cust2.saveSections(install.id, tenant.id, GOOD_SECTIONS);
  await cust2.publish(install.id, tenant.id);

  // v1.1.0: compatible (adds optional setting)
  const schema110 = JSON.parse(JSON.stringify(configSchema));
  schema110.properties.brand.properties.tagline = { type: 'string', maxLength: 120 };
  await themes.publishVersion(theme.id, {
    version: '1.1.0', manifest: { ...manifest, version: '1.1.0' },
    configSchema: schema110, changelog: 'Added optional tagline',
  });

  // 1. Update notifications
  {
    const avail = await T.listAvailable(tenant.id);
    assert.strictEqual(avail.length, 1);
    assert.strictEqual(avail[0].currentVersion, '1.0.0');
    assert.strictEqual(avail[0].updates[0].version, '1.1.0');
    assert.strictEqual(avail[0].updates[0].changelog, 'Added optional tagline');
    ok('listAvailable reports update with changelog');
  }

  // 2. Compatibility check: compatible
  {
    const versions = await themes.listVersions(theme.id);
    const v110 = versions.find((v) => v.version === '1.1.0');
    const report = await T.check(install.id, tenant.id, v110.id);
    assert.strictEqual(report.compatible, true);
    assert.deepStrictEqual(report.issues, []);
    assert.ok(report.schemaDiff.added.some((p) => p.includes('tagline')));
    ok('check: compatible update reported with schema diff');
  }

  // 3. Stage + apply compatible update
  {
    const versions = await themes.listVersions(theme.id);
    const v110 = versions.find((v) => v.version === '1.1.0');
    const { staging, report } = await T.stageUpdate(install.id, tenant.id, v110.id);
    assert.ok(staging.id && report.compatible);

    const { snapshot } = await T.applyStaged(install.id, tenant.id);
    assert.strictEqual(snapshot.label, 'Updated to v1.1.0');

    const updated = await market2.findInstall(install.id, tenant.id);
    assert.strictEqual(updated.activeVersionId, v110.id, 'install switched to v1.1.0');

    const snaps = await T.listSnapshots(install.id, tenant.id);
    const labels = snaps.map((s) => s.label);
    assert.ok(labels.some((l) => l && l.startsWith('Backup before Updated to v1.1.0')), 'auto-backup snapshot exists');
    ok('stage → apply: backup created, version switched, snapshot published');
  }

  // v1.2.0: BREAKING (removes accentColor)
  const schema120 = JSON.parse(JSON.stringify(schema110));
  delete schema120.properties.brand.properties.accentColor;
  schema120.properties.brand.required = schema120.properties.brand.required.filter(
    (r) => r !== 'accentColor',
  );
  await themes.publishVersion(theme.id, {
    version: '1.2.0', manifest: { ...manifest, version: '1.2.0' },
    configSchema: schema120, changelog: 'Removed accentColor (breaking)',
  });

  // 4. Compatibility check: breaking change detected
  let v120;
  {
    const versions = await themes.listVersions(theme.id);
    v120 = versions.find((v) => v.version === '1.2.0');
    const report = await T.check(install.id, tenant.id, v120.id);
    assert.strictEqual(report.compatible, false);
    assert.ok(report.issues.some((i) => i.kind === 'removed' && i.path.includes('accentColor')),
      `expected removed accentColor issue, got: ${JSON.stringify(report.issues)}`);
    ok('check: breaking change detected (removed setting flagged)');
  }

  // 5. Apply blocked while issues remain
  {
    await T.stageUpdate(install.id, tenant.id, v120.id);
    await assert.rejects(() => T.applyStaged(install.id, tenant.id), /compatibility issue/);
    ok('apply blocked while compatibility issues remain');
  }

  // 6. Fix in staging → apply succeeds
  {
    const fixed = JSON.parse(JSON.stringify(GOOD_SETTINGS));
    delete fixed.brand.accentColor;
    const { report } = await T.updateStagedSettings(install.id, tenant.id, fixed);
    assert.strictEqual(report.compatible, true, `still incompatible: ${JSON.stringify(report.issues)}`);
    const { snapshot } = await T.applyStaged(install.id, tenant.id);
    assert.strictEqual(snapshot.label, 'Updated to v1.2.0');
    const updated = await market2.findInstall(install.id, tenant.id);
    assert.strictEqual(updated.activeVersionId, v120.id);
    ok('staging fix → apply succeeds with migrated settings');
  }

  // 7. Rollback to v1.0.0
  {
    const snaps = await T.listSnapshots(install.id, tenant.id);
    const v100snap = snaps.find((s) => s.version === '1.0.0');
    assert.ok(v100snap, 'v1.0.0 snapshot exists for rollback');
    const rolled = await T.rollback(install.id, tenant.id, v100snap.id);
    assert.strictEqual(rolled.label, 'Rollback to v1.0.0');
    const updated = await market2.findInstall(install.id, tenant.id);
    const v100 = (await themes.listVersions(theme.id)).find((v) => v.version === '1.0.0');
    assert.strictEqual(updated.activeVersionId, v100.id);
    const draft = await cust2.getOrCreateDraft(install.id);
    assert.strictEqual(draft.settings.brand.accentColor, '#c9a227', 'old settings restored');
    ok('one-click rollback restores version + settings');
  }

  // 8. Auto-apply policy: compatible auto-applied, breaking skipped
  {
    await market2.setAutoUpdatePolicy(install.id, tenant.id, 'auto');
    // v1.3.0 compatible with current v1.0.0 state
    const schema130 = JSON.parse(JSON.stringify(configSchema));
    await themes.publishVersion(theme.id, {
      version: '1.3.0', manifest: { ...manifest, version: '1.3.0' },
      configSchema: schema130, changelog: 'Minor tweaks',
    });
    // v1.4.0 breaking (removes layout)
    const schema140 = JSON.parse(JSON.stringify(schema130));
    delete schema140.properties.layout;
    await themes.publishVersion(theme.id, {
      version: '1.4.0', manifest: { ...manifest, version: '1.4.0' },
      configSchema: schema140, changelog: 'Removed layout (breaking)',
    });

    const result = await T.autoApplyAll();
    // latest is 1.4.0 (breaking) → skipped; auto-apply only takes latest
    assert.strictEqual(result.applied.length, 0);
    assert.ok(result.skipped.some((s) => s.installId === install.id));
    const still = await market2.findInstall(install.id, tenant.id);
    const v100 = (await themes.listVersions(theme.id)).find((v) => v.version === '1.0.0');
    assert.strictEqual(still.activeVersionId, v100.id, 'breaking auto-update never force-applied');
    ok('auto-apply skips incompatible updates (never force-updates)');
  }

  // 9. Tenant isolation
  {
    const avail = await T.listAvailable('tenant-2');
    assert.strictEqual(avail.length, 0);
    await assert.rejects(() => T.check(install.id, 'tenant-2', v120.id), /Install not found/);
    await assert.rejects(() => T.rollback(install.id, 'tenant-2', 'x'), /Install not found/);
    ok('tenant isolation enforced on updates');
  }

  // 10. Bad targets rejected
  {
    await assert.rejects(() => T.check(install.id, tenant.id, 'nope'), /Theme version not found/);
    const versions = await themes.listVersions(theme.id);
    const v100 = versions.find((v) => v.version === '1.0.0');
    await assert.rejects(() => T.check(install.id, tenant.id, v100.id), /must be newer/);
    ok('unknown / non-newer targets rejected');
  }

  console.log(`\nALL ${pass} UPDATE SYSTEM CHECKS PASSED`);
})().catch((e) => { console.error('FAILED:', e); process.exit(1); });
