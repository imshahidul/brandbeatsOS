/**
 * Phase 3 verification — Marketplace + install lifecycle,
 * using in-memory fake repositories (no DB needed).
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { ThemesService } = require('./dist/themes/themes.service');
const { MarketplaceService } = require('./dist/marketplace/marketplace.service');

class FakeRepo {
  constructor() { this.rows = []; this.seq = 1; }
  create(d) { return { ...d }; }
  async save(e) {
    const row = { id: e.id ?? `id-${this.seq++}`, createdAt: new Date(), updatedAt: new Date(), ...e };
    const i = this.rows.findIndex((r) => r.id === row.id);
    if (i >= 0) this.rows[i] = { ...this.rows[i], ...row };
    else this.rows.push(row);
    return { ...row };
  }
  async findOne({ where }) {
    return this.rows.find((r) => Object.entries(where).every(([k, v]) => r[k] === v)) ?? null;
  }
  async find({ where, order } = {}) {
    let rows = this.rows;
    if (where) rows = rows.filter((r) => Object.entries(where).every(([k, v]) => r[k] === v));
    return rows.map((r) => ({ ...r }));
  }
  async remove(e) { this.rows = this.rows.filter((r) => r.id !== e.id); }
}

const themeDir = path.join(__dirname, '..', '..', 'themes', 'starter-fashion');
const manifest = JSON.parse(fs.readFileSync(path.join(themeDir, 'theme.json'), 'utf8'));
const configSchema = JSON.parse(fs.readFileSync(path.join(themeDir, 'config.schema.json'), 'utf8'));
const manifest110 = { ...manifest, version: '1.1.0' };

(async () => {
  let pass = 0;
  const ok = (n) => { pass++; console.log(`  PASS ${n}`); };

  const themes = new ThemesService(new FakeRepo(), new FakeRepo());
  const marketplace = new MarketplaceService(themes, new FakeRepo());

  // Seed: public theme with 2 published versions + private theme
  const pub = await themes.createTheme({ slug: 'starter-fashion', name: 'Starter Fashion' });
  await themes.publishVersion(pub.id, { version: '1.0.0', manifest, configSchema, changelog: 'v1' });
  await themes.publishVersion(pub.id, { version: '1.1.0', manifest: manifest110, configSchema, changelog: 'v1.1' });
  await themes.updateTheme(pub.id, { visibility: 'public' });

  const priv = await themes.createTheme({ slug: 'secret-theme', name: 'Secret' });
  await themes.publishVersion(priv.id, { version: '1.0.0', manifest: { ...manifest, id: 'secret-theme' }, configSchema });

  const T1 = 'tenant-1', T2 = 'tenant-2';

  // 1. Browse: only public theme appears
  {
    const list = await marketplace.listThemes(T1, {});
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].slug, 'starter-fashion');
    assert.strictEqual(list[0].version, '1.1.0', 'latest version shown');
    assert.strictEqual(list[0].installed, false);
    ok('browse lists only public themes with latest published version');
  }

  // 2. Filters
  {
    assert.strictEqual((await marketplace.listThemes(T1, { search: 'fashion' })).length, 1);
    assert.strictEqual((await marketplace.listThemes(T1, { search: 'nope' })).length, 0);
    assert.strictEqual((await marketplace.listThemes(T1, { category: 'fashion' })).length, 1);
    assert.strictEqual((await marketplace.listThemes(T1, { category: 'electronics' })).length, 0);
    assert.strictEqual((await marketplace.listThemes(T1, { style: 'minimal' })).length, 1);
    assert.strictEqual((await marketplace.listThemes(T1, { presentationMode: 'grid' })).length, 1);
    assert.strictEqual((await marketplace.listThemes(T1, { presentationMode: 'editorial' })).length, 0);
    ok('search / category / style / presentationMode filters work');
  }

  // 3. Install latest published version
  let install;
  {
    install = await marketplace.installTheme(T1, 'starter-fashion');
    assert.strictEqual(install.tenantId, T1);
    const versions = await themes.listVersions(pub.id);
    const latest = versions.find((v) => v.version === '1.1.0');
    assert.strictEqual(install.activeVersionId, latest.id, 'installs latest published version');
    ok('install picks latest published version');
  }

  // 4. Duplicate install rejected; private theme not installable
  {
    await assert.rejects(() => marketplace.installTheme(T1, 'starter-fashion'), /already installed/);
    await assert.rejects(() => marketplace.installTheme(T1, 'secret-theme'), /not found/i);
    await assert.rejects(() => marketplace.installTheme(T1, 'nope'), /not found/i);
    ok('duplicate install rejected; private/unknown themes not installable');
  }

  // 5. Tenant isolation on installs
  {
    const mine = await marketplace.listInstalls(T1);
    const theirs = await marketplace.listInstalls(T2);
    assert.strictEqual(mine.length, 1);
    assert.strictEqual(theirs.length, 0);
    assert.strictEqual(mine[0].activeVersion.version, '1.1.0');
    ok('tenant isolation: installs scoped per tenant');
  }

  // 6. Switch version
  {
    const versions = await themes.listVersions(pub.id);
    const v100 = versions.find((v) => v.version === '1.0.0');
    const switched = await marketplace.switchVersion(install.id, T1, v100.id);
    assert.strictEqual(switched.activeVersionId, v100.id);
    ok('switch to another published version works');
  }

  // 7. Switch to unpublished version rejected; cross-tenant switch rejected
  {
    const draft = await themes.versions.save(
      themes.versions.create({
        themeId: pub.id, version: '2.0.0-draft', manifest: manifest110,
        configSchema, status: 'draft', minPlatformVersion: '0.1.0', changelog: '',
      }),
    );
    await assert.rejects(
      () => marketplace.switchVersion(install.id, T1, draft.id),
      /not found or not published/,
    );
    const versions = await themes.listVersions(pub.id);
    const v110 = versions.find((v) => v.version === '1.1.0');
    await assert.rejects(
      () => marketplace.switchVersion(install.id, T2, v110.id),
      /Install not found/,
    );
    ok('unpublished version switch + cross-tenant switch rejected');
  }

  // 8. Auto-update policy + uninstall
  {
    const updated = await marketplace.setAutoUpdatePolicy(install.id, T1, 'auto');
    assert.strictEqual(updated.autoUpdatePolicy, 'auto');
    const res = await marketplace.uninstall(install.id, T1);
    assert.deepStrictEqual(res, { ok: true });
    assert.strictEqual((await marketplace.listInstalls(T1)).length, 0);
    ok('auto-update policy set; uninstall works');
  }

  // 9. Theme detail
  {
    await marketplace.installTheme(T1, 'starter-fashion');
    const detail = await marketplace.getThemeDetail(T1, 'starter-fashion');
    assert.strictEqual(detail.installed, true);
    assert.strictEqual(detail.versions.length, 2);
    assert.ok(detail.versions[0].manifest, 'detail includes manifest for preview');
    await assert.rejects(() => marketplace.getThemeDetail(T1, 'secret-theme'), /not found/i);
    ok('theme detail with versions; private theme hidden');
  }

  console.log(`\nALL ${pass} MARKETPLACE CHECKS PASSED`);
})().catch((e) => { console.error('FAILED:', e); process.exit(1); });
