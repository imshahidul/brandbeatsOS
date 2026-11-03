/**
 * verify-admin.tsx — checks the platform admin dashboard (spec §7, §13):
 * role gating helpers, admin form components, and the wiring between the
 * storefront admin UI and the API admin endpoints.
 * Run: npx tsx verify-admin.tsx
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { decodeRoles, isPlatformAdmin } from './lib/admin';
import {
  CreateThemeForm,
  PublishVersionForm,
  VisibilityForm,
  AutoApplyCard,
} from './components/admin-forms';
import type { ActionState } from './lib/actions';

const ROOT = __dirname;
let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) passed++;
  else {
    failed++;
    console.log('  FAIL -', name);
  }
}

/** Craft an unsigned JWT with the given payload (decode only — never verify). */
function jwt(payload: unknown): string {
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256' })}.${b64(payload)}.sig`;
}

console.log('== role helpers ==');
const adminTok = jwt({ sub: '1', email: 'a@x.test', roles: ['platform_admin'] });
const merchantTok = jwt({ sub: '2', email: 'm@x.test', roles: ['merchant'] });
check('decodeRoles extracts roles', decodeRoles(adminTok).includes('platform_admin'));
check('isPlatformAdmin true for platform_admin', isPlatformAdmin(adminTok) === true);
check('isPlatformAdmin false for merchant', isPlatformAdmin(merchantTok) === false);
check('isPlatformAdmin false for garbage token', isPlatformAdmin('not.a.token') === false);
check('isPlatformAdmin false for missing roles', isPlatformAdmin(jwt({ sub: '3' })) === false);

console.log('== admin form components ==');
const dummy = async (): Promise<ActionState> => ({ ok: false, message: '' });

const createHtml = renderToStaticMarkup(<CreateThemeForm action={dummy} />);
check('create form has slug input', createHtml.includes('name="slug"'));
check('create form has name input', createHtml.includes('name="name"'));

const pubHtml = renderToStaticMarkup(
  <PublishVersionForm action={dummy} themeId="t-1" themeName="Starter Fashion" />,
);
check('publish form has themeId hidden input', pubHtml.includes('name="themeId"'));
check('publish form has version input', pubHtml.includes('name="version"'));
check('publish form has manifest textarea', pubHtml.includes('name="manifest"'));
check('publish form has configSchema textarea', pubHtml.includes('name="configSchema"'));

const visHtml = renderToStaticMarkup(
  <VisibilityForm action={dummy} themeId="t-1" current="private" />,
);
check('visibility form has select', visHtml.includes('name="visibility"'));
check(
  'visibility options present',
  visHtml.includes('value="public"') &&
    visHtml.includes('value="private"') &&
    visHtml.includes('value="deprecated"'),
);

const autoHtml = renderToStaticMarkup(<AutoApplyCard action={dummy} />);
check('auto-apply card has run button', autoHtml.includes('Run auto-apply now'));

console.log('== admin page wiring (static) ==');
const adminPage = readFileSync(join(ROOT, 'app/admin/page.tsx'), 'utf8');
check('admin page requires admin session', adminPage.includes('requireAdmin()'));
check('admin page lists themes', adminPage.includes('fetchAdminThemes'));
check('admin page lists versions per theme', adminPage.includes('fetchThemeVersions'));
check('admin page lists tenants', adminPage.includes('fetchAllTenants'));
check('admin page shows stats', adminPage.includes('Published versions'));
check('admin page has sign out', adminPage.includes('logoutAction'));

const actions = readFileSync(join(ROOT, 'lib/actions.ts'), 'utf8');
check('login branches platform_admin to /admin', actions.includes("redirect('/admin')"));
check('login still resolves tenant for merchants', actions.includes('fetchMyTenants'));
check('requireAdmin checks platform_admin role', actions.includes('isPlatformAdmin(token)'));
check(
  'auto-apply formats array counts',
  actions.includes('result.applied.length') && actions.includes('result.skipped.length'),
);

console.log('== API admin endpoints (static) ==');
const apiRoot = join(ROOT, '..', 'api', 'src');
const platform = readFileSync(join(apiRoot, 'admin/platform.controller.ts'), 'utf8');
check('platform controller exists', existsSync(join(apiRoot, 'admin/platform.controller.ts')));
check('GET /v1/admin/tenants route', platform.includes("@Get('tenants')"));
check('platform controller restricted to platform_admin', platform.includes("@Roles('platform_admin')"));
const adminCtrl = readFileSync(join(apiRoot, 'admin/admin.controller.ts'), 'utf8');
check('GET theme versions route', adminCtrl.includes("@Get(':id/versions')"));
const tenantsSvc = readFileSync(join(apiRoot, 'tenants/tenants.service.ts'), 'utf8');
check('tenants listAll exists', tenantsSvc.includes('async listAll()'));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
