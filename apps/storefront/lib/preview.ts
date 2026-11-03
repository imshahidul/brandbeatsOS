/**
 * Preview document client + static HTML builder.
 *
 * The document shape mirrors GET /v1/customizer/installs/:installId/preview
 * exactly (see apps/api/src/customizer/customizer.service.ts getPreview):
 * tenant branding (white-label, survives theme switches), theme identity,
 * schema-validated settings, and the ordered, visible homepage sections.
 */

/** One homepage section instance from the merchant's homepage builder. */
export interface SectionInstance {
  id: string;
  type: string;
  hidden?: boolean;
  settings: Record<string, unknown>;
}

/** Theme-level settings, validated against the theme's config.schema.json. */
export interface ThemeSettings {
  brand?: {
    primaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
  };
  layout?: {
    borderRadius?: string;
    containerWidth?: string;
  };
}

export interface PreviewDocument {
  branding: {
    name: string;
    logoUrl: string | null;
    faviconUrl: string | null;
  };
  theme: {
    slug: string;
    name: string;
    version: string;
  };
  settings: ThemeSettings;
  sections: SectionInstance[];
  /** Active products of the merchant (for product rails / showcases). */
  products: ProductSummary[];
}

/** Product as embedded in the preview document. */
export interface ProductSummary {
  id: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  collection: string;
}

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

async function api<T>(path: string, token: string, tenantId?: string): Promise<T> {
  const res = await fetch(`${API_URL}/v1${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`API ${res.status} on ${path}`);
  }
  return (await res.json()) as T;
}

export function fetchPreviewDocument(
  installId: string,
  token: string,
  tenantId: string,
): Promise<PreviewDocument> {
  return api<PreviewDocument>(
    `/customizer/installs/${encodeURIComponent(installId)}/preview`,
    token,
    tenantId,
  );
}

export interface InstallSummary {
  id: string;
  themeId: string;
  activeVersionId: string;
  autoUpdatePolicy: string;
  theme?: { slug?: string; name?: string };
  activeVersion?: { version?: string };
}

export function fetchInstalls(token: string, tenantId: string): Promise<InstallSummary[]> {
  return api<InstallSummary[]>('/marketplace/installs', token, tenantId);
}

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
}

/** Tenants for the logged-in user. v0 uses the first one. */
export function fetchMyTenants(token: string): Promise<TenantSummary[]> {
  return api<TenantSummary[]>('/tenants', token);
}

export async function login(
  email: string,
  password: string,
): Promise<{ accessToken: string }> {
  const res = await fetch(`${API_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Invalid email or password');
  }
  return (await res.json()) as { accessToken: string };
}
