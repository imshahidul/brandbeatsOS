'use client';

import React from 'react';
import { useActionState } from 'react';
import type { ActionState } from '../lib/actions';

const input: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #ddd',
  borderRadius: 8,
  fontSize: 14,
  boxSizing: 'border-box',
};

const btn: React.CSSProperties = {
  background: '#111',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '9px 16px',
  fontSize: 14,
  cursor: 'pointer',
};

function Result({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <p style={{ fontSize: 13, color: state.ok ? '#15803d' : '#b91c1c', margin: '8px 0 0' }}>
      {state.message}
    </p>
  );
}

export function AddProductForm({
  action,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false, message: '' });
  return (
    <form action={formAction}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input name="name" placeholder="Product name" style={{ ...input, flex: '2 1 160px' }} required />
        <input name="price" placeholder="Price" type="number" min="0" step="0.01" style={{ ...input, flex: '1 1 90px' }} />
        <input name="collection" placeholder="Collection (e.g. best-sellers)" style={{ ...input, flex: '1 1 140px' }} />
        <button type="submit" style={btn} disabled={pending}>
          {pending ? 'Adding…' : 'Add product'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 13, color: '#555' }}>
        <span style={{ letterSpacing: 1, fontSize: 11, color: '#888' }}>SHOW IN:</span>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
          <input type="checkbox" name="showcaseSections" value="rail" /> Hanger Rail
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
          <input type="checkbox" name="showcaseSections" value="spotlight" /> Spotlight
        </label>
      </div>
      <Result state={state} />
    </form>
  );
}

export function DeleteProductButton({
  action,
  productId,
  productName,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  productId: string;
  productName: string;
}) {
  const [, formAction, pending] = useActionState(action, { ok: false, message: '' });
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`Delete "${productName}"?`)) e.preventDefault();
      }}
      style={{ display: 'inline' }}
    >
      <input type="hidden" name="id" value={productId} />
      <button
        type="submit"
        disabled={pending}
        style={{
          background: 'none',
          border: 'none',
          color: '#b91c1c',
          cursor: 'pointer',
          fontSize: 13,
          padding: 0,
        }}
      >
        Delete
      </button>
    </form>
  );
}
