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

const slugify = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'all';

/**
 * Showcase hero (ORZR-style, v4): diagonal perspective rail.
 * Real products hang on hangers along a diagonal rail (front large,
 * receding smaller) inside a natively scrollable strip — mobile swipe /
 * desktop wheel+drag to browse, NO arrow buttons.
 * Hover (desktop) / press-and-hold (mobile, :active) pulls a garment
 * forward (scale-up + its info panel); click opens its product page
 * (CSS :target modal) with all photos, specs, price, add-to-bag.
 * Zero JavaScript.
 */
export function ShowcaseHero({ settings, theme, mode, products = [] }: SectionProps) {
  const collection = str(settings.collection, 'all');
  const items = products
    .filter((p) => collection === 'all' || p.collection === collection)
    .slice(0, 24);
  const total = String(items.length).padStart(2, '0');

  const specRow = (label: string, value: string | null) =>
    value ? (
      <div key={label} style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
        <span style={{ fontSize: 10, letterSpacing: 2, color: '#999', width: 64, textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: 11, letterSpacing: 1, color: '#555', textTransform: 'uppercase' }}>{value}</span>
      </div>
    ) : null;

  const garmentTile = (p: (typeof items)[number], height: number) => {
    const img = safeImg(p.imageUrl);
    return img ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={img} alt={p.name} style={{ height, width: 'auto', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 12px 16px rgba(0,0,0,0.14))', pointerEvents: 'none' }} draggable={false} />
    ) : (
      <div style={{ height, aspectRatio: '3 / 4', background: productGradient(p.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'rgba(0,0,0,0.2)' }}>
        {p.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  // positions along the diagonal rail: front-left large → back-right small
  const n = Math.max(items.length, 1);
  const pos = (i: number) => ({
    left: `${4 + i * (86 / n)}%`,
    top: `${10 + i * (44 / n)}%`,
    height: Math.round(360 * Math.pow(0.9, i)),
    z: 40 - i,
  });

  return (
    <section style={{ margin: '0 calc(-50vw + 50%) 40px' }}>
      <style>{`.orzr-modal{display:none;position:fixed;inset:0;z-index:200;background:#f7f4ee;overflow:auto;padding:48px 24px;box-sizing:border-box}.orzr-modal:target{display:block}.orzr-rackscroll{scrollbar-width:thin;scrollbar-color:#c9c2b4 transparent;cursor:grab}.orzr-rackscroll::-webkit-scrollbar{height:6px}.orzr-rackscroll::-webkit-scrollbar-thumb{background:#c9c2b4;border-radius:3px}.orzr-garment{transition:transform .25s ease;transform-origin:center 20%}.orzr-garment:hover,.orzr-garment:active{transform:scale(1.3);z-index:100!important}.orzr-garment .gpanel{display:none}.orzr-garment:hover .gpanel,.orzr-garment:active .gpanel{display:block}`}</style>

      {/* ---------- the rack: diagonal rail, natively scrollable ---------- */}
      <div style={{ background: 'linear-gradient(180deg, #f1ece2, #f7f4ee)', padding: '28px 0 20px' }}>
        <p style={{ textAlign: 'center', margin: '0 0 8px', fontSize: 11, letterSpacing: 4, color: '#8a8478', textTransform: 'uppercase' }}>
          {collection} — {total} pieces
        </p>
        <div className="orzr-rackscroll" style={{ overflowX: 'auto', overflowY: 'hidden' }}>
          <div style={{ position: 'relative', width: `${Math.max(140, n * 22)}%`, height: 560 }}>
            {/* diagonal rail */}
            <div style={{ position: 'absolute', left: '-4%', top: '9%', width: '112%', height: 6, background: 'linear-gradient(180deg, #9a9a9a, #5a5a5a)', borderRadius: 3, transform: 'rotate(13deg)', transformOrigin: 'left center' }} />
            {/* garments on hangers along the rail */}
            {items.map((p, i) => {
              const pp = pos(i);
              return (
                <a
                  key={p.id}
                  href={`#detail-${p.id}`}
                  className="orzr-garment"
                  style={{ position: 'absolute', left: pp.left, top: pp.top, zIndex: pp.z, textDecoration: 'none', color: 'inherit', textAlign: 'center', display: 'block' }}
                >
                  <svg width="26" height="30" viewBox="0 0 26 30" style={{ display: 'block', margin: '0 auto' }}>
                    <path d="M13 30 C13 22, 13 20, 7 16 M13 20 C13 16, 13 12, 13 10 A4 4 0 1 1 17 10" stroke="#3a3a3a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
                  </svg>
                  {garmentTile(p, pp.height)}
                  {/* info panel: appears on hover / press-and-hold */}
                  <div className="gpanel" style={{ position: 'absolute', left: '105%', top: '12%', width: 220, textAlign: 'left', background: 'rgba(247,244,238,0.94)', border: '1px solid #e5e0d8', padding: '14px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}>
                    <p style={{ margin: '0 0 6px', fontSize: 10, letterSpacing: 2, color: '#999' }}>{String(i + 1).padStart(2, '0')} / {total}</p>
                    <p style={{ margin: '0 0 6px', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase', color: '#1c1a17' }}>{p.name}</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{formatPrice(p.price, p.currency)}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 10, letterSpacing: 2, color: '#1c1a17', textTransform: 'uppercase', textDecoration: 'underline', textUnderlineOffset: 3 }}>View product ↗</p>
                  </div>
                </a>
              );
            })}
            {items.length === 0 && (
              <p style={{ position: 'absolute', left: '50%', top: '40%', transform: 'translateX(-50%)', color: '#999', fontSize: 13 }}>
                {mode === 'preview' ? 'Add products to fill the rack.' : 'No products yet.'}
              </p>
            )}
          </div>
        </div>
        <p style={{ textAlign: 'center', margin: '10px 0 0', fontSize: 10, letterSpacing: 3, color: '#aaa', textTransform: 'uppercase' }}>
          ← drag / scroll to browse · hover a garment ·
        </p>
      </div>

      {/* ---------- product pages (CSS :target modals) ---------- */}
      {items.map((p, i) => {
        const onBody = safeImg(p.onBodyImageUrl);
        return (
          <div key={p.id} id={`detail-${p.id}`} className="orzr-modal">
            <div style={{ maxWidth: 1080, margin: '0 auto' }}>
              <a
                href="#"
                style={{ display: 'inline-block', marginBottom: 24, fontSize: 11, letterSpacing: 2, color: '#1c1a17', textDecoration: 'none', textTransform: 'uppercase' }}
              >
                ← Back to the rack ×
              </a>
              <div style={{ display: 'grid', gridTemplateColumns: onBody ? '1fr 1fr 1fr' : '1fr 1fr', gap: 40, alignItems: 'start' }}>
                <div>
                  {garmentTile(p, 420)}
                  {onBody && (
                    <div style={{ marginTop: 16 }}>
                      <p style={{ margin: '0 0 8px', fontSize: 10, letterSpacing: 2, color: '#999', textTransform: 'uppercase' }}>On body</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={onBody} alt={`${p.name} on body`} style={{ width: '100%', height: 'auto', maxHeight: 320, objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
                <div>
                  <p style={{ margin: '0 0 10px', fontSize: 11, letterSpacing: 2, color: '#888' }}>
                    {String(i + 1).padStart(2, '0')} / {total}
                  </p>
                  <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 400, letterSpacing: 4, textTransform: 'uppercase', lineHeight: 1.5 }}>{p.name}</h2>
                  {p.description && <p style={{ margin: '0 0 16px', fontSize: 13, lineHeight: 1.7, color: '#666' }}>{p.description}</p>}
                  <div style={{ marginBottom: 16 }}>
                    {specRow('Material', p.material)}
                    {specRow('Color', p.color)}
                    {specRow('Size', p.size)}
                  </div>
                  <p style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 500 }}>{formatPrice(p.price, p.currency)}</p>
                  <a
                    href={`#bag-${p.id}`}
                    style={{ display: 'inline-block', background: '#1c1a17', color: '#f7f4ee', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', textDecoration: 'none', padding: '14px 36px', borderRadius: 2 }}
                  >
                    Add to bag
                  </a>
                </div>
                <div>
                  <p style={{ margin: '0 0 10px', fontSize: 10, letterSpacing: 2, color: '#999', textTransform: 'uppercase' }}>Details</p>
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.8, color: '#777' }}>
                    Part of the {collection} collection.
                    <br />Free returns within 14 days.
                    <br />Ships in 2–3 days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* ---------- bag (CSS :target) ---------- */}
      {items.map((p) => (
        <div key={p.id} id={`bag-${p.id}`} className="orzr-modal">
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <a
              href={`#detail-${p.id}`}
              style={{ display: 'inline-block', marginBottom: 24, fontSize: 11, letterSpacing: 2, color: '#1c1a17', textDecoration: 'none', textTransform: 'uppercase' }}
            >
              ← Back ×
            </a>
            <h2 style={{ margin: '0 0 24px', fontSize: 20, letterSpacing: 4, textTransform: 'uppercase', fontWeight: 400 }}>Your bag (1)</h2>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', borderTop: '1px solid #e5e0d8', borderBottom: '1px solid #e5e0d8', padding: '16px 0', marginBottom: 20 }}>
              <div style={{ width: 72 }}>{garmentTile(p, 90)}</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}>{p.name}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#888' }}>Qty 1</p>
              </div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>{formatPrice(p.price, p.currency)}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <span style={{ fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: '#777' }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 600 }}>{formatPrice(p.price, p.currency)}</span>
            </div>
            <span
              style={{ display: 'block', textAlign: 'center', background: '#1c1a17', color: '#f7f4ee', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', padding: '16px', borderRadius: 2 }}
            >
              Proceed to checkout
            </span>
            <p style={{ marginTop: 12, fontSize: 11, color: '#999', textAlign: 'center' }}>
              Secure checkout — payment gateway connects at launch.
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}

/**
 * Category tabs (ORZR-style): minimal anchor tabs jumping to collection
 * rails on the page. Works without scripts via #fragment links.
 */
export function CategoryTabs({ settings }: SectionProps) {
  const raw = settings.tabs;
  const tabs: string[] = Array.isArray(raw)
    ? raw.filter((t): t is string => typeof t === 'string' && t.length > 0).slice(0, 6)
    : [];
  if (tabs.length === 0) return null;
  return (
    <nav style={{ margin: '32px 0', borderTop: '1px solid #e5e0d8', borderBottom: '1px solid #e5e0d8', padding: '14px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
        {tabs.map((t, i) => (
          <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && <span style={{ color: '#ccc' }}>/</span>}
            <a
              href={`#collection-${slugify(t)}`}
              style={{ fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: '#1c1a17', textDecoration: 'none' }}
            >
              {t}
            </a>
          </span>
        ))}
      </div>
    </nav>
  );
}

export function ProductRail({ settings, theme, mode, products = [] }: SectionProps) {
  const heading = str(settings.heading, 'Products');
  const collection = str(settings.collection, 'all');
  const limit = Math.min(Math.max(num(settings.limit, 4), 1), 24);
  const items = products
    .filter((p) => collection === 'all' || p.collection === collection)
    .slice(0, limit);

  return (
    <section id={`collection-${slugify(collection)}`} style={{ margin: '24px 0' }}>
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
