import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { fetchInstalls, fetchMyTenants } from '../../lib/preview';
import { fetchProducts, formatPrice } from '../../lib/products';
import {
  logoutAction,
  requireSession,
  createProductAction,
  deleteProductAction,
  uninstallThemeAction,
  setAutoUpdateAction,
  switchStoreAction,
} from '../../lib/actions';
import { AddProductForm, DeleteProductButton } from '../../components/merchant-forms';
import { UninstallButton, AutoUpdateToggle, StoreSwitcher } from '../../components/dashboard-forms';

export const dynamic = 'force-dynamic';

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: '#f4f4f5',
  fontFamily: 'system-ui, sans-serif',
};

const wrap: React.CSSProperties = { maxWidth: 1080, margin: '0 auto', padding: '32px 24px' };

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  padding: 20,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

const th: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: '#71717a',
  padding: '8px 12px',
  borderBottom: '1px solid #eee',
};

const td: React.CSSProperties = {
  fontSize: 14,
  padding: '10px 12px',
  borderBottom: '1px solid #f4f4f5',
};

export default async function DashboardPage() {
  const { token, tenantId } = await requireSession();

  let installs, products, tenants, storeName;
  try {
    [installs, products, tenants] = await Promise.all([
      fetchInstalls(token, tenantId),
      fetchProducts(token, tenantId),
      fetchMyTenants(token),
    ]);
    storeName = tenants.find((t) => t.id === tenantId)?.name ?? 'My store';
  } catch {
    redirect('/'); // token expired or invalid
  }

  const activeProducts = products.filter((p) => p.isActive);
  const collections = [...new Set(products.map((p) => p.collection))];

  const stats = [
    { label: 'Products', value: products.length, sub: `${activeProducts.length} active` },
    { label: 'Collections', value: collections.length, sub: collections.slice(0, 3).join(', ') || '—' },
    { label: 'Themes installed', value: installs.length, sub: installs[0]?.activeVersion?.version ? `v${installs[0].activeVersion.version} live` : '—' },
  ];

  return (
    <div style={page}>
      <div style={wrap}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24 }}>{storeName}</h1>
            <p style={{ margin: '4px 0 0', color: '#71717a', fontSize: 14 }}>Merchant dashboard</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <StoreSwitcher action={switchStoreAction} tenants={tenants} currentId={tenantId} />
            <Link
              href="/marketplace"
              style={{ background: '#111', color: '#fff', borderRadius: 8, padding: '8px 16px', textDecoration: 'none', fontSize: 14 }}
            >
              🎨 Browse themes
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 14 }}
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
          {stats.map((s) => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#71717a' }}>{s.label}</div>
              <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ ...card, marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Products</h2>
          {products.length === 0 ? (
            <p style={{ color: '#71717a', fontSize: 14 }}>
              No products yet — add your first one below. Products appear in your
              storefront's product rails automatically.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr>
                  <th style={th}>Product</th>
                  <th style={th}>Collection</th>
                  <th style={th}>Price</th>
                  <th style={th}>Status</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td style={{ ...td, fontWeight: 600 }}>{p.name}</td>
                    <td style={td}>{p.collection}</td>
                    <td style={td}>{formatPrice(p.price, p.currency)}</td>
                    <td style={td}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: p.isActive ? '#15803d' : '#71717a',
                          background: '#f4f4f5',
                          borderRadius: 999,
                          padding: '3px 10px',
                        }}
                      >
                        {p.isActive ? 'active' : 'hidden'}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <DeleteProductButton
                        action={deleteProductAction}
                        productId={p.id}
                        productName={p.name}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <AddProductForm action={createProductAction} />
        </div>

        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Themes</h2>
            <Link href="/marketplace" style={{ fontSize: 14, color: '#111' }}>+ Install a theme</Link>
          </div>
          {installs.length === 0 ? (
            <p style={{ color: '#71717a', fontSize: 14 }}>
              No themes installed yet. <Link href="/marketplace" style={{ color: '#111' }}>Browse the marketplace</Link> to install one.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {installs.map((i) => (
                <div key={i.id} style={{ border: '1px solid #eee', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{i.theme?.name ?? i.themeId}</div>
                  <div style={{ fontSize: 13, color: '#71717a', margin: '4px 0 12px' }}>
                    v{i.activeVersion?.version ?? '?'}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    <AutoUpdateToggle action={setAutoUpdateAction} installId={i.id} current={i.autoUpdatePolicy} />
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Link
                      href={`/preview/${i.id}`}
                      style={{ padding: '7px 12px', borderRadius: 8, background: '#111', color: '#fff', textDecoration: 'none', fontSize: 13 }}
                    >
                      Live preview
                    </Link>
                    <Link
                      href={`/customize/${i.id}`}
                      style={{ padding: '7px 12px', borderRadius: 8, background: '#eef2ff', color: '#4338ca', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
                    >
                      🎨 Customize
                    </Link>
                    <UninstallButton action={uninstallThemeAction} installId={i.id} themeName={i.theme?.name ?? i.themeId} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
