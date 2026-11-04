/**
 * Visual customizer client (server-side; JWT in httpOnly cookie).
 */
import type { SectionInstance } from './preview';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

async function czApi<T>(
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
    throw new Error(`API ${res.status} on ${path}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

/** A section type the theme offers, with its defaults. */
export interface SectionBlueprint {
  type: string;
  name: string;
  description?: string;
  maxInstances: number | null;
  defaultSettings: Record<string, unknown>;
}

export interface CustomizerDraft {
  install: { id: string; themeId: string; activeVersion: string };
  settings: Record<string, unknown>;
  sections: SectionInstance[];
  /** The theme's config.schema.json — drives the visual controls. */
  configSchema: Record<string, unknown>;
  sectionsAvailable: SectionBlueprint[];
  updatedAt: string;
}

export function fetchDraft(
  token: string,
  tenantId: string,
  installId: string,
): Promise<CustomizerDraft> {
  return czApi<CustomizerDraft>(
    `/customizer/installs/${encodeURIComponent(installId)}`,
    token,
    tenantId,
  );
}

export function saveSettings(
  token: string,
  tenantId: string,
  installId: string,
  settings: Record<string, unknown>,
): Promise<{ ok: boolean }> {
  return czApi<{ ok: boolean }>(
    `/customizer/installs/${encodeURIComponent(installId)}/settings`,
    token,
    tenantId,
    { method: 'PUT', body: JSON.stringify({ settings }) },
  );
}

export function saveSections(
  token: string,
  tenantId: string,
  installId: string,
  sections: SectionInstance[],
): Promise<{ ok: boolean }> {
  return czApi<{ ok: boolean }>(
    `/customizer/installs/${encodeURIComponent(installId)}/sections`,
    token,
    tenantId,
    { method: 'PUT', body: JSON.stringify({ sections }) },
  );
}

export function publishDraft(
  token: string,
  tenantId: string,
  installId: string,
): Promise<{ id: string }> {
  return czApi<{ id: string }>(
    `/customizer/installs/${encodeURIComponent(installId)}/publish`,
    token,
    tenantId,
    { method: 'POST' },
  );
}
