import React from 'react';
import { prerender } from 'react-dom/static';
import { Storefront } from '../components/storefront';
import type { PreviewDocument } from './preview';

/** Escape for raw interpolation into the <head> we build by hand. */
function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function streamToString(
  stream: ReadableStream<Uint8Array>,
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let out = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  out += decoder.decode();
  return out;
}

/**
 * Renders a preview document to a complete, self-contained HTML page.
 *
 * Security properties (spec §13 — the sandboxed preview):
 * - The page contains ZERO <script> tags: it is pure static markup +
 *   inline styles, so there is nothing for an attacker-controlled setting
 *   to execute even if it slipped past validation.
 * - All dynamic text is rendered through React (auto-escaped); the two
 *   hand-interpolated <head> values go through escapeAttr.
 * - The host page embeds this via <iframe sandbox=""> (see
 *   app/preview/[installId]/page.tsx): with an empty sandbox attribute the
 *   browser blocks scripts, forms, popups, and same-origin access even if
 *   markup ever contained something active.
 *
 * Uses react-dom/static (React 19's server renderer) because Next.js does
 * not permit importing react-dom/server inside the app.
 */
export async function buildSandboxedPreviewHtml(
  doc: PreviewDocument,
): Promise<string> {
  const { prelude } = await prerender(<Storefront doc={doc} mode="preview" />);
  const body = await streamToString(prelude);
  const favicon = doc.branding.faviconUrl
    ? `<link rel="icon" href="${escapeAttr(doc.branding.faviconUrl)}">`
    : '';
  return (
    '<!DOCTYPE html>' +
    '<html lang="en"><head>' +
    '<meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    favicon +
    `<title>${escapeAttr(doc.branding.name)} — preview</title>` +
    '</head>' +
    `<body style="margin:0">${body}</body></html>`
  );
}
