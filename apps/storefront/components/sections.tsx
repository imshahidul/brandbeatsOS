import React from 'react';

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

export function ProductRail({ settings, theme, mode }: SectionProps) {
  const heading = str(settings.heading, 'Products');
  const collection = str(settings.collection, 'all');
  const limit = Math.min(Math.max(num(settings.limit, 4), 1), 24);

  return (
    <section style={{ margin: '24px 0' }}>
      <h2 style={{ fontSize: 26, margin: '0 0 16px' }}>{heading}</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 16,
        }}
      >
        {Array.from({ length: limit }, (_, i) => (
          <div
            key={i}
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
                background: '#f1f1f1',
                borderRadius: theme.radius,
                marginBottom: 12,
              }}
            />
            <p style={{ margin: 0, fontSize: 13, color: '#777' }}>
              {mode === 'preview'
                ? `Product ${i + 1} · ${collection}`
                : `Product ${i + 1}`}
            </p>
          </div>
        ))}
      </div>
      {mode === 'preview' && (
        <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
          Live product data appears here once the catalog is connected.
        </p>
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
