'use client';

import React, { useState } from 'react';
import { useActionState } from 'react';
import type { ActionState } from '../lib/actions';
import type { SectionBlueprint } from '../lib/customizer';
import type { SectionInstance } from '../lib/preview';

/* ---------- helpers ---------- */

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function getPath(obj: Record<string, unknown>, path: string[]): unknown {
  let cur: unknown = obj;
  for (const k of path) {
    if (!isObj(cur)) return undefined;
    cur = cur[k];
  }
  return cur;
}

function setPath(obj: Record<string, unknown>, path: string[], value: unknown): Record<string, unknown> {
  const clone: Record<string, unknown> = Array.isArray(obj) ? [...obj] as unknown as Record<string, unknown> : { ...obj };
  let cur = clone;
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i];
    const next = cur[k];
    cur[k] = isObj(next) ? { ...next } : {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[path[path.length - 1]] = value;
  return clone;
}

const fieldStyle: React.CSSProperties = {
  padding: '7px 10px',
  border: '1px solid #ddd',
  borderRadius: 8,
  fontSize: 13,
  width: '100%',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#52525b',
  marginBottom: 4,
  textTransform: 'capitalize',
};

const btnPrimary: React.CSSProperties = {
  background: '#111', color: '#fff', border: 'none', borderRadius: 8,
  padding: '9px 18px', fontSize: 14, cursor: 'pointer',
};
const btnGhost: React.CSSProperties = {
  background: '#fff', color: '#111', border: '1px solid #ddd', borderRadius: 8,
  padding: '7px 14px', fontSize: 13, cursor: 'pointer',
};
const btnDanger: React.CSSProperties = {
  background: 'none', color: '#b91c1c', border: 'none',
  fontSize: 13, cursor: 'pointer', padding: '4px 0',
};

function prettyName(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

/* ---------- schema-driven design controls ---------- */

function ControlForProp({
  propSchema,
  propKey,
  value,
  onChange,
}: {
  propSchema: Record<string, unknown>;
  propKey: string;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const enumVals = Array.isArray(propSchema.enum) ? (propSchema.enum as unknown[]) : null;
  const looksColor =
    /color/i.test(propKey) || propSchema.format === 'color';

  if (enumVals) {
    return (
      <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} style={fieldStyle}>
        {enumVals.map((v) => (
          <option key={String(v)} value={String(v)}>{String(v)}</option>
        ))}
      </select>
    );
  }
  if (looksColor) {
    const hex = typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="color" value={hex} onChange={(e) => onChange(e.target.value)} style={{ width: 40, height: 32, padding: 2, border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' }} />
        <input type="text" value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} style={{ ...fieldStyle, fontFamily: 'monospace' }} />
      </div>
    );
  }
  if (propSchema.type === 'number' || propSchema.type === 'integer') {
    return (
      <input type="number" value={typeof value === 'number' ? value : ''} onChange={(e) => onChange(Number(e.target.value))} style={fieldStyle} />
    );
  }
  if (propSchema.type === 'boolean') {
    return (
      <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18 }} />
    );
  }
  return (
    <input type="text" value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} style={fieldStyle} />
  );
}

