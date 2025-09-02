import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type TryResult = { ok: boolean; status: number; text: string; url: string; field: string };

async function tryUpload(url: string, token: string, file: File, fieldName: string): Promise<TryResult> {
  const fd = new FormData();
  const filename = (file as any).name || 'passport-evidence';
  fd.append(fieldName, file, filename);
  // harmless hint; ignored by most APIs if not used
  fd.append('kind', 'passport');

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });

  const text = await res.text();
  return { ok: res.ok, status: res.status, text, url, field: fieldName };
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const token = form.get('token') as string | null;
    const sessionId = form.get('sessionId') as string | null;
    const hostInput = form.get('host') as string | null;

    if (!file) return new NextResponse('Missing file', { status: 400 });
    if (!token) return new NextResponse('Missing token', { status: 400 });
    if (!sessionId) return new NextResponse('Missing sessionId', { status: 400 });

    // Normalise host (fallback to known default)
    const hostBase = (hostInput || 'https://passportreader.app').replace(/\/+$/, '');
    const base = `${hostBase}/api/v1`;

    // Most likely first: token-only upload (session is implied by token)
    const urls: string[] = [
      `${base}/upload`,                                   // 1) token-only
      `${base}/session/${encodeURIComponent(sessionId)}/upload`,   // 2) session in URL (singular)
      `${base}/sessions/${encodeURIComponent(sessionId)}/upload`,  // 3) session in URL (plural)
      `${base}/session/${encodeURIComponent(sessionId)}/document`, // 4) sometimes called "document"
      `${base}/session.${encodeURIComponent(sessionId)}.upload`,   // 5) legacy dotted
    ];

    const fields = ['document', 'file', 'image'];

    const attempts: TryResult[] = [];
    for (const url of urls) {
      for (const field of fields) {
        const res = await tryUpload(url, token, file, field);
        attempts.push(res);
        if (res.ok) {
          // Return parsed JSON if possible
          try {
            const json = JSON.parse(res.text);
            return NextResponse.json(json);
          } catch {
            // Not JSON? return as text payload anyway
            return new NextResponse(res.text, { status: 200 });
          }
        }
        // If not 404, fail fast with clear diagnostics
        if (res.status !== 404) {
          return new NextResponse(
            `Vendor upload error (${res.status}) @ ${res.url} using field "${res.field}": ${res.text}`,
            { status: 502 }
          );
        }
      }
    }

    // All attempts returned 404
    const last = attempts[attempts.length - 1];
    return new NextResponse(
      `Vendor upload error: Endpoint not found for session ${sessionId}. Last response (${last?.status} @ ${last?.url} using "${last?.field}"):\n${last?.text}`,
      { status: 502 }
    );
  } catch (err: any) {
    return new NextResponse(err?.message || 'Unexpected error', { status: 500 });
  }
}