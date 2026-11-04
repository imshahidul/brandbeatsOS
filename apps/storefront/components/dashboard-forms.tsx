'use client';

import React from 'react';
import { useActionState } from 'react';
import type { ActionState } from '../lib/actions';

const ghost: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: '7px 12px',
  fontSize: 13,
  cursor: 'pointer',
};

export function UninstallButton({
  action,
  installId,
  themeName,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  installId: string;
  themeName: string;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false, message: '' });
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`Uninstall "${themeName}"? Your published storefront will keep its last published snapshot.`)) e.preventDefault();
      }}
      style={{ display: 'inline' }}
    >
      <input type="hidden" name="id" value={installId} />
      <button type="submit" disabled={pending} style={{ ...ghost, color: '#b91c1c' }}>
        {pending ? '…' : 'Uninstall'}
      </button>
      {state.message && !state.ok && (
        <span style={{ fontSize: 12, color: '#b91c1c', marginLeft: 6 }}>{state.message}</span>
      )}
    </form>
  );
}

export function AutoUpdateToggle({
  action,
  installId,
  current,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  installId: string;
  current: string;
}) {
  const [, formAction, pending] = useActionState(action, { ok: false, message: '' });
  const next = current === 'auto' ? 'manual' : 'auto';
  return (
    <form action={formAction} style={{ display: 'inline' }} title={current === 'auto' ? 'Auto-update is ON — click to switch to manual' : 'Auto-update is OFF — click to enable'}>
      <input type="hidden" name="id" value={installId} />
      <input type="hidden" name="policy" value={next} />
      <button type="submit" disabled={pending} style={ghost}>
        {pending ? '…' : current === 'auto' ? '🔄 Auto-update: on' : '⏸ Auto-update: off'}
      </button>
    </form>
  );
}

export function StoreSwitcher({
  action,
  tenants,
  currentId,
}: {
  action: (fd: FormData) => Promise<void>;
  tenants: { id: string; name: string }[];
  currentId: string;
}) {
  if (tenants.length <= 1) return null;
  return (
    <form action={action} style={{ display: 'inline' }}>
      <select
        name="tenantId"
        defaultValue={currentId}
        onChange={(e) => e.target.form?.requestSubmit()}
        style={{
          padding: '8px 12px',
          border: '1px solid #ddd',
          borderRadius: 8,
          fontSize: 14,
          background: '#fff',
          cursor: 'pointer',
        }}
        title="Switch store"
      >
        {tenants.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </form>
  );
}
