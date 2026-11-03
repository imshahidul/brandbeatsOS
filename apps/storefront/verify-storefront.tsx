/**
 * verify-storefront.ts — renders the REAL storefront components with
 * react-dom/server against a realistic preview document (starter-fashion
 * shape) and checks branding, theming, sections, sandboxing, and XSS
 * resistance. Run: npm run verify  (tsx verify-storefront.ts)
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Storefront } from './components/storefront';
import { buildSandboxedPreviewHtml } from './lib/render';
import type { PreviewDocument } from './lib/preview';

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) passed++;
  else {
    failed++;
    console.log('  FAIL -', name);
  }
}

const doc: PreviewDocument = {
  branding: {
    name: 'Shahidul Fashion House',
    logoUrl: 'https://cdn.example.com/logo.png',
    faviconUrl: 'https://cdn.example.com/favicon.ico',
  },
  theme: { slug: 'starter-fashion', name: 'Starter Fashion', version: '1.0.0' },
  settings: {
    brand: { primaryColor: '#b3123f', accentColor: '#f59e0b', fontFamily: 'playfair' },
    layout: { borderRadius: 'lg', containerWidth: 'wide' },
  },
  products: [
    { id: 'p1', name: 'Silk Panjabi', price: 1899, currency: 'BDT', imageUrl: null, collection: 'best-sellers' },
    { id: 'p2', name: 'Denim Jacket', price: 2499.5, currency: 'BDT', imageUrl: null, collection: 'best-sellers' },
    { id: 'p3', name: '<img src=x onerror=alert(1)>', price: 999, currency: 'BDT', imageUrl: 'javascript:alert(1)', collection: 'best-sellers' },
    { id: 'p4', name: 'Kurti', price: 1299, currency: 'BDT', imageUrl: null, collection: 'new-arrivals' },
  ],
  sections: [
    {
      id: 'sec-hero',
      type: 'hero-banner',
      settings: {
        title: 'Wear the moment',
        subtitle: 'Timeless pieces, honest prices.',
        eyebrow: 'New season',
        buttonLabel: 'Shop now',
        buttonLink: '/collections/new',
      },
    },
    {
      id: 'sec-rail',
      type: 'product-rail',
      settings: { heading: 'Best sellers', collection: 'best-sellers', limit: 4 },
    },
    { id: 'sec-hidden', type: 'hero-banner', hidden: true, settings: { title: 'HIDDEN TITLE' } },
    { id: 'sec-future', type: 'video-showcase', settings: {} },
  ],
};

console.log('== storefront render (preview mode) ==');
const html = renderToStaticMarkup(<Storefront doc={doc} mode="preview" />);

// White-label branding (tenant-level, survives theme switches)
check('store name rendered', html.includes('Shahidul Fashion House'));
check('logo rendered', html.includes('https://cdn.example.com/logo.png'));
// Theme settings as design tokens
check('primary color applied', html.includes('#b3123f'));
check('accent color applied', html.includes('#f59e0b'));
check('font family applied', html.includes('Playfair Display'));
check('border radius applied', html.includes('16px'));
check('container width applied', html.includes('1140px'));
// Sections
check('hero title rendered', html.includes('Wear the moment'));
check('hero button rendered', html.includes('Shop now') && html.includes('/collections/new'));
check('product rail heading rendered', html.includes('Best sellers'));
check('real product names rendered', html.includes('Silk Panjabi') && html.includes('Denim Jacket'));
check('product price formatted with ৳', html.includes('৳1,899'));
check('rail filters by collection (new-arrivals hidden)', !html.includes('Kurti'));
check('product name XSS escaped', !html.includes('<img src=x') && html.includes('&lt;img'));
check('javascript: image src blocked', !/src="javascript:/i.test(html));
check('hidden section excluded', !html.includes('HIDDEN TITLE'));
check('unknown section shows preview placeholder', html.includes('video-showcase'));

console.log('== storefront render (live mode) ==');
const liveHtml = renderToStaticMarkup(<Storefront doc={doc} mode="live" />);
check('live mode skips unknown section silently', !liveHtml.includes('video-showcase'));
check('live mode still renders hero', liveHtml.includes('Wear the moment'));

console.log('== XSS resistance ==');
const evil: PreviewDocument = {
  ...doc,
  branding: { name: '"><script>alert(1)</script>', logoUrl: null, faviconUrl: null },
  sections: [
    {
      id: 'evil',
      type: 'hero-banner',
      settings: { title: '<script>alert(2)</script>', buttonLabel: 'x', buttonLink: 'javascript:alert(3)' },
    },
  ],
};
const evilHtml = renderToStaticMarkup(<Storefront doc={evil} mode="preview" />);
check('no raw <script> in output', !evilHtml.includes('<script'));
check('script payload is escaped', evilHtml.includes('&lt;script&gt;'));
check('javascript: link sanitized', !evilHtml.includes('javascript:'));

import { readFileSync } from 'fs';
import { join } from 'path';

async function main() {
  console.log('== sandboxed page builder ==');
  const page = await buildSandboxedPreviewHtml(doc);
  check('full HTML document', page.startsWith('<!DOCTYPE html>') && page.includes('</html>'));
  check('favicon link present', page.includes('https://cdn.example.com/favicon.ico'));
  check('title has store name', page.includes('Shahidul Fashion House'));
  check('zero script tags in page', !page.includes('<script'));
  check('branding survives in page', page.includes('Shahidul Fashion House'));

  console.log('== sandbox wiring (static source checks) ==');
  const pageSrc = readFileSync(join(__dirname, 'app/preview/[installId]/page.tsx'), 'utf8');
  const routeSrc = readFileSync(join(__dirname, 'app/preview/[installId]/html/route.ts'), 'utf8');
  check('preview iframe uses empty sandbox attribute', pageSrc.includes('sandbox=""'));
  check('preview iframe does not use srcDoc', !pageSrc.includes('srcDoc'));
  check('route sends CSP sandbox header', routeSrc.includes("'Content-Security-Policy': 'sandbox;'"));

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});