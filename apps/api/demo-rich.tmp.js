/* Rich demo: 5 sample merchants with distinct branding + sample products. */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = '/home/hatch/workspace/brand-beats-os';
const API_DIR = path.join(ROOT, 'apps/api');
const SF_DIR = path.join(ROOT, 'apps/storefront');
const DB_PASSWORD = 'bbtest';
const DB_URL = `postgres://postgres:${DB_PASSWORD}@localhost:5432/bb_demo`;
const DB_ADMIN_URL = `postgres://postgres:${DB_PASSWORD}@localhost:5432/postgres`;
const API_URL = 'http://localhost:3000';
const SF_URL = 'http://localhost:3100';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(url, timeout, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    try { const r = await fetch(url); if (r.ok) { console.log(`${label} up`); return; } }
    catch {}
    await sleep(1000);
  }
  throw new Error(`${label} did not start`);
}
async function api(method, p, token, body, tenantId) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (tenantId) headers['X-Tenant-Id'] = tenantId;
  const r = await fetch(`${API_URL}/v1${p}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await r.json().catch(() => ({}));
  if (r.status >= 400) throw new Error(`${method} ${p} -> ${r.status} ${JSON.stringify(json)}`);
  return json;
}

const MERCHANTS = [
  {
    store: 'Aurora Fashion', email: 'aurora@demo.test',
    brand: { primaryColor: '#9d174d', accentColor: '#f59e0b', fontFamily: 'playfair' },
    hero: { eyebrow: 'New Season', title: 'Wear the moment', subtitle: 'Timeless pieces, honest prices.', buttonLabel: 'Shop now' },
    products: [
      ['Oversized Shirt', 8900, 'clothing', SF_URL + '/demo/shirt-black.jpg'],
      ['Pale Over Shirt', 9200, 'clothing', SF_URL + '/demo/shirt-white.jpg'],
      ['Air Shell Blouson', 12800, 'clothing', SF_URL + '/demo/blouson-beige.jpg'],
      ['Long Wool Blouson', 14500, 'clothing', SF_URL + '/demo/blouson-gray.jpg'],
      ['Form Ring', 5200, 'accessory'],
      ['Chain Bracelet', 3800, 'accessory'],
    ],
  },
  {
    store: 'Dhaka Denim Co.', email: 'denim@demo.test',
    brand: { primaryColor: '#1e3a8a', accentColor: '#0ea5e9', fontFamily: 'inter' },
    hero: { eyebrow: 'Denim Week', title: 'Built to last', subtitle: 'Premium denim, honest craft.', buttonLabel: 'Explore' },
    products: [
      ['Slim Fit Jeans', 1999, 'best-sellers'], ['Ripped Jeans', 2199, 'best-sellers'],
      ['Denim Trucker', 2899, 'new-arrivals'], ['Mom Jeans', 1899, 'all'],
      ['Denim Shorts', 1299, 'all'], ['Selvedge Denim', 3499, 'new-arrivals'],
    ],
  },
  {
    store: 'Shundori Cosmetics', email: 'shundori@demo.test',
    brand: { primaryColor: '#be185d', accentColor: '#fb7185', fontFamily: 'dm-sans' },
    hero: { eyebrow: 'Glow Up', title: 'Beauty, redefined', subtitle: 'Clean ingredients, radiant results.', buttonLabel: 'Shop beauty' },
    products: [
      ['Matte Lipstick', 649, 'best-sellers'], ['BB Cream', 899, 'best-sellers'],
      ['Kajal Eyeliner', 349, 'all'], ['Face Serum', 1299, 'new-arrivals'],
      ['Blush Palette', 1099, 'new-arrivals'], ['Makeup Brush Set', 1599, 'all'],
    ],
  },
  {
    store: 'TechBazar', email: 'techbazar@demo.test',
    brand: { primaryColor: '#0f766e', accentColor: '#22d3ee', fontFamily: 'inter' },
    hero: { eyebrow: 'Gadget Fest', title: 'Tech you love', subtitle: 'Genuine products, warranty included.', buttonLabel: 'Shop tech' },
    products: [
      ['Wireless Earbuds', 2499, 'best-sellers'], ['Smart Watch', 3999, 'best-sellers'],
      ['Bluetooth Speaker', 1899, 'new-arrivals'], ['Power Bank 20000mAh', 1599, 'all'],
      ['Mechanical Keyboard', 4499, 'new-arrivals'], ['USB-C Hub', 1299, 'all'],
    ],
  },
  {
    store: 'Kacchi House', email: 'kacchi@demo.test',
    brand: { primaryColor: '#c2410c', accentColor: '#fbbf24', fontFamily: 'playfair' },
    hero: { eyebrow: 'Now Serving', title: 'Taste of tradition', subtitle: 'Slow-cooked, served hot.', buttonLabel: 'Order now' },
    products: [
      ['Basmati Kacchi', 280, 'best-sellers'], ['Morog Polao', 220, 'best-sellers'],
      ['Beef Tehari', 250, 'all'], ['Chicken Roast', 180, 'new-arrivals'],
      ['Firni Dessert', 120, 'all'], ['Borhani', 80, 'new-arrivals'],
    ],
  },
];

async function main() {
  console.log('== fresh database ==');
  const { Client } = require('pg');
  const admin = new Client({ connectionString: DB_ADMIN_URL });
  await admin.connect();
  await admin.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='bb_demo' AND pid <> pg_backend_pid()`);
  await admin.query(`DROP DATABASE IF EXISTS bb_demo`);
  await admin.query(`CREATE DATABASE bb_demo`);
  await admin.end();

  console.log('== boot API ==');
  const apiProc = spawn(process.execPath, ['dist/main.js'], {
    cwd: API_DIR,
    env: { ...process.env, DATABASE_URL: DB_URL, JWT_SECRET: 'demo-secret-not-for-production', NODE_ENV: 'development', PORT: '3000' },
    stdio: 'pipe',
  });
  await waitFor(`${API_URL}/v1/health`, 60000, 'API');

  const argon2 = require('argon2');
  // synchronize may still be running when /health first responds; retry.
  let pg = null;
  for (let i = 0; i < 30; i++) {
    const candidate = new Client({ connectionString: DB_URL });
    try {
      await candidate.connect();
      await candidate.query('SELECT 1 FROM users LIMIT 1');
      pg = candidate;
      break;
    } catch (e) {
      try { await candidate.end(); } catch {}
      await sleep(2000);
    }
  }
  if (!pg) throw new Error('users table never appeared');
  const { randomUUID } = require('crypto');
  const hash = await argon2.hash('AdminPass123!', { type: argon2.argon2id });
  await pg.query(`INSERT INTO users (id, email, password_hash, roles, is_active) VALUES ($1,$2,$3,'{platform_admin}',true)`, [randomUUID(), 'admin@demo.test', hash]);
  await pg.end();

  console.log('== seed platform ==');
  const adminLogin = await api('POST', '/auth/login', null, { email: 'admin@demo.test', password: 'AdminPass123!' });
  const adminTok = adminLogin.accessToken;
  const theme = await api('POST', '/admin/themes', adminTok, { slug: 'starter-fashion', name: 'Starter Fashion' });
  await api('PATCH', `/admin/themes/${theme.id}`, adminTok, { visibility: 'public' });
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'themes/starter-fashion/theme.json'), 'utf8'));
  const configSchema = JSON.parse(fs.readFileSync(path.join(ROOT, 'themes/starter-fashion/config.schema.json'), 'utf8'));
  await api('POST', `/admin/themes/${theme.id}/versions`, adminTok, { version: '1.0.0', manifest, configSchema, changelog: 'Initial release' });
  const manifest11 = { ...manifest, version: '1.1.0' };
  await api('POST', `/admin/themes/${theme.id}/versions`, adminTok, { version: '1.1.0', manifest: manifest11, configSchema, changelog: 'New section spacing options' });

  const orzr = await api('POST', '/admin/themes', adminTok, { slug: 'orzr-fashion', name: 'ORZR Fashion' });
  await api('PATCH', `/admin/themes/${orzr.id}`, adminTok, { visibility: 'public' });
  const orzrManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'themes/orzr-fashion/theme.json'), 'utf8'));
  const orzrSchema = JSON.parse(fs.readFileSync(path.join(ROOT, 'themes/orzr-fashion/config.schema.json'), 'utf8'));
  await api('POST', `/admin/themes/${orzr.id}/versions`, adminTok, { version: '1.0.0', manifest: orzrManifest, configSchema: orzrSchema, changelog: 'Editorial minimal fashion storefront' });
  console.log('  published orzr-fashion v1.0.0');

  console.log('== seed merchants ==');
  const seeded = [];
  for (const m of MERCHANTS) {
    const reg = await api('POST', '/auth/register', null, { email: m.email, password: 'MerchantPass123!', storeName: m.store });
    const tok = reg.accessToken;
    const tenantId = reg.tenant.id;
    await api('PATCH', `/tenants/${tenantId}/branding`, tok, { name: m.store }, tenantId);
    const themeSlug = m.store === 'Aurora Fashion' ? 'orzr-fashion' : 'starter-fashion';
    const inst = await api('POST', '/marketplace/installs', tok, { slug: themeSlug }, tenantId);
    if (m.store === 'Aurora Fashion') {
      await api('PUT', `/customizer/installs/${inst.id}/settings`, tok, {
        settings: {
          brand: { primaryColor: '#1c1a17', accentColor: '#a39e93', fontFamily: 'inter', backgroundColor: '#f7f4ee' },
          layout: { borderRadius: 'sm', containerWidth: 'wide' },
        },
      }, tenantId);
      await api('PUT', `/customizer/installs/${inst.id}/sections`, tok, {
        sections: [
          { id: 's1', type: 'showcase-hero', settings: { collection: 'clothing', eyebrow: 'New Drop', note: 'Scroll · Select · Explore' } },
          { id: 's2', type: 'category-tabs', settings: { tabs: ['clothing', 'accessory'] } },
          { id: 's3', type: 'product-rail', settings: { heading: 'Clothing', collection: 'clothing', limit: 8 } },
          { id: 's4', type: 'product-rail', settings: { heading: 'Accessory', collection: 'accessory', limit: 8 } },
        ],
      }, tenantId);
    } else {
      await api('PUT', `/customizer/installs/${inst.id}/settings`, tok, {
        settings: { brand: m.brand, layout: { borderRadius: 'lg', containerWidth: 'wide' } },
      }, tenantId);
      await api('PUT', `/customizer/installs/${inst.id}/sections`, tok, {
        sections: [
          { id: 's1', type: 'hero-banner', settings: { ...m.hero, buttonLink: '/collections/new' } },
          { id: 's2', type: 'product-rail', settings: { heading: 'Best sellers', collection: 'best-sellers', limit: 8 } },
          { id: 's3', type: 'product-rail', settings: { heading: 'New arrivals', collection: 'new-arrivals', limit: 4 } },
        ],
      }, tenantId);
    }
    for (const [name, price, collection, imageUrl] of m.products) {
      await api('POST', '/products', tok, { name, price, collection, ...(imageUrl ? { imageUrl } : {}) }, tenantId);
    }
    seeded.push({ store: m.store, email: m.email, installId: inst.id, products: m.products.length });
    console.log(`  seeded ${m.store} (${m.products.length} products)`);
  }

  console.log('== boot storefront ==');
  const nextBin = require.resolve('next/dist/bin/next', { paths: [SF_DIR] });
  spawn(process.execPath, [nextBin, 'start', '-p', '3100'], {
    cwd: SF_DIR, env: { ...process.env, API_URL, PORT: '3100' }, stdio: 'pipe',
  });
  await waitFor(`${SF_URL}/`, 90000, 'storefront');

  console.log('DEMO_READY');
  console.log(JSON.stringify({ admin: { email: 'admin@demo.test', password: 'AdminPass123!' }, merchants: seeded }, null, 0));
  setInterval(() => {}, 60000);
}

main().catch((e) => { console.error('DEMO_FAILED', e.message); process.exit(1); });
