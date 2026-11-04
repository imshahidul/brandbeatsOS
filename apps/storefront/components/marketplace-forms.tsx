'use client';

import React from 'react';
import { useActionState } from 'react';
import type { ActionState } from '../lib/actions';

export function InstallThemeButton({
  action,
  slug,
  themeName,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  slug: string;
  themeName: string;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false, message: '' });
  return (
    <form action={formAction}>
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        disabled={pending}
        style={{
          background: '#111',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: 14,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        {pending ? 'Installing…' : `Install ${themeName}`}
      </button>
      {state.message && (
        <p style={{ fontSize: 12, color: state.ok ? '#15803d' : '#b91c1c', margin: '6px 0 0' }}>
          {state.message}
        </p>
      )}
    </form>
  );
}
