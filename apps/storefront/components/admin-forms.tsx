'use client';

import React from 'react';
import { useActionState } from 'react';
import type { ActionState } from '../lib/actions';

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  padding: 20,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

const input: React.CSSProperties = {
  width: '100%',
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

const btnSmall: React.CSSProperties = { ...btn, padding: '6px 12px', fontSize: 13 };

function Result({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <p style={{ fontSize: 13, color: state.ok ? '#15803d' : '#b91c1c', margin: '8px 0 0' }}>
      {state.message}
    </p>
  );
}

function useAdminForm(action: (prev: ActionState, fd: FormData) => Promise<ActionState>) {
  return useActionState(action, { ok: false, message: '' });
}

export function CreateThemeForm({
  action,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useAdminForm(action);
  return (
    <div style={card}>
      <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>New theme</h3>
      <form action={formAction} style={{ display: 'grid', gap: 10 }}>
        <input name="slug" placeholder="slug, e.g. minimal-shop" style={input} required />
        <input name="name" placeholder="Display name" style={input} required />
        <div>
          <button type="submit" style={btn} disabled={pending}>
            {pending ? 'Creating…' : 'Create theme'}
          </button>
        </div>
        <Result state={state} />
      </form>
    </div>
  );
}

export function PublishVersionForm({
  action,
  themeId,
  themeName,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  themeId: string;
  themeName: string;
}) {
  const [state, formAction, pending] = useAdminForm(action);
  return (
    <details style={{ marginTop: 10 }}>
      <summary style={{ cursor: 'pointer', fontSize: 13, color: '#444' }}>
        Publish new version of {themeName}
      </summary>
      <form action={formAction} style={{ display: 'grid', gap: 10, marginTop: 10 }}>
        <input type="hidden" name="themeId" value={themeId} />
        <div style={{ display: 'flex', gap: 10 }}>
          <input name="version" placeholder="1.1.0" style={input} required />
          <input name="changelog" placeholder="Changelog (optional)" style={input} />
        </div>
        <textarea
          name="manifest"
          placeholder='theme.json manifest (JSON) — validated against the Theme SDK schema'
          style={{ ...input, minHeight: 90, fontFamily: 'monospace', fontSize: 12 }}
          required
        />
        <textarea
          name="configSchema"
          placeholder="config.schema.json (JSON) — drives the merchant customizer controls"
          style={{ ...input, minHeight: 90, fontFamily: 'monospace', fontSize: 12 }}
          required
        />
        <div>
          <button type="submit" style={btnSmall} disabled={pending}>
            {pending ? 'Publishing…' : 'Publish version'}
          </button>
        </div>
        <Result state={state} />
      </form>
    </details>
  );
}

export function VisibilityForm({
  action,
  themeId,
  current,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  themeId: string;
  current: string;
}) {
  const [state, formAction, pending] = useAdminForm(action);
  return (
    <form action={formAction} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input type="hidden" name="themeId" value={themeId} />
      <select name="visibility" defaultValue={current} style={{ ...input, width: 'auto' }}>
        <option value="private">private</option>
        <option value="public">public</option>
        <option value="deprecated">deprecated</option>
      </select>
      <button type="submit" style={btnSmall} disabled={pending}>
        Save
      </button>
      {state.message && (
        <span style={{ fontSize: 12, color: state.ok ? '#15803d' : '#b91c1c' }}>
          {state.message}
        </span>
      )}
    </form>
  );
}

export function AutoApplyCard({
  action,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useAdminForm(action);
  return (
    <div style={card}>
      <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Safe updates</h3>
      <p style={{ fontSize: 13, color: '#555', margin: '0 0 12px' }}>
        Applies pending theme updates on installs with auto-update enabled — only when
        fully compatible. Incompatible installs are skipped, never force-updated.
      </p>
      <form action={formAction}>
        <button type="submit" style={btn} disabled={pending}>
          {pending ? 'Running…' : 'Run auto-apply now'}
        </button>
      </form>
      <Result state={state} />
    </div>
  );
}
