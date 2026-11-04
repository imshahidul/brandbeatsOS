'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { login, fetchMyTenants } from './preview';
import type { SectionInstance } from './preview';
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
    revalidatePath('/admin');
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
    revalidatePath('/admin');
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
    revalidatePath('/admin');
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

/* ---------------- Theme marketplace (merchant) ---------------- */

export async function installThemeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { token, tenantId } = await merchantSession();
    const slug = String(formData.get('slug') ?? '').trim();
    if (!slug) return fail('Missing theme.');
    const { installTheme } = await import('./marketplace');
    await installTheme(token, tenantId, slug);
    revalidatePath('/marketplace');
    revalidatePath('/dashboard');
    return { ok: true, message: 'Theme installed. Customize it from your dashboard.' };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Could not install theme.');
  }
}

export async function uninstallThemeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { token, tenantId } = await merchantSession();
    const id = String(formData.get('id') ?? '');
    if (!id) return fail('Missing install.');
    const { uninstallTheme } = await import('./marketplace');
    await uninstallTheme(token, tenantId, id);
    revalidatePath('/dashboard');
    revalidatePath('/marketplace');
    return { ok: true, message: 'Theme uninstalled.' };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Could not uninstall theme.');
  }
}

export async function setAutoUpdateAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { token, tenantId } = await merchantSession();
    const id = String(formData.get('id') ?? '');
    const policy = String(formData.get('policy') ?? '');
    if (!id || (policy !== 'manual' && policy !== 'auto')) return fail('Invalid input.');
    const { setAutoUpdatePolicy } = await import('./marketplace');
    await setAutoUpdatePolicy(token, tenantId, id, policy);
    revalidatePath('/dashboard');
    return { ok: true, message: `Auto-update ${policy === 'auto' ? 'enabled' : 'disabled'}.` };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Could not change update policy.');
  }
}

/* ---------------- Visual customizer (merchant) ---------------- */

function parseJsonFormField(formData: FormData, name: string): Record<string, unknown> | SectionInstance[] {
  const raw = String(formData.get(name) ?? '');
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null) throw new Error(`Invalid ${name}.`);
  return parsed as Record<string, unknown> | SectionInstance[];
}

export async function saveCustomizerSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { token, tenantId } = await merchantSession();
    const id = String(formData.get('id') ?? '');
    if (!id) return fail('Missing install.');
    const settings = parseJsonFormField(formData, 'settings') as Record<string, unknown>;
    const { saveSettings } = await import('./customizer');
    await saveSettings(token, tenantId, id, settings);
    revalidatePath(`/customize/${id}`);
    revalidatePath(`/preview/${id}`);
    return { ok: true, message: 'Design saved (draft). Publish to make it live.' };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Could not save design.');
  }
}

export async function saveCustomizerSectionsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { token, tenantId } = await merchantSession();
    const id = String(formData.get('id') ?? '');
    if (!id) return fail('Missing install.');
    const sections = parseJsonFormField(formData, 'sections') as SectionInstance[];
    const { saveSections } = await import('./customizer');
    await saveSections(token, tenantId, id, sections);
    revalidatePath(`/customize/${id}`);
    revalidatePath(`/preview/${id}`);
    return { ok: true, message: 'Homepage layout saved (draft).' };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Could not save layout.');
  }
}

export async function publishCustomizerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { token, tenantId } = await merchantSession();
    const id = String(formData.get('id') ?? '');
    if (!id) return fail('Missing install.');
    const { publishDraft } = await import('./customizer');
    await publishDraft(token, tenantId, id);
    revalidatePath(`/customize/${id}`);
    revalidatePath(`/preview/${id}`);
    revalidatePath('/dashboard');
    return { ok: true, message: 'Published! Your storefront is live with these changes.' };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Could not publish.');
  }
}

/* ---------------- Store switcher (multi-tenant merchants) ---------------- */

export async function switchStoreAction(formData: FormData): Promise<void> {
  const jar = await cookies();
  const token = jar.get('bb_token')?.value;
  if (!token) redirect('/');
  const tenantId = String(formData.get('tenantId') ?? '');
  if (!tenantId) redirect('/dashboard');
  // Verify the user actually belongs to this tenant before switching.
  const tenants = await fetchMyTenants(token).catch(() => []);
  if (!tenants.some((t) => t.id === tenantId)) redirect('/dashboard');
  jar.set('bb_tenant', tenantId, COOKIE_OPTS);
  redirect('/dashboard');
}

async function merchantSession(): Promise<{ token: string; tenantId: string }> {
  const jar = await cookies();
  const token = jar.get('bb_token')?.value;
  const tenantId = jar.get('bb_tenant')?.value;
  if (!token || !tenantId) throw new Error('Not signed in');
  return { token, tenantId };
}

export async function createProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { token, tenantId } = await merchantSession();
    const name = String(formData.get('name') ?? '').trim();
    if (!name) return fail('Product name is required.');
    const priceRaw = String(formData.get('price') ?? '').trim();
    const price = priceRaw === '' ? 0 : Number(priceRaw);
    if (!Number.isFinite(price) || price < 0) return fail('Price must be a non-negative number.');
    const { createProduct } = await import('./products');
    const showcaseSections = formData.getAll('showcaseSections').map(String).filter((s) => ['rail', 'spotlight'].includes(s));
    const p = await createProduct(token, tenantId, {
      name,
      price,
      collection: String(formData.get('collection') ?? '').trim() || undefined,
      description: String(formData.get('description') ?? '').trim() || undefined,
      showcaseSections: showcaseSections.length > 0 ? showcaseSections : undefined,
    });
    revalidatePath('/dashboard');
    return { ok: true, message: `"${p.name}" added to your catalog.` };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Could not add product.');
  }
}

export async function deleteProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { token, tenantId } = await merchantSession();
    const id = String(formData.get('id') ?? '');
    if (!id) return fail('Missing product id.');
    const { deleteProduct } = await import('./products');
    await deleteProduct(token, tenantId, id);
    revalidatePath('/dashboard');
    return { ok: true, message: 'Product deleted.' };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Could not delete product.');
  }
}
