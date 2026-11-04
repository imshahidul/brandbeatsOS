import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { fetchThemes, type ThemeCard } from '../../lib/marketplace';
import { logoutAction, requireSession, installThemeAction } from '../../lib/actions';
import { InstallThemeButton } from '../../components/marketplace-forms';

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
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};
const input: React.CSSProperties = {
  padding: '9px 12px',
  border: '1px solid #ddd',
  borderRadius: 8,
  fontSize: 14,
  background: '#fff',
};
const chip: React.CSSProperties = {
  fontSize: 11,
  background: '#f4f4f5',
  borderRadius: 999,
  padding: '3px 10px',
  color: '#52525b',
};

function ThemeTile({ theme }: { theme: ThemeCard }) {
  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 17 }}>{theme.name}</h2>
        <span style={{ fontSize: 12, color: '#71717a' }}>v{theme.version}</span>
      </div>
      {theme.description && (
        <p style={{ margin: 0, fontSize: 13, color: '#71717a', flex: 1 }}>{theme.description}</p>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {theme.categories.map((c) => (
          <span key={c} style={chip}>{c}</span>
        ))}
        {theme.styles.map((s) => (
          <span key={s} style={{ ...chip, background: '#eef2ff', color: '#4338ca' }}>{s}</span>
        ))}
      </div>
      {theme.installed ? (
        <span
          style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: '#15803d',
            background: '#f0fdf4',
            borderRadius: 8,
            padding: '8px 16px',
          }}
        >
          ✓ Installed — manage it from your dashboard
        </span>
      ) : (
        <InstallThemeButton action={installThemeAction} slug={theme.slug} themeName={theme.name} />
      )}
    </div>
  );
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; style?: string }>;
}) {
  const { token, tenantId } = await requireSession();
  const sp = await searchParams;
  const filters = {
    search: sp.search || undefined,
    category: sp.category || undefined,
    style: sp.style || undefined,
  };

  let themes: ThemeCard[];
  try {
    themes = await fetchThemes(token, tenantId, filters);
  } catch {
    redirect('/');
  }

  return (
    <div style={page}>
      <div style={wrap}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24 }}>Theme marketplace</h1>
            <p style={{ margin: '4px 0 0', color: '#71717a', fontSize: 14 }}>
              <Link href="/dashboard" style={{ color: '#111' }}>← Back to dashboard</Link>
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 14 }}
            >
              Sign out
            </button>
          </form>
        </div>

        <form
          method="get"
          style={{ ...card, flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}
        >
          <input
            name="search"
            placeholder="Search themes…"
            defaultValue={sp.search ?? ''}
            style={{ ...input, flex: '2 1 180px' }}
          />
          <input
            name="category"
            placeholder="Category (e.g. fashion)"
            defaultValue={sp.category ?? ''}
            style={{ ...input, flex: '1 1 140px' }}
          />
          <input
            name="style"
            placeholder="Style (e.g. minimal)"
            defaultValue={sp.style ?? ''}
            style={{ ...input, flex: '1 1 140px' }}
          />
          <button
            type="submit"
            style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 14, cursor: 'pointer' }}
          >
            Search
          </button>
          {(sp.search || sp.category || sp.style) && (
            <Link
              href="/marketplace"
              style={{ alignSelf: 'center', fontSize: 14, color: '#71717a' }}
            >
              Clear
            </Link>
          )}
        </form>

        {themes.length === 0 ? (
          <div style={card}>
            <p style={{ margin: 0, color: '#71717a' }}>
              No themes match your filters. Try clearing the search.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {themes.map((t) => (
              <ThemeTile key={t.id} theme={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
