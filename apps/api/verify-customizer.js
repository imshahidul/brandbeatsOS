/**
 * Phase 4 verification — Visual Customizer + Section Builder,
 * using in-memory fake repositories (no DB needed).
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { ThemesService } = require('./dist/themes/themes.service');
const { MarketplaceService } = require('./dist/marketplace/marketplace.service');
const { TenantsService } = require('./dist/tenants/tenants.service');
const { CustomizerService } = require('./dist/customizer/customizer.service');

class FakeRepo {
  constructor() { this.rows = []; this.seq = 1; }
  create(d) { return { ...d }; }
  async save(e) {
    const row = { id: e.id ?? `id-${this.seq++}`, createdAt: new Date(), updatedAt: new Date(), publishedAt: new Date(), ...e };
    const i = this.rows.findIndex((r) => r.id === row.id);
    if (i >= 0) this.rows[i] = { ...this.rows[i], ...row };
    else this.rows.push(row);
    return { ...row };
  }
  async findOne({ where, order } = {}) {
    let rows = this.rows;
    if (where) rows = rows.filter((r) => Object.entries(where).every(([k, v]) => r[k] === v));
    if (order) {
      const [k, dir] = Object.entries(order)[0];
      rows = [...rows].sort((a, b) => (dir === 'DESC' ? (a[k] < b[k] ? 1 : -1) : (a[k] > b[k] ? 1 : -1)));
    }
    return rows[0] ? { ...rows[0] } : null;
  }
  async find({ where, order } = {}) {
    let rows = this.rows;
    if (where) rows = rows.filter((r) => Object.entries(where).every(([k, v]) => r[k] === v));
    if (order) {
      const [k, dir] = Object.entries(order)[0];
      rows = [...rows].sort((a, b) => (dir === 'DESC' ? (a[k] < b[k] ? 1 : -1) : (a[k] > b[k] ? 1 : -1)));
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
  { id: 'sec_hero_1', type: 'hero-banner', settings: { title: 'Hello', buttonLabel: 'Shop' } },
  { id: 'sec_rail_1', type: 'product-rail', settings: { heading: 'Best sellers', limit: 8 }, hidden: true },
];

(async () => {
  let pass = 0;
  const ok = (n) => { pass++; console.log(`  PASS ${n}`); };

  const themes = new ThemesService(new FakeRepo(), new FakeRepo());
  const marketplace = new MarketplaceService(themes, new FakeRepo());
  const tenants = new TenantsService(new FakeRepo(), new FakeRepo());
  const customizer = new CustomizerService(themes, marketplace, tenants, new FakeRepo(), new FakeRepo());

  // Seed
  const tenant = await tenants.create('user-1', { name: 'My Fashion Store' });
  await tenants.updateBranding(tenant.id, { logoUrl: 'https://cdn.example.com/logo.png' });
  const theme = await themes.createTheme({ slug: 'starter-fashion', name: 'Starter Fashion' });
  await themes.publishVersion(theme.id, { version: '1.0.0', manifest, configSchema });
  await themes.updateTheme(theme.id, { visibility: 'public' });
  const install = await marketplace.installTheme(tenant.id, 'starter-fashion');

  // 1. getDraft seeds + returns editor data
  {
    const draft = await customizer.getDraft(install.id, tenant.id);
    assert.deepStrictEqual(draft.settings, {});
    assert.deepStrictEqual(draft.sections, []);
    assert.ok(draft.configSchema, 'config schema included');
    assert.strictEqual(draft.sectionsAvailable.length, 2);
    ok('getDraft seeds empty draft + returns schema for editor UI');
  }

  // 2. saveSettings valid/invalid
  {
    const saved = await customizer.saveSettings(install.id, tenant.id, GOOD_SETTINGS);
    assert.strictEqual(saved.settings.brand.fontFamily, 'inter');
    await assert.rejects(
      () => customizer.saveSettings(install.id, tenant.id, { brand: { primaryColor: 'red', accentColor: '#fff', fontFamily: 'inter' } }),
      /Invalid theme settings/,
    );
    // restore good settings for later publish test
    await customizer.saveSettings(install.id, tenant.id, GOOD_SETTINGS);
    ok('saveSettings validates colors/fonts via SDK (bad color rejected)');
  }

  // 3. saveSections: valid layout, order preserved
  {
    const saved = await customizer.saveSections(install.id, tenant.id, GOOD_SECTIONS);
    assert.strictEqual(saved.sections.length, 2);
    assert.strictEqual(saved.sections[0].id, 'sec_hero_1');
    ok('saveSections stores ordered homepage layout');
  }

  // 4. saveSections rejections
  {
    await assert.rejects(
      () => customizer.saveSections(install.id, tenant.id, [{ id: 'x', type: 'nope', settings: {} }]),
      /Unknown section type/,
    );
    await assert.rejects(
      () => customizer.saveSections(install.id, tenant.id, [
        { id: 'sec_rail_1', type: 'product-rail', settings: { heading: 'X', limit: 99 } },
      ]),
      /invalid/,
    );
    await assert.rejects(
      () => customizer.saveSections(install.id, tenant.id, [
        { id: 'dup', type: 'hero-banner', settings: { title: 'A' } },
        { id: 'dup', type: 'hero-banner', settings: { title: 'B' } },
      ]),
      /Duplicate section id/,
    );
    ok('unknown type / bad section settings / duplicate ids rejected');
  }

  // 5. maxInstances enforced (via a v1.1.0 manifest limiting hero-banner to 1)
  {
    const limited = JSON.parse(JSON.stringify(manifest));
    limited.version = '1.1.0';
    limited.sections[0].maxInstances = 1;
    await themes.publishVersion(theme.id, { version: '1.1.0', manifest: limited, configSchema });
    const versions = await themes.listVersions(theme.id);
    await marketplace.switchVersion(install.id, tenant.id, versions.find((v) => v.version === '1.1.0').id);
    await assert.rejects(
      () => customizer.saveSections(install.id, tenant.id, [
        { id: 'h1', type: 'hero-banner', settings: { title: 'A' } },
        { id: 'h2', type: 'hero-banner', settings: { title: 'B' } },
      ]),
      /Too many/,
    );
    // switch back to 1.0.0 for remaining tests
    await marketplace.switchVersion(install.id, tenant.id, versions.find((v) => v.version === '1.0.0').id);
    ok('maxInstances enforced per theme manifest');
  }

  // 6. publish validates; stricter schema in a new version blocks stale drafts
  {
    await customizer.saveSettings(install.id, tenant.id, GOOD_SETTINGS);
    await customizer.saveSections(install.id, tenant.id, GOOD_SECTIONS);
    const snap1 = await customizer.publish(install.id, tenant.id);
    assert.ok(snap1.id);

    // Theme v1.2.0 requires a new "tagline" setting
    const strictSchema = JSON.parse(JSON.stringify(configSchema));
    strictSchema.properties.brand.required.push('tagline');
    strictSchema.properties.brand.properties.tagline = { type: 'string', maxLength: 120 };
    await themes.publishVersion(theme.id, {
      version: '1.2.0',
      manifest: { ...manifest, version: '1.2.0' },
      configSchema: strictSchema,
    });
    const versions = await themes.listVersions(theme.id);
    await marketplace.switchVersion(install.id, tenant.id, versions.find((v) => v.version === '1.2.0').id);

    // Old draft is now invalid → publish blocked until merchant fixes it
    await assert.rejects(() => customizer.publish(install.id, tenant.id), /Cannot publish/);

    const fixed = JSON.parse(JSON.stringify(GOOD_SETTINGS));
    fixed.brand.tagline = 'Wear the moment';
    await customizer.saveSettings(install.id, tenant.id, fixed);
    const snap2 = await customizer.publish(install.id, tenant.id);
    assert.notStrictEqual(snap2.id, snap1.id);
    const latest = await customizer.getPublished(install.id, tenant.id);
    assert.strictEqual(latest.settings.brand.tagline, 'Wear the moment');
    ok('publish validates; stale draft blocked after schema change, then fixed');
  }

  // 7. preview assembles branding + theme + visible sections
  {
    const preview = await customizer.getPreview(install.id, tenant.id);
    assert.strictEqual(preview.branding.name, 'My Fashion Store');
    assert.strictEqual(preview.branding.logoUrl, 'https://cdn.example.com/logo.png');
    assert.strictEqual(preview.theme.slug, 'starter-fashion');
    assert.strictEqual(preview.settings.brand.accentColor, '#c9a227');
    assert.strictEqual(preview.sections.length, 1, 'hidden sections filtered');
    assert.strictEqual(preview.sections[0].id, 'sec_hero_1');
    ok('preview assembles white-label branding + settings + visible sections');
  }

  // 8. tenant isolation
  {
    await assert.rejects(() => customizer.getDraft(install.id, 'tenant-2'), /Install not found/);
    await assert.rejects(() => customizer.publish(install.id, 'tenant-2'), /Install not found/);
    ok('tenant isolation enforced on customizer');
  }

  console.log(`\nALL ${pass} CUSTOMIZER CHECKS PASSED`);
})().catch((e) => { console.error('FAILED:', e); process.exit(1); });
