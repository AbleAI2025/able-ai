import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // ensure Node, not Edge

async function createSession(metadata?: any) {
  const PUBLIC_KEY =
    process.env.PASSPORTREADER_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_PASSPORTREADER_PUBLIC_KEY ||
    '';
  const SECRET_KEY = process.env.PASSPORTREADER_SECRET_KEY || '';

  if (!PUBLIC_KEY || !SECRET_KEY) {
    return NextResponse.json(
      {
        ok: false,
        error: 'CONFIG_MISSING',
        message: 'Missing PASSPORTREADER keys on server',
        details: { hasPublic: Boolean(PUBLIC_KEY), hasSecret: Boolean(SECRET_KEY) },
      },
      { status: 500 }
    );
  }

  const auth = Buffer.from(`${PUBLIC_KEY}:${SECRET_KEY}`).toString('base64');

  const res = await fetch('https://passportreader.app/api/v1/session.create', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      callback_url: null,
      metadata: metadata ?? { source: 'able-ai/local-dev' },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error('vendor session.create error:', txt);
    return NextResponse.json(
      { ok: false, error: 'VENDOR_ERROR', message: txt },
      { status: 502 }
    );
  }

  const data = await res.json(); // e.g. { id, token, ... }
  return NextResponse.json({ ok: true, token: data.token, sessionId: data.id, raw: data });
}

export async function POST(req: Request) {
  try {
    const { metadata } = await req.json();
    return createSession(metadata);
  } catch {
    // allow empty body too
    return createSession();
  }
}

export async function GET() {
  // convenience for UIs that call GET
  return createSession();
}