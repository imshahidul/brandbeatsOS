/**
 * verify-e2e.js — FULL end-to-end test: boots the real API (PostgreSQL) and
 * the real Next.js storefront, seeds a merchant + theme + install purely
 * through HTTP, then checks the sandboxed preview serves the merchant's
 * branded storefront.
 *
 * Usage (from apps/storefront):
 *   node verify-e2e.js
 * Requires: psql + local postgres (uses database bb_e2e, recreated).
 */
const { spawn } = require('child_process');
const { setTimeout: sleep } = require('timers/promises');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const API_DIR = path.join(ROOT, 'apps/api');
const SF_DIR = __dirname;
const API_URL = 'http://localhost:3000';
const SF_URL = 'http://localhost:3100';
// Password for the local postgres superuser (CI uses 'postgres').
const DB_PASSWORD = process.env.E2E_DB_PASSWORD || 'bbtest';
const DB_URL = `postgres://postgres:${DB_PASSWORD}@localhost:5432/bb_e2e`;
const DB_ADMIN_URL = `postgres://postgres:${DB_PASSWORD}@localhost:5432/postgres`;

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) passed++;
  else {
    failed++;
    console.log('  FAIL -', name);
  }
}

async function api(method, p, token, body, tenantId) {
  const res = await fetch(`${API_URL}/v1${p}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON */
  }
  return { status: res.status, json, text };
}

function waitFor(url, timeoutMs, label) {
  const start = Date.now();
  return (async () => {
    for (;;) {
      try {
        const r = await fetch(url);
        if (r.ok || r.status === 401 || r.status === 404) return;
      } catch {
        /* not up yet */
      }
      if (Date.now() - start > timeoutMs) throw new Error(`${label} did not start in time`);
      await sleep(500);
    }
  })();
}

async function main() {
  console.log('== setup: fresh database ==');
  {
    const { Client } = require('pg');
    const admin = new Client({ connectionString: DB_ADMIN_URL });
    await admin.connect();
    // Terminate stray connections so DROP DATABASE never blocks.
    await admin.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='bb_e2e' AND pid <> pg_backend_pid()`,
    );
    await admin.query(`DROP DATABASE IF EXISTS bb_e2e`);
    await admin.query(`CREATE DATABASE bb_e2e`);
    await admin.end();
  }

  console.log('== boot API (creates schema via synchronize in dev) ==');
  const apiProc = spawn(
    process.execPath,
    ['dist/main.js'],
    {
    cwd: API_DIR,
    env: {
      ...process.env,
      DATABASE_URL: DB_URL,
      JWT_SECRET: 'e2e-test-secret-not-for-production',
      NODE_ENV: 'development',
      PORT: '3000',
    },
    stdio: 'pipe',
  });
  apiProc.on('error', (e) => console.error('API spawn error', e));
  await waitFor(`${API_URL}/v1/health`, 60000, 'API');

  // Seed a platform_admin directly (register() only creates merchants).
  const argon2 = require('argon2');
  const { Client } = require('pg');
  const pg = new Client({ connectionString: DB_URL });
  await pg.connect();
  const { randomUUID } = require('crypto');
  const adminId = randomUUID();
  const hash = await argon2.hash('AdminPass123!', { type: argon2.argon2id });
  await pg.query(
    `INSERT INTO users (id, email, password_hash, roles, is_active) VALUES ($1, $2, $3, '{platform_admin}', true)`,
    [adminId, 'admin@e2e.test', hash],
  );
  await pg.end();
  check('admin seeded', true);

  console.log('== seed via HTTP ==');
  const adminLogin = await api('POST', '/auth/login', null, {
    email: 'admin@e2e.test',
    password: 'AdminPass123!',
  });
  check('admin login', adminLogin.status === 200);
  check('admin login returns access token', !!adminLogin.json.accessToken);
  const adminTok = adminLogin.json.accessToken;

  const theme = await api('POST', '/admin/themes', adminTok, {
    slug: 'starter-fashion',
    name: 'Starter Fashion',
  });
  check('theme created', theme.status === 201);
  const themeId = theme.json.id;

  const vis = await api('PATCH', `/admin/themes/${themeId}`, adminTok, {
    visibility: 'public',
  });
  check('theme made public', vis.status === 200);

  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'themes/starter-fashion/theme.json'), 'utf8'),
  );
  const configSchema = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'themes/starter-fashion/config.schema.json'), 'utf8'),
  );
  const ver = await api('POST', `/admin/themes/${themeId}/versions`, adminTok, {
    version: '1.0.0',
    manifest,
    configSchema,
    changelog: 'Initial release',
  });
  check('version published', ver.status === 201);

  const reg = await api('POST', '/auth/register', null, {
    email: 'merchant@e2e.test',
    password: 'MerchantPass123!',
    storeName: 'E2E Test Store',
  });
  check('merchant registered', reg.status === 201);
  check('merchant register returns access token', !!reg.json.accessToken);
  const merchantTok = reg.json.accessToken;
  const tenantId = reg.json.tenant.id;

  const brand = await api('PATCH', `/tenants/${tenantId}/branding`, merchantTok, {
    name: 'E2E Test Store',
    logoUrl: 'https://cdn.example.com/logo.png',
  }, tenantId);
  check('branding set', brand.status === 200);

  const inst = await api('POST', '/marketplace/installs', merchantTok, {
    slug: 'starter-fashion',
  }, tenantId);
  check('theme installed', inst.status === 201);
  const installId = inst.json.id;

  const settings = await api(
    'PUT',
    `/customizer/installs/${installId}/settings`,
    merchantTok,
    
    {
      settings: {
        brand: { primaryColor: '#b3123f', accentColor: '#f59e0b', fontFamily: 'playfair' },
        layout: { borderRadius: 'lg', containerWidth: 'wide' },
      },
    },
    tenantId,
  );
  check('settings saved', settings.status === 200);

  const sections = await api(
    'PUT',
    `/customizer/installs/${installId}/sections`,
    merchantTok,
    {
      sections: [
        {
          id: 's1',
          type: 'hero-banner',
          settings: {
            title: 'Wear the moment',
            subtitle: 'Timeless pieces, honest prices.',
            eyebrow: 'New season',
            buttonLabel: 'Shop now',
            buttonLink: '/collections/new',
          },
        },
        {
          id: 's2',
          type: 'product-rail',
          settings: { heading: 'Best sellers', collection: 'best-sellers', limit: 4 },
        },
      ],
    },
    tenantId,
  );
  check('sections saved', sections.status === 200);

  console.log('== boot storefront ==');
  const nextBin = require.resolve('next/dist/bin/next', { paths: [SF_DIR] });
  const sfProc = spawn(process.execPath, [nextBin, 'start', '-p', '3100'], {
    cwd: SF_DIR,
    env: { ...process.env, API_URL, PORT: '3100' },
    stdio: 'pipe',
  });
  sfProc.on('error', (e) => console.error('storefront spawn error', e));
  await waitFor(`${SF_URL}/`, 90000, 'storefront');

  console.log('== storefront checks ==');
  const loginPage = await fetch(`${SF_URL}/`);
  const loginHtml = await loginPage.text();
  check('login page serves', loginPage.status === 200 && loginHtml.includes('Merchant sign in'));

  const cookie = `bb_token=${merchantTok}; bb_tenant=${tenantId}`;
  const htmlRes = await fetch(`${SF_URL}/preview/${installId}/html`, {
    headers: { Cookie: cookie },
  });
  const htmlBody = await htmlRes.text();
  check('preview html 200', htmlRes.status === 200);
  check(
    'CSP sandbox header',
    (htmlRes.headers.get('content-security-policy') || '').includes('sandbox'),
  );
  check('store name in preview', htmlBody.includes('E2E Test Store'));
  check('logo in preview', htmlBody.includes('https://cdn.example.com/logo.png'));
  check('hero title in preview', htmlBody.includes('Wear the moment'));
  check('primary color in preview', htmlBody.includes('#b3123f'));
  check('product rail in preview', htmlBody.includes('Best sellers'));
  check('no scripts in preview', !htmlBody.includes('<script'));

  const noAuth = await fetch(`${SF_URL}/preview/${installId}/html`);
  check('preview html requires auth', noAuth.status === 401);

  const pageRes = await fetch(`${SF_URL}/preview/${installId}`, {
    headers: { Cookie: cookie },
  });
  const pageHtml = await pageRes.text();
  check('preview page 200', pageRes.status === 200);
  check('preview page has sandboxed iframe', pageHtml.includes('sandbox=""'));

  const dashRes = await fetch(`${SF_URL}/dashboard`, { headers: { Cookie: cookie } });
  const dashHtml = await dashRes.text();
  check('dashboard lists install', dashRes.status === 200 && dashHtml.includes('Starter Fashion'));

  console.log('== cleanup ==');
  sfProc.kill('SIGTERM');
  apiProc.kill('SIGTERM');
  await sleep(2000);

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
