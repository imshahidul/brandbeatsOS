/**
 * Platform admin API client (spec §7, §13).
 *
 * All calls run server-side; the JWT lives in the httpOnly `bb_token`
 * cookie. Role gating happens in lib/actions.ts `requireAdmin()` by
 * decoding the token payload — the API re-verifies on every call.
 */

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export interface AdminTheme {
  id: string;
  slug: string;
  name: string;
  visibility: 'public' | 'private' | 'deprecated';
  monetization: string;
  createdAt: string;
}

export interface AdminThemeVersion {
  id: string;
  version: string;
  changelog: string | null;
  createdAt: string;
}

export interface AdminTenant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface AutoApplyResult {
  applied: unknown[];
  skipped: unknown[];
}

async function adminApi<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status} on ${path}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

/** Decode the JWT payload (no verification — the API verifies per call). */
export function decodeRoles(token: string): string[] {
  try {
    const payload = token.split('.')[1];
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const roles = JSON.parse(json).roles;
    return Array.isArray(roles) ? roles : [];
  } catch {
    return [];
  }
}

export function isPlatformAdmin(token: string): boolean {
  return decodeRoles(token).includes('platform_admin');
}

export function fetchAdminThemes(token: string): Promise<AdminTheme[]> {
  return adminApi<AdminTheme[]>('/admin/themes', token);
}

export function fetchThemeVersions(token: string, themeId: string): Promise<AdminThemeVersion[]> {
  return adminApi<AdminThemeVersion[]>(`/admin/themes/${themeId}/versions`, token);
}

export function createTheme(
  token: string,
  data: { slug: string; name: string },
): Promise<AdminTheme> {
  return adminApi<AdminTheme>('/admin/themes', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function publishVersion(
  token: string,
  themeId: string,
  data: { version: string; manifest: unknown; configSchema: unknown; changelog?: string },
): Promise<AdminThemeVersion> {
  return adminApi<AdminThemeVersion>(`/admin/themes/${themeId}/versions`, token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function setThemeVisibility(
  token: string,
  themeId: string,
  visibility: AdminTheme['visibility'],
): Promise<AdminTheme> {
  return adminApi<AdminTheme>(`/admin/themes/${themeId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ visibility }),
  });
}

export function runAutoApply(token: string): Promise<AutoApplyResult> {
  return adminApi<AutoApplyResult>('/admin/themes/updates/auto-apply', token, {
    method: 'POST',
  });
}

export function fetchAllTenants(token: string): Promise<AdminTenant[]> {
  return adminApi<AdminTenant[]>('/admin/tenants', token);
}
