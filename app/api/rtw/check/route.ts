import { runRtwCheckAndStore } from "@/app/rtw/rtwActions";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { userId = null, forename, surname, dob, share_code } = body;

  try {
    const payload = await runRtwCheckAndStore({
      userId,
      forename,
      surname,
      dob,
      shareCode: share_code,
    });
    return NextResponse.json(payload);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 });
  }
}