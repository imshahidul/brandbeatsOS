/**
 * Phase 2 verification — Theme Framework SDK.
 * Validates the real sample theme and all rejection paths.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  validateManifest,
  validateSettings,
  sectionTypes,
  findSection,
} = require('./dist/index.js');

const themeDir = path.join(__dirname, '..', '..', 'themes', 'starter-fashion');
const manifest = JSON.parse(fs.readFileSync(path.join(themeDir, 'theme.json'), 'utf8'));
const configSchema = JSON.parse(fs.readFileSync(path.join(themeDir, 'config.schema.json'), 'utf8'));

let pass = 0;
const ok = (name) => { pass++; console.log(`  PASS ${name}`); };

// 1. Real sample theme manifest validates
{
  const r = validateManifest(manifest);
  assert.ok(r.ok, `sample theme should validate: ${r.errors.join('; ')}`);
  ok('sample theme.json validates');
}

// 2. Missing required field rejected
{
  const bad = { ...manifest };
  delete bad.version;
  const r = validateManifest(bad);
  assert.ok(!r.ok && r.errors.some((e) => e.includes('version')));
  ok('manifest missing version rejected');
}

// 3. Bad semver rejected
{
  const r = validateManifest({ ...manifest, version: '1.0' });
  assert.ok(!r.ok);
  ok('manifest with bad semver rejected');
}

// 4. Unknown presentation mode rejected
{
  const r = validateManifest({ ...manifest, presentationModes: ['teleport'] });
  assert.ok(!r.ok);
  ok('manifest with unknown presentation mode rejected');
}

// 5. Duplicate section types rejected
{
  const dup = JSON.parse(JSON.stringify(manifest));
  dup.sections.push({ ...dup.sections[0] });
  const r = validateManifest(dup);
  assert.ok(!r.ok && r.errors.some((e) => e.includes('duplicate type')));
  ok('manifest with duplicate section types rejected');
}

// 6. Section defaultSettings violating its own schema rejected
{
  const bad = JSON.parse(JSON.stringify(manifest));
  bad.sections[1].defaultSettings.limit = 99; // max 24
  const r = validateManifest(bad);
  assert.ok(!r.ok && r.errors.some((e) => e.includes('product-rail')));
  ok('section defaultSettings violating its schema rejected');
}

// 7. Valid merchant settings accepted
{
  const settings = {
    brand: { primaryColor: '#111111', accentColor: '#c9a227', fontFamily: 'inter' },
    layout: { borderRadius: 'md', containerWidth: 'wide' },
  };
  const r = validateSettings(configSchema, settings);
  assert.ok(r.ok, r.errors.join('; '));
  ok('valid merchant settings accepted');
}

// 8. Invalid merchant settings rejected with paths
{
  const settings = {
    brand: { primaryColor: 'red', accentColor: '#c9a227', fontFamily: 'comic-sans' },
  };
  const r = validateSettings(configSchema, settings);
  assert.ok(!r.ok && r.errors.length >= 2);
  assert.ok(r.errors.some((e) => e.includes('primaryColor')));
  ok('invalid merchant settings rejected (bad color + bad font)');
}

// 9. Helpers
{
  assert.deepStrictEqual(sectionTypes(manifest), ['hero-banner', 'product-rail']);
  assert.strictEqual(findSection(manifest, 'hero-banner').name, 'Hero banner');
  assert.strictEqual(findSection(manifest, 'nope'), undefined);
  ok('sectionTypes / findSection helpers work');
}

console.log(`\nALL ${pass} THEME SDK CHECKS PASSED`);
