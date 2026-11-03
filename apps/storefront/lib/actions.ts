'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { login, fetchMyTenants } from './preview';
import {
  decodeRoles,
  isPlatformAdmin,
  createTheme,
  publishVersion,
  setThemeVisibility,
  runAutoApply,
} from './admin';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 15, // matches the API's 15-minute access tokens
};

/**
 * Login: merchants need a tenant (X-Tenant-Id header); platform admins
 * have no tenant and land on the platform dashboard instead.
 */
export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const { accessToken } = await login(email, password);

  const jar = await cookies();
  jar.set('bb_token', accessToken, COOKIE_OPTS);

  if (isPlatformAdmin(accessToken)) {
    redirect('/admin');
  }

  const tenants = await fetchMyTenants(accessToken);
  if (tenants.length === 0) {
    throw new Error('No store found for this account');
  }
  // v0: single-store merchants. Multi-store switching is future work.
  jar.set('bb_tenant', tenants[0].id, COOKIE_OPTS);
  redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete('bb_token');
  jar.delete('bb_tenant');
  redirect('/');
}

/** Reads the auth cookies; redirects to login when missing. */
export async function requireSession(): Promise<{ token: string; tenantId: string }> {
  const jar = await cookies();
  const token = jar.get('bb_token')?.value;
  const tenantId = jar.get('bb_tenant')?.value;
  if (!token || !tenantId) redirect('/');
  return { token, tenantId };
}

/**
 * Platform-admin session: token cookie + platform_admin role required.
 * Non-admins are bounced to the merchant login; the API enforces the
 * role again on every call.
 */
export async function requireAdmin(): Promise<{ token: string }> {
  const jar = await cookies();
  const token = jar.get('bb_token')?.value;
  if (!token || !isPlatformAdmin(token)) redirect('/');
  return { token };
}

export interface ActionState {
  ok: boolean;
  message: string;
}

const fail = (message: string): ActionState => ({ ok: false, message });

async function adminToken(): Promise<string> {
  const jar = await cookies();
  const token = jar.get('bb_token')?.value;
  if (!token || !isPlatformAdmin(token)) throw new Error('Not authorized');
  return token;
}

function parseJsonField(raw: string, label: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
}

export async function createThemeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const token = await adminToken();
    const slug = String(formData.get('slug') ?? '').trim();
    const name = String(formData.get('name') ?? '').trim();
    if (!slug || !name) return fail('Slug and name are required.');
    const theme = await createTheme(token, { slug, name });
    return { ok: true, message: `Theme "${theme.name}" created.` };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Create failed.');
  }
}

export async function publishVersionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const token = await adminToken();
    const themeId = String(formData.get('themeId') ?? '');
    const version = String(formData.get('version') ?? '').trim();
    const changelog = String(formData.get('changelog') ?? '').trim();
    if (!themeId || !version) return fail('Version is required.');
    const manifest = parseJsonField(String(formData.get('manifest') ?? ''), 'Manifest');
    const configSchema = parseJsonField(
      String(formData.get('configSchema') ?? ''),
      'Config schema',
    );
    const v = await publishVersion(token, themeId, {
      version,
      manifest,
      configSchema,
      changelog: changelog || undefined,
    });
    return { ok: true, message: `Version ${v.version} published (immutable).` };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Publish failed.');
  }
}

export async function setVisibilityAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const token = await adminToken();
    const themeId = String(formData.get('themeId') ?? '');
    const visibility = String(formData.get('visibility') ?? '') as
      | 'public'
      | 'private'
      | 'deprecated';
    if (!themeId || !['public', 'private', 'deprecated'].includes(visibility)) {
      return fail('Invalid visibility.');
    }
    const theme = await setThemeVisibility(token, themeId, visibility);
    return { ok: true, message: `"${theme.name}" is now ${theme.visibility}.` };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Update failed.');
  }
}

export async function runAutoApplyAction(_prev: ActionState): Promise<ActionState> {
  try {
    const token = await adminToken();
    const result = await runAutoApply(token);
    return {
      ok: true,
      message: `Auto-apply finished: ${result.applied.length} applied, ${result.skipped.length} skipped (incompatible installs are never force-updated).`,
    };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Auto-apply failed.');
  }
}

// Re-exported for pages that only need the role check without a redirect.
export { decodeRoles };
