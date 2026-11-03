import React from 'react';
import type { ProductSummary } from '../lib/preview';
import { formatPrice, productGradient } from '../lib/products';

/**
 * Data-driven section renderers. Every renderer is defensive:
 * - missing settings fall back to sensible defaults (never crash),
 * - all text goes through React (auto-escaped),
 * - links are allow-listed (no javascript: URLs),
 * - unknown section types degrade gracefully (preview shows a labeled
 *   placeholder, live storefronts skip them silently).
 */

export interface ThemeTokens {
  primaryColor: string;
  accentColor: string;
  radius: string;
}

export interface SectionProps {
  settings: Record<string, unknown>;
  theme: ThemeTokens;
  mode: 'preview' | 'live';
  products?: ProductSummary[];
}

const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : fallback;

const num = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

/** Only relative links and http(s) are allowed in merchant content. */
export function safeHref(v: unknown): string {
  const s = str(v, '#');
  if (s.startsWith('/') || s.startsWith('#')) return s;
  if (/^https?:\/\//i.test(s)) return s;
  return '#';
}

export function HeroBanner({ settings, theme }: SectionProps) {
  const title = str(settings.title, 'Untitled');
  const subtitle = str(settings.subtitle);
  const eyebrow = str(settings.eyebrow);
  const buttonLabel = str(settings.buttonLabel);
  const buttonLink = safeHref(settings.buttonLink);
  const image = str(settings.image);

  return (
    <section
      style={{
        padding: '72px 24px',
        textAlign: 'center',
        background: '#fafafa',
        borderRadius: theme.radius,
        margin: '24px 0',
      }}
    >
      {image && (
        <img
          src={image}
          alt=""
          style={{ maxWidth: '100%', borderRadius: theme.radius, marginBottom: 24 }}
        />
      )}
      {eyebrow && (
        <p
          style={{
            color: theme.accentColor,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            fontSize: 13,
            margin: '0 0 12px',
          }}
        >
          {eyebrow}
        </p>
      )}
      <h1 style={{ fontSize: 44, margin: '0 0 16px', lineHeight: 1.15 }}>{title}</h1>
      {subtitle && (
        <p style={{ fontSize: 18, color: '#555', margin: '0 0 28px' }}>{subtitle}</p>
      )}
      {buttonLabel && (
        <a
          href={buttonLink}
          style={{
            display: 'inline-block',
            background: theme.primaryColor,
            color: '#fff',
            padding: '14px 32px',
            borderRadius: theme.radius,
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          {buttonLabel}
        </a>
      )}
    </section>
  );
}

/** Only http(s) image URLs are rendered (API validates, this is defense in depth). */
const safeImg = (v: string | null): string | null =>
  v && /^https?:\/\//i.test(v) ? v : null;

export function ProductRail({ settings, theme, mode, products = [] }: SectionProps) {
  const heading = str(settings.heading, 'Products');
  const collection = str(settings.collection, 'all');
  const limit = Math.min(Math.max(num(settings.limit, 4), 1), 24);
  const items = products
    .filter((p) => collection === 'all' || p.collection === collection)
    .slice(0, limit);

  return (
    <section style={{ margin: '24px 0' }}>
      <h2 style={{ fontSize: 26, margin: '0 0 16px' }}>{heading}</h2>
      {items.length === 0 ? (
        <p style={{ fontSize: 13, color: '#999' }}>
          {mode === 'preview'
            ? 'Add products to this collection from your dashboard to see them here.'
            : 'No products yet.'}
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 16,
          }}
        >
          {items.map((p) => {
            const img = safeImg(p.imageUrl);
            return (
              <div
                key={p.id}
                style={{
                  border: '1px solid #e5e5e5',
                  borderRadius: theme.radius,
                  padding: 16,
                  background: '#fff',
                }}
              >
                <div
                  style={{
                    height: 120,
                    borderRadius: theme.radius,
                    marginBottom: 12,
                    background: img ? undefined : productGradient(p.name),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: 36, fontWeight: 700, color: 'rgba(0,0,0,0.25)' }}>
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>{p.name}</p>
                <p style={{ margin: 0, fontSize: 13, color: theme.primaryColor, fontWeight: 600 }}>
                  {formatPrice(p.price, p.currency)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function UnknownSection({
  type,
  mode,
}: {
  type: string;
  mode: 'preview' | 'live';
}) {
  if (mode === 'live') return null;
  return (
    <section
      style={{
        border: '2px dashed #ccc',
        borderRadius: 8,
        padding: 24,
        margin: '24px 0',
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
      }}
    >
      Unsupported section type “{type}” — the theme may be newer than this
      renderer. The live storefront skips it safely.
    </section>
  );
}
