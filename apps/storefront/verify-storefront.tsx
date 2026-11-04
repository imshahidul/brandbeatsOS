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

type ActionState = { ok: boolean; message: string };
const dummyAction = async (): Promise<ActionState> => ({ ok: false, message: '' });

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
    { id: 'p1', name: 'Silk Panjabi', price: 1899, currency: 'BDT', imageUrl: null, onBodyImageUrl: null, description: null, material: null, color: null, size: null, collection: 'best-sellers' },
    { id: 'p2', name: 'Denim Jacket', price: 2499.5, currency: 'BDT', imageUrl: null, onBodyImageUrl: null, description: null, material: null, color: null, size: null, collection: 'best-sellers' },
    { id: 'p3', name: '<img src=x onerror=alert(1)>', price: 999, currency: 'BDT', imageUrl: 'javascript:alert(1)', onBodyImageUrl: null, description: null, material: null, color: null, size: null, collection: 'best-sellers' },
    { id: 'p4', name: 'Kurti', price: 1299, currency: 'BDT', imageUrl: null, onBodyImageUrl: null, description: null, material: null, color: null, size: null, collection: 'new-arrivals' },
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

  console.log('== ORZR fashion sections ==');
  const { ShowcaseHero, CategoryTabs } = await import('./components/sections');
  const theme2 = { primaryColor: '#1c1a17', accentColor: '#a39e93', radius: '4px' };
  const orzrProducts = [
    { id: 'p1', name: 'Oversized Shirt', price: 8900, currency: 'BDT', imageUrl: null, onBodyImageUrl: null, description: 'A relaxed oversized shirt.', material: 'Cotton 100%', color: 'Black', size: '1 / 2', collection: 'clothing' },
    { id: 'p2', name: 'Pale Over Shirt', price: 9200, currency: 'BDT', imageUrl: 'https://cdn.example.com/shirt.jpg', onBodyImageUrl: null, description: null, material: null, color: null, size: null, collection: 'clothing' },
  ];
  const scHtml = renderToStaticMarkup(
    <ShowcaseHero settings={{ collection: 'clothing' }} theme={theme2} mode="preview" products={orzrProducts} />,
  );
  check('rack shows all products on hangers', scHtml.includes('Oversized Shirt') && scHtml.includes('Pale Over Shirt'));
  check('diagonal rail (no flat strip)', scHtml.includes('rotate(13deg)'));
  check('scroll/drag browse, no arrow buttons', scHtml.includes('overflow-x:auto') && !scHtml.includes('← 01') );
  check('hover/active select css', scHtml.includes('.orzr-garment:hover') && scHtml.includes('.orzr-garment:active'));
  check('hover info panel per garment', scHtml.includes('gpanel') && scHtml.includes('View product'));
  check('rack items link to product pages', scHtml.includes('#detail-p1') && scHtml.includes('#detail-p2'));
  check('product page has specs', scHtml.includes('Material') && scHtml.includes('Cotton 100%'));
  check('product page has description', scHtml.includes('relaxed oversized shirt'));
  check('product page has add to bag', scHtml.includes('#bag-p1') && scHtml.includes('Add to bag'));
  check('bag modal has total + checkout', scHtml.includes('Your bag') && scHtml.includes('Proceed to checkout'));
  check('css-only modals', scHtml.includes('orzr-modal:target'));
  const tabsHtml = renderToStaticMarkup(
    <CategoryTabs settings={{ tabs: ['clothing', 'accessory'] }} theme={theme2} mode="preview" />,
  );
  check('category tabs render links', tabsHtml.includes('#collection-clothing') && tabsHtml.includes('#collection-accessory'));
  check('category tabs labels', tabsHtml.includes('clothing') && tabsHtml.includes('accessory'));
  const tabsEmpty = renderToStaticMarkup(
    <CategoryTabs settings={{}} theme={theme2} mode="preview" />,
  );
  check('category tabs empty renders nothing', tabsEmpty === '');

  console.log('== editorial header ==');
  const { Storefront: SF2 } = await import('./components/storefront');
  const edHtml = renderToStaticMarkup(
    <SF2 doc={{ branding: { name: 'Aurora', logoUrl: null, faviconUrl: null }, theme: { slug: 'orzr-fashion', name: 'ORZR', version: '1.0.0' }, settings: { brand: { backgroundColor: '#f7f4ee' }, layout: { headerStyle: 'editorial' } }, sections: [], products: [] }} mode="preview" />,
  );
  check('editorial header has nav', edHtml.includes('CLOTHING') || edHtml.includes('Clothing'));
  check('editorial header has search/menu', edHtml.includes('Search') && edHtml.includes('Menu'));
  check('editorial header honors canvas color', edHtml.includes('#f7f4ee'));

  console.log('== merchant UI components ==');
  const { InstallThemeButton } = await import('./components/marketplace-forms');
  const { CustomizerClient } = await import('./components/customizer-client');
  const { DevicePreview } = await import('./components/device-preview');
  const { UninstallButton, AutoUpdateToggle, StoreSwitcher } = await import('./components/dashboard-forms');

  const installHtml = renderToStaticMarkup(
    <InstallThemeButton action={dummyAction} slug="starter-fashion" themeName="Starter Fashion" />,
  );
  check('install button has slug hidden input', installHtml.includes('name="slug"'));
  check('install button labels theme', installHtml.includes('Starter Fashion'));

  const czHtml = renderToStaticMarkup(
    <CustomizerClient
      installId="inst-1"
      themeName="v1.0.0"
      initialSettings={{
        brand: { primaryColor: '#b3123f', accentColor: '#f59e0b', fontFamily: 'playfair' },
        layout: { borderRadius: 'lg', containerWidth: 'wide' },
      }}
      initialSections={[
        { id: 's1', type: 'hero-banner', settings: { title: 'Hello' }, hidden: false },
      ]}
      configSchema={{
        type: 'object',
        properties: {
          brand: {
            type: 'object',
            properties: {
              primaryColor: { type: 'string' },
              fontFamily: { type: 'string', enum: ['inter', 'playfair'] },
            },
          },
          layout: {
            type: 'object',
            properties: { borderRadius: { type: 'string', enum: ['sm', 'lg'] } },
          },
        },
      }}
      blueprints={[
        { type: 'hero-banner', name: 'Hero Banner', maxInstances: null, defaultSettings: { title: '' } },
        { type: 'product-rail', name: 'Product Rail', maxInstances: 4, defaultSettings: { heading: '' } },
      ]}
      saveSettingsAction={dummyAction}
      saveSectionsAction={dummyAction}
      publishAction={dummyAction}
    />,
  );
  check('customizer renders color control', czHtml.includes('type="color"'));
  check('customizer renders enum select', czHtml.includes('<select'));
  check('customizer lists sections', czHtml.includes('Hero Banner') || czHtml.includes('hero-banner'));
  check('customizer has add-section palette', czHtml.includes('Product Rail'));
  check('customizer has save + publish', czHtml.includes('Publish storefront'));
  check('customizer embeds live preview iframe', czHtml.includes('/preview/inst-1/html'));

  const devHtml = renderToStaticMarkup(<DevicePreview installId="inst-1" />);
  check('device preview has desktop/tablet/mobile', devHtml.includes('Desktop') && devHtml.includes('Tablet') && devHtml.includes('Mobile'));

  const unHtml = renderToStaticMarkup(
    <UninstallButton action={dummyAction} installId="i-1" themeName="X" />,
  );
  check('uninstall button carries install id', unHtml.includes('name="id"'));

  const auHtml = renderToStaticMarkup(
    <AutoUpdateToggle action={dummyAction} installId="i-1" current="manual" />,
  );
  check('auto-update toggle shows current policy', auHtml.includes('Auto-update: off'));

  const swHtml = renderToStaticMarkup(
    <StoreSwitcher action={async () => {}} tenants={[{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]} currentId="a" />,
  );
  check('store switcher lists stores', swHtml.includes('<select') && swHtml.includes('>A<'));
  const swSingle = renderToStaticMarkup(
    <StoreSwitcher action={async () => {}} tenants={[{ id: 'a', name: 'A' }]} currentId="a" />,
  );
  check('store switcher hidden for single store', swSingle === '');

  console.log('== merchant page wiring (static source checks) ==');
  const mpSrc = readFileSync(join(__dirname, 'app/marketplace/page.tsx'), 'utf8');
  check('marketplace fetches themes with filters', mpSrc.includes('fetchThemes'));
  check('marketplace has search form', mpSrc.includes('name="search"'));
  check('marketplace install wired to action', mpSrc.includes('installThemeAction'));
  const czSrc = readFileSync(join(__dirname, 'app/customize/[installId]/page.tsx'), 'utf8');
  check('customize page fetches draft', czSrc.includes('fetchDraft'));
  check('customize page renders CustomizerClient', czSrc.includes('CustomizerClient'));
  const dashSrc = readFileSync(join(__dirname, 'app/dashboard/page.tsx'), 'utf8');
  check('dashboard links marketplace', dashSrc.includes('/marketplace'));
  check('dashboard links customize', dashSrc.includes('/customize/'));
  check('dashboard has uninstall', dashSrc.includes('uninstallThemeAction'));
  check('dashboard has auto-update toggle', dashSrc.includes('setAutoUpdateAction'));
  check('dashboard has store switcher', dashSrc.includes('switchStoreAction'));
  const actSrc = readFileSync(join(__dirname, 'lib/actions.ts'), 'utf8');
  check('actions: install/switch/uninstall/auto-update present',
    actSrc.includes('installThemeAction') && actSrc.includes('uninstallThemeAction') && actSrc.includes('setAutoUpdateAction'));
  check('actions: customizer save/publish present',
    actSrc.includes('saveCustomizerSettingsAction') && actSrc.includes('saveCustomizerSectionsAction') && actSrc.includes('publishCustomizerAction'));
  check('actions: store switch verifies membership', actSrc.includes('fetchMyTenants'));
  const pageSrc = readFileSync(join(__dirname, 'app/preview/[installId]/page.tsx'), 'utf8');
  const routeSrc = readFileSync(join(__dirname, 'app/preview/[installId]/html/route.ts'), 'utf8');
  check('preview iframe uses empty sandbox attribute', pageSrc.includes('sandbox=""'));
  check('preview iframe does not use srcDoc', !pageSrc.includes('srcDoc'));
  check('route sends CSP sandbox header', routeSrc.includes("'Content-Security-Policy': 'sandbox;'"));
  check('preview page has device mode switcher', pageSrc.includes('DevicePreview'));

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});