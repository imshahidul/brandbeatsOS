import React from 'react';
import type { PreviewDocument, SectionInstance, ProductSummary } from '../lib/preview';
import {
  HeroBanner,
  ProductRail,
  ShowcaseHero,
  CategoryTabs,
  UnknownSection,
  type ThemeTokens,
} from './sections';

/**
 * Assembles a full storefront from a preview document:
 * tenant branding header (white-label) + theme settings as design tokens
 * + ordered, visible homepage sections.
 */

const FONT_STACKS: Record<string, string> = {
  inter: "Inter, -apple-system, 'Segoe UI', sans-serif",
  playfair: "Playfair Display, Georgia, serif",
  'dm-sans': "'DM Sans', -apple-system, 'Segoe UI', sans-serif",
};

const CONTAINER_WIDTHS: Record<string, string> = {
  narrow: '720px',
  wide: '1140px',
  full: '100%',
};

const RADII: Record<string, string> = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '16px',
  full: '9999px',
};

function SectionRenderer({
  section,
  theme,
  mode,
  products,
}: {
  section: SectionInstance;
  theme: ThemeTokens;
  mode: 'preview' | 'live';
  products: ProductSummary[];
}) {
  switch (section.type) {
    case 'hero-banner':
      return <HeroBanner settings={section.settings} theme={theme} mode={mode} />;
    case 'product-rail':
      return <ProductRail settings={section.settings} theme={theme} mode={mode} products={products} />;
    case 'showcase-hero':
      return <ShowcaseHero settings={section.settings} theme={theme} mode={mode} products={products} />;
    case 'category-tabs':
      return <CategoryTabs settings={section.settings} theme={theme} mode={mode} />;
    default:
      return <UnknownSection type={section.type} mode={mode} />;
  }
}

export function Storefront({
  doc,
  mode,
}: {
  doc: PreviewDocument;
  mode: 'preview' | 'live';
}) {
  const brand = doc.settings.brand ?? {};
  const layout = doc.settings.layout ?? {};
  const theme: ThemeTokens = {
    primaryColor: brand.primaryColor ?? '#111111',
    accentColor: brand.accentColor ?? '#666666',
    radius: RADII[layout.borderRadius as string] ?? RADII.md,
  };
  const fontFamily = FONT_STACKS[brand.fontFamily as string] ?? FONT_STACKS.inter;
  const maxWidth = CONTAINER_WIDTHS[layout.containerWidth as string] ?? CONTAINER_WIDTHS.wide;
  const canvas = typeof brand.backgroundColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(brand.backgroundColor)
    ? brand.backgroundColor
    : '#ffffff';

  return (
    <div style={{ fontFamily, color: '#1a1a1a', background: canvas, minHeight: '100vh' }}>
      {layout.headerStyle === 'editorial' ? (
        <header
          style={{
            padding: '18px 32px',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 15, letterSpacing: 6, fontWeight: 500 }}>{doc.branding.name.toUpperCase()}</span>
          <nav style={{ display: 'flex', gap: 28 }}>
            {[
              ['Clothing', '#collection-clothing'],
              ['Accessory', '#collection-accessory'],
              ['Journal', '#'],
              ['About', '#'],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                style={{ fontSize: 10, letterSpacing: 2, color: '#555', textDecoration: 'none', textTransform: 'uppercase' }}
              >
                {label}
              </a>
            ))}
          </nav>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'flex-end', alignItems: 'center' }}>
            <span style={{ fontSize: 10, letterSpacing: 2, color: '#555', textTransform: 'uppercase' }}>Search</span>
            <span style={{ fontSize: 10, letterSpacing: 2, color: '#555', textTransform: 'uppercase' }}>Menu</span>
            <span style={{ fontSize: 14, color: '#333' }} aria-hidden>☰</span>
          </div>
        </header>
      ) : (
      <header
        style={{
          borderBottom: '1px solid #eee',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {doc.branding.logoUrl ? (
          <img
            src={doc.branding.logoUrl}
            alt={doc.branding.name}
            style={{ height: 36, width: 'auto' }}
          />
        ) : null}
        <span style={{ fontSize: 20, fontWeight: 700 }}>{doc.branding.name}</span>
      </header>
      )}

      <main style={{ maxWidth, margin: '0 auto', padding: '0 24px 48px' }}>
        {doc.sections
          .filter((s) => !s.hidden)
          .map((s) => (
            <SectionRenderer key={s.id} section={s} theme={theme} mode={mode} products={doc.products ?? []} />
          ))}
      </main>

      <footer
        style={{
          borderTop: '1px solid #eee',
          padding: '24px',
          textAlign: 'center',
          fontSize: 13,
          color: '#999',
        }}
      >
        © {doc.branding.name} · {doc.theme.name} v{doc.theme.version}
      </footer>
    </div>
  );
}
