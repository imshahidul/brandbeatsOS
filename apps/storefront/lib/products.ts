/**
 * Merchant product catalog client (server-side; JWT in httpOnly cookie).
 */
import type { ProductSummary } from './preview';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

async function productApi<T>(
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

export interface Product extends ProductSummary {
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export function fetchProducts(token: string, tenantId: string): Promise<Product[]> {
  return productApi<Product[]>('/products', token, tenantId);
}

export function createProduct(
  token: string,
  tenantId: string,
  data: {
    name: string;
    price?: number;
    collection?: string;
    description?: string;
    isActive?: boolean;
    showcaseSections?: string[];
  },
): Promise<Product> {
  return productApi<Product>('/products', token, tenantId, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteProduct(
  token: string,
  tenantId: string,
  id: string,
): Promise<{ deleted: boolean }> {
  return productApi<{ deleted: boolean }>(
    `/products/${encodeURIComponent(id)}`,
    token,
    tenantId,
    { method: 'DELETE' },
  );
}

/** Format a price for display, e.g. 1299.5 + "BDT" -> "৳1,299.50". */
export function formatPrice(price: number, currency: string): string {
  const symbols: Record<string, string> = { BDT: '৳', USD: '$', EUR: '€', GBP: '£', INR: '₹' };
  const symbol = symbols[currency?.toUpperCase()] ?? `${currency} `;
  const n = Number(price);
  if (!Number.isFinite(n)) return `${symbol}0`;
  return `${symbol}${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
}

/** Deterministic pastel gradient for products without an image. */
export function productGradient(name: string): string {
  const palettes = [
    ['#fce7f3', '#f9a8d4'],
    ['#e0e7ff', '#a5b4fc'],
    ['#fef3c7', '#fcd34d'],
    ['#d1fae5', '#6ee7b7'],
    ['#ffe4e6', '#fda4af'],
    ['#e0f2fe', '#7dd3fc'],
  ];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 997;
  const [a, b] = palettes[h % palettes.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}
