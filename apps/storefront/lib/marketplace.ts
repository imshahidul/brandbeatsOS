/**
 * Theme marketplace client (server-side; JWT in httpOnly cookie).
 */
import type { InstallSummary } from './preview';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

async function mpApi<T>(
  path: string,
  token: string,
  tenantId: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Tenant-Id': tenantId,
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

export interface ThemeCard {
  id: string;
  slug: string;
  name: string;
  version: string;
  description?: string;
  categories: string[];
  styles: string[];
  presentationModes: string[];
  locales: string[];
  installed: boolean;
}

export interface ThemeFilters {
  search?: string;
  category?: string;
  style?: string;
  presentation?: string;
}

export function fetchThemes(
  token: string,
  tenantId: string,
  filters: ThemeFilters = {},
): Promise<ThemeCard[]> {
  const q = new URLSearchParams();
  if (filters.search) q.set('search', filters.search);
  if (filters.category) q.set('category', filters.category);
  if (filters.style) q.set('style', filters.style);
  if (filters.presentation) q.set('presentation', filters.presentation);
  const qs = q.toString();
  return mpApi<ThemeCard[]>(
    `/marketplace/themes${qs ? `?${qs}` : ''}`,
    token,
    tenantId,
  );
}

export function installTheme(
  token: string,
  tenantId: string,
  slug: string,
): Promise<InstallSummary> {
  return mpApi<InstallSummary>('/marketplace/installs', token, tenantId, {
    method: 'POST',
    body: JSON.stringify({ slug }),
  });
}

export function switchInstallVersion(
  token: string,
  tenantId: string,
  installId: string,
  versionId: string,
): Promise<InstallSummary> {
  return mpApi<InstallSummary>(
    `/marketplace/installs/${encodeURIComponent(installId)}/switch`,
    token,
    tenantId,
    { method: 'POST', body: JSON.stringify({ versionId }) },
  );
}

export function setAutoUpdatePolicy(
  token: string,
  tenantId: string,
  installId: string,
  policy: 'manual' | 'auto',
): Promise<InstallSummary> {
  return mpApi<InstallSummary>(
    `/marketplace/installs/${encodeURIComponent(installId)}/auto-update`,
    token,
    tenantId,
    { method: 'PATCH', body: JSON.stringify({ policy }) },
  );
}

export function uninstallTheme(
  token: string,
  tenantId: string,
  installId: string,
): Promise<{ deleted: boolean }> {
  return mpApi<{ deleted: boolean }>(
    `/marketplace/installs/${encodeURIComponent(installId)}`,
    token,
    tenantId,
    { method: 'DELETE' },
  );
}
