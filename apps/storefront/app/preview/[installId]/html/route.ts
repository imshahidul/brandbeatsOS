import { fetchPreviewDocument } from '../../../../lib/preview';
import { buildSandboxedPreviewHtml } from '../../../../lib/render';
import { requireSession } from '../../../../lib/actions';

/**
 * Serves the sandboxed preview as a standalone HTML document.
 *
 * The merchant page embeds this URL in <iframe sandbox="">. Defense in depth:
 * - the HTML itself contains zero <script> tags (static markup only),
 * - the iframe sandbox attribute blocks scripts/forms/popups/same-origin,
 * - a Content-Security-Policy: sandbox header applies the same restrictions
 *   even if the URL is ever loaded outside the iframe.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ installId: string }> },
) {
  const { installId } = await params;
  let session;
  try {
    session = await requireSession();
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const doc = await fetchPreviewDocument(installId, session.token, session.tenantId);
    const html = await buildSandboxedPreviewHtml(doc);
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': 'sandbox;',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