function SchemaGroup({
  groupName,
  groupSchema,
  settings,
  onChange,
  path,
}: {
  groupName: string;
  groupSchema: Record<string, unknown>;
  settings: Record<string, unknown>;
  onChange: (path: string[], v: unknown) => void;
  path: string[];
}) {
  const props = isObj(groupSchema.properties) ? groupSchema.properties : {};
  const keys = Object.keys(props);
  if (keys.length === 0) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 10px', fontSize: 14 }}>{prettyName(groupName)}</h3>
      <div style={{ display: 'grid', gap: 10 }}>
        {keys.map((k) => {
          const ps = isObj(props[k]) ? (props[k] as Record<string, unknown>) : {};
          const fullPath = [...path, k];
          return (
            <div key={k}>
              <label style={labelStyle}>{prettyName(k)}</label>
              <ControlForProp
                propSchema={ps}
                propKey={k}
                value={getPath(settings, fullPath)}
                onChange={(v) => onChange(fullPath, v)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- section settings editor ---------- */

function SectionSettingsEditor({
  settings,
  onChange,
}: {
  settings: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const keys = Object.keys(settings);
  if (keys.length === 0) return <p style={{ fontSize: 12, color: '#999' }}>No editable settings.</p>;
  return (
    <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
      {keys.map((k) => {
        const v = settings[k];
        return (
          <div key={k}>
            <label style={labelStyle}>{prettyName(k)}</label>
            {typeof v === 'boolean' ? (
              <input type="checkbox" checked={v} onChange={(e) => onChange({ ...settings, [k]: e.target.checked })} style={{ width: 18, height: 18 }} />
            ) : typeof v === 'number' ? (
              <input type="number" value={v} onChange={(e) => onChange({ ...settings, [k]: Number(e.target.value) })} style={fieldStyle} />
            ) : (
              <input type="text" value={typeof v === 'string' ? v : JSON.stringify(v)} onChange={(e) => onChange({ ...settings, [k]: e.target.value })} style={fieldStyle} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- main customizer ---------- */

export function CustomizerClient({
  installId,
  themeName,
  initialSettings,
  initialSections,
  configSchema,
  blueprints,
  saveSettingsAction,
  saveSectionsAction,
  publishAction,
}: {
  installId: string;
  themeName: string;
  initialSettings: Record<string, unknown>;
  initialSections: SectionInstance[];
  configSchema: Record<string, unknown>;
  blueprints: SectionBlueprint[];
  saveSettingsAction: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  saveSectionsAction: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  publishAction: (prev: ActionState, fd: FormData) => Promise<ActionState>;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [sections, setSections] = useState(initialSections);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const [saveState, saveFormAction, savePending] = useActionState(saveSettingsAction, { ok: false, message: '' });
  const [secState, secFormAction, secPending] = useActionState(saveSectionsAction, { ok: false, message: '' });
  const [pubState, pubFormAction, pubPending] = useActionState(publishAction, { ok: false, message: '' });

  const dirtySettings = JSON.stringify(settings) !== JSON.stringify(initialSettings);
  const dirtySections = JSON.stringify(sections) !== JSON.stringify(initialSections);

  const onSettingChange = (path: string[], v: unknown) => setSettings((s) => setPath(s, path, v));

  const moveSection = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[idx], next[j]] = [next[j], next[idx]];
    setSections(next);
  };
  const toggleHidden = (idx: number) =>
    setSections((ss) => ss.map((s, i) => (i === idx ? { ...s, hidden: !s.hidden } : s)));
  const removeSection = (idx: number) =>
    setSections((ss) => ss.filter((_, i) => i !== idx));
  const updateSectionSettings = (idx: number, next: Record<string, unknown>) =>
    setSections((ss) => ss.map((s, i) => (i === idx ? { ...s, settings: next } : s)));

  const addSection = (bp: SectionBlueprint) => {
    const countOfType = sections.filter((s) => s.type === bp.type).length;
    if (bp.maxInstances !== null && countOfType >= bp.maxInstances) return;
    const id = `sec_${bp.type}_${Date.now().toString(36)}`;
    setSections((ss) => [
      ...ss,
      { id, type: bp.type, settings: { ...(bp.defaultSettings ?? {}) }, hidden: false } as SectionInstance,
    ]);
  };

  const schemaProps = isObj(configSchema.properties) ? (configSchema.properties as Record<string, unknown>) : {};
  const groupNames = Object.keys(schemaProps);

  const bumpPreview = () => setPreviewKey((k) => k + 1);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16, alignItems: 'start' }}>
      {/* ------- left: controls ------- */}
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>Design</h2>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: '#71717a' }}>{themeName} · visual controls</p>
          {groupNames.length === 0 && <p style={{ fontSize: 13, color: '#999' }}>This theme exposes no design settings.</p>}
          {groupNames.map((g) => (
            <SchemaGroup
              key={g}
              groupName={g}
              groupSchema={isObj(schemaProps[g]) ? (schemaProps[g] as Record<string, unknown>) : {}}
              settings={settings}
              onChange={onSettingChange}
              path={[g]}
            />
          ))}
          <form
            action={saveFormAction}
            onSubmit={() => setTimeout(bumpPreview, 500)}
          >
            <input type="hidden" name="id" value={installId} />
            <input type="hidden" name="settings" value={JSON.stringify(settings)} />
            <button type="submit" style={{ ...btnPrimary, width: '100%' }} disabled={savePending || !dirtySettings}>
              {savePending ? 'Saving…' : dirtySettings ? 'Save design (draft)' : 'Design saved'}
            </button>
          </form>
          {saveState.message && (
            <p style={{ fontSize: 12, color: saveState.ok ? '#15803d' : '#b91c1c', margin: '8px 0 0' }}>{saveState.message}</p>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>Homepage sections</h2>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: '#71717a' }}>Reorder, hide, or remove. Changes are drafts until published.</p>
          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            {sections.map((s, i) => (
              <div key={s.id} style={{ border: '1px solid #eee', borderRadius: 10, padding: 10, opacity: s.hidden ? 0.55 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>
                    {s.hidden ? '👁‍🗨 ' : ''}{prettyName(s.type)}
                  </span>
                  <button type="button" onClick={() => moveSection(i, -1)} disabled={i === 0} style={btnGhost} title="Move up">↑</button>
                  <button type="button" onClick={() => moveSection(i, 1)} disabled={i === sections.length - 1} style={btnGhost} title="Move down">↓</button>
                  <button type="button" onClick={() => toggleHidden(i)} style={btnGhost} title={s.hidden ? 'Show' : 'Hide'}>
                    {s.hidden ? 'Show' : 'Hide'}
                  </button>
                  <button type="button" onClick={() => setExpanded(expanded === s.id ? null : s.id)} style={btnGhost}>
                    {expanded === s.id ? 'Close' : 'Edit'}
                  </button>
                  <button type="button" onClick={() => removeSection(i)} style={btnDanger}>✕</button>
                </div>
                {expanded === s.id && (
                  <SectionSettingsEditor
                    settings={isObj(s.settings) ? (s.settings as Record<string, unknown>) : {}}
                    onChange={(next) => updateSectionSettings(i, next)}
                  />
                )}
              </div>
            ))}
            {sections.length === 0 && <p style={{ fontSize: 13, color: '#999' }}>No sections — add one below.</p>}
          </div>

          <h3 style={{ margin: '0 0 8px', fontSize: 13 }}>Add section</h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {blueprints.map((bp) => {
              const count = sections.filter((s) => s.type === bp.type).length;
              const maxed = bp.maxInstances !== null && count >= bp.maxInstances;
              return (
                <button
                  key={bp.type}
                  type="button"
                  onClick={() => addSection(bp)}
                  disabled={maxed}
                  title={bp.description ?? bp.type}
                  style={{ ...btnGhost, opacity: maxed ? 0.4 : 1 }}
                >
                  + {bp.name}{bp.maxInstances !== null ? ` (${count}/${bp.maxInstances})` : ''}
                </button>
              );
            })}
          </div>

          <form action={secFormAction} onSubmit={() => setTimeout(bumpPreview, 500)}>
            <input type="hidden" name="id" value={installId} />
            <input type="hidden" name="sections" value={JSON.stringify(sections)} />
            <button type="submit" style={{ ...btnPrimary, width: '100%' }} disabled={secPending || !dirtySections}>
              {secPending ? 'Saving…' : dirtySections ? 'Save layout (draft)' : 'Layout saved'}
            </button>
          </form>
          {secState.message && (
            <p style={{ fontSize: 12, color: secState.ok ? '#15803d' : '#b91c1c', margin: '8px 0 0' }}>{secState.message}</p>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>Publish</h2>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#71717a' }}>
            Publishing makes your saved drafts live on the storefront.
          </p>
          <form action={pubFormAction} onSubmit={() => setTimeout(bumpPreview, 800)}>
            <input type="hidden" name="id" value={installId} />
            <button type="submit" style={{ ...btnPrimary, width: '100%', background: '#15803d' }} disabled={pubPending}>
              {pubPending ? 'Publishing…' : '🚀 Publish storefront'}
            </button>
          </form>
          {pubState.message && (
            <p style={{ fontSize: 12, color: pubState.ok ? '#15803d' : '#b91c1c', margin: '8px 0 0' }}>{pubState.message}</p>
          )}
        </div>
      </div>

      {/* ------- right: live preview ------- */}
      <div style={{ position: 'sticky', top: 16 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Live preview (draft)</span>
            <button type="button" onClick={bumpPreview} style={btnGhost}>↻ Refresh</button>
          </div>
          <iframe
            key={previewKey}
            title="Storefront preview"
            sandbox=""
            src={`/preview/${installId}/html`}
            style={{ width: '100%', height: '70vh', border: '1px solid #eee', borderRadius: 8, background: '#fff' }}
          />
        </div>
      </div>
    </div>
  );
}
