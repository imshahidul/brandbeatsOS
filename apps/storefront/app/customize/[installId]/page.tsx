import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { fetchDraft } from '../../../lib/customizer';
import {
  logoutAction,
  requireSession,
  saveCustomizerSettingsAction,
  saveCustomizerSectionsAction,
  publishCustomizerAction,
} from '../../../lib/actions';
import { CustomizerClient } from '../../../components/customizer-client';

export const dynamic = 'force-dynamic';

export default async function CustomizePage({
  params,
}: {
  params: Promise<{ installId: string }>;
}) {
  const { installId } = await params;
  const { token, tenantId } = await requireSession();

  let draft;
  try {
    draft = await fetchDraft(token, tenantId, installId);
  } catch {
    redirect('/dashboard');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f5', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>Customize your store</h1>
            <p style={{ margin: '4px 0 0', color: '#71717a', fontSize: 13 }}>
              <Link href="/dashboard" style={{ color: '#111' }}>← Dashboard</Link>
              {' · '}
              <Link href={`/preview/${installId}`} style={{ color: '#111' }}>Full preview</Link>
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

        <CustomizerClient
          installId={installId}
          themeName={draft.install.activeVersion ? `v${draft.install.activeVersion}` : ''}
          initialSettings={draft.settings}
          initialSections={draft.sections}
          configSchema={draft.configSchema}
          blueprints={draft.sectionsAvailable}
          saveSettingsAction={saveCustomizerSettingsAction}
          saveSectionsAction={saveCustomizerSectionsAction}
          publishAction={publishCustomizerAction}
        />
      </div>
    </div>
  );
}
