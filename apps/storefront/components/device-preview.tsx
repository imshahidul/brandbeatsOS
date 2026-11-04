'use client';

import React, { useState } from 'react';

const MODES = [
  { key: 'desktop', label: '🖥 Desktop', width: '100%' },
  { key: 'tablet', label: '📱 Tablet', width: '768px' },
  { key: 'mobile', label: '📲 Mobile', width: '390px' },
] as const;

export function DevicePreview({ installId }: { installId: string }) {
  const [mode, setMode] = useState<(typeof MODES)[number]['key']>('desktop');
  const active = MODES.find((m) => m.key === mode)!;
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: '1px solid #ddd',
              background: mode === m.key ? '#111' : '#fff',
              color: mode === m.key ? '#fff' : '#111',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <iframe
          title="Storefront preview"
          sandbox=""
          src={`/preview/${installId}/html`}
          style={{
            width: active.width,
            maxWidth: '100%',
            height: '80vh',
            border: '1px solid #ddd',
            borderRadius: 12,
            background: '#fff',
            transition: 'width 0.25s ease',
          }}
        />
      </div>
    </div>
  );
}
