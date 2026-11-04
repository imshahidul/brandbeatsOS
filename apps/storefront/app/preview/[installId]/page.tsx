import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchPreviewDocument } from '../../../lib/preview';
import { requireSession } from '../../../lib/actions';
import { DevicePreview } from '../../../components/device-preview';

/**
 * Sandboxed live preview of a merchant's storefront.
 *
 * The preview HTML is served by the sibling route ./html (rendered to
 * static markup server-side: zero <script> tags) and embedded here in an
 * <iframe sandbox=""> — the empty sandbox attribute is the strictest
 * setting: no scripts, no forms, no popups, no same-origin access.
 * Even a malicious theme setting cannot escape it.
 */
export default async function PreviewPage({
  params,
}: {
  params: Promise<{ installId: string }>;
}) {
  const { installId } = await params;
  const { token, tenantId } = await requireSession();

  let doc;
  try {
    doc = await fetchPreviewDocument(installId, token, tenantId);
  } catch {
    notFound();
  }

  return (
    <main style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Link
          href="/dashboard"
          style={{ fontSize: 14, color: '#333', textDecoration: 'underline' }}
        >
          ← Back
        </Link>
        <h1 style={{ margin: 0, fontSize: 18 }}>
          Preview · {doc.branding.name} · {doc.theme.name} v{doc.theme.version}
        </h1>
        <Link
          href={`/customize/${installId}`}
          style={{
            marginLeft: 'auto',
            padding: '7px 14px',
            borderRadius: 8,
            background: '#eef2ff',
            color: '#4338ca',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          🎨 Customize
        </Link>
      </div>
      <DevicePreview installId={installId} />
      <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
        Sandboxed preview — the storefront runs in a fully isolated iframe
        with no script execution.
      </p>
    </main>
  );
}
