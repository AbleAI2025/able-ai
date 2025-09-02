import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ message: 'Missing id' }, { status: 400 });
    }

    const PUBLIC_KEY =
      process.env.PASSPORTREADER_PUBLIC_KEY ||
      process.env.NEXT_PUBLIC_PASSPORTREADER_PUBLIC_KEY ||
      '';
    const SECRET_KEY = process.env.PASSPORTREADER_SECRET_KEY || '';

    if (!PUBLIC_KEY || !SECRET_KEY) {
      return NextResponse.json(
        { message: 'Missing PASSPORTREADER keys on server' },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${PUBLIC_KEY}:${SECRET_KEY}`).toString('base64');

    const res = await fetch('https://passportreader.app/api/v1/session.get', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    const text = await res.text();
    if (!res.ok) {
      return new NextResponse(`Vendor session.get error: ${text}`, { status: 502 });
    }

    // Return JSON (or text parsed as JSON)
    try {
      const json = JSON.parse(text);
      return NextResponse.json(json);
    } catch {
      return new NextResponse(text, { status: 200 });
    }
  } catch (err: any) {
    return new NextResponse(err?.message || 'Unexpected error', { status: 500 });
  }
}