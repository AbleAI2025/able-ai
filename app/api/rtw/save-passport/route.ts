import { NextResponse } from "next/server";
import { savePassportSessionAndStore } from "@/app/(web-client)/user/[userId]/worker/rtw/rtwActions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { userId, sessionId } = await req.json();
    if (!userId || !sessionId) {
      return NextResponse.json(
        { message: "userId and sessionId are required" },
        { status: 400 }
      );
    }

    const result = await savePassportSessionAndStore({ userId, sessionId });

    if (result.error) {
      return NextResponse.json(
        { message: result.error },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json({ ok: true, payload: result.payload });
  } catch (err: any) {
    console.error("save-passport route error:", err);
    return NextResponse.json(
      { message: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}