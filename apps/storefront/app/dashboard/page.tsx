import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { fetchInstalls } from '../../lib/preview';
import { logoutAction, requireSession } from '../../lib/actions';

export default async function DashboardPage() {
  const { token, tenantId } = await requireSession();

  let installs;
  try {
    installs = await fetchInstalls(token, tenantId);
  } catch {
    redirect('/'); // token expired or invalid
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 32 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24 }}>Your themes</h1>
        <form action={logoutAction}>
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #ddd',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </form>
      </div>

      {installs.length === 0 && (
        <p style={{ color: '#666' }}>
          No themes installed yet. Install one from the marketplace to preview
          it here.
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {installs.map((i) => (
          <div
            key={i.id}
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}
          >
            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>
              {i.theme?.name ?? i.themeId}
            </h2>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: '#666' }}>
              v{i.activeVersion?.version ?? '?'} · auto-update:{' '}
              {i.autoUpdatePolicy}
            </p>
            <Link
              href={`/preview/${i.id}`}
              style={{
                display: 'inline-block',
                marginTop: 12,
                padding: '8px 16px',
                borderRadius: 8,
                background: '#111',
                color: '#fff',
                textDecoration: 'none',
                fontSize: 14,
              }}
            >
              Live preview
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
