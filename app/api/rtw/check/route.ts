// app/api/rtw/check/route.ts
import { dbdoc } from "@/lib/firebase/firebase-server"; // Firestore (already configured in the repo)
import crypto from "crypto"; // optional: to hash the share code
import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://app.ukrtwchecker.co.uk/rtw";

type Outcome = "ACCEPTED" | "EXPIRED" | "NOT_FOUND" | "LOCKED" | "REJECTED";

function parseDob(dobStr: string): Date | null {
  if (!dobStr) return null;
  // yyyy-mm-dd (from <input type="date">)
  const ymd = dobStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  // dd-mm-yyyy
  const dmy = dobStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  return null;
}
function isUnder18(dob: Date): boolean {
  const t = new Date();
  const cutoff = new Date(t.getFullYear() - 18, t.getMonth(), t.getDate());
  return dob > cutoff;
}
function formatDDMMYYYY(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
}

// Optional: quick GET so you can visit /api/rtw/check in the browser
export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST to this endpoint with JSON" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { forename, surname, dob, share_code } = body ?? {};
    if (!forename || !surname || !dob || !share_code) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Age check (server-side too)
    const dobDate = parseDob(dob);
    if (!dobDate) {
      return NextResponse.json({ error: "Invalid date of birth format" }, { status: 400 });
    }
    if (isUnder18(dobDate)) {
      return NextResponse.json({ error: "Applicant must be 18 or over" }, { status: 400 });
    }

    // Allow a mock escape hatch if you want it
    const useMock = process.env.USE_RTW_MOCK === "true" || !process.env.UK_RTW_API_SECRET;
    if (useMock) {
      // Keep your previous mock logic as fallback
      const code = String(share_code).trim().toUpperCase();
      let outcome: Outcome = "NOT_FOUND";
      if (code === "WACCEPT") outcome = "ACCEPTED";
      else if (code === "WEXPIRED") outcome = "EXPIRED";
      else if (code === "WLOCKED") outcome = "LOCKED";
      else if (code === "WREJECT") outcome = "REJECTED";

      const now = new Date();
      const plusMonths = (m: number) => {
        const d = new Date(now);
        d.setMonth(d.getMonth() + m);
        return d.toISOString().slice(0, 10);
      };
      return NextResponse.json({
        outcome,
        name: { forename, surname },
        dob,
        permission_expiry_date:
          outcome === "ACCEPTED" ? plusMonths(6) : outcome === "EXPIRED" ? plusMonths(-1) : null,
        govuk_check_details: {
          check_date: now.toISOString().slice(0, 10),
          reference_number: `RTW-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
          company_name: process.env.UK_RTW_COMPANY_NAME || "Able AI Ltd (Mock)",
        },
        evidence_available: false,
        last_checked_at: now.toISOString(),
      });
    }

    // Real (staging) call
    const apiKey = process.env.UK_RTW_API_SECRET!;
    const companyName = process.env.UK_RTW_COMPANY_NAME || "Able AI Ltd";
    const params = new URLSearchParams({
      code: String(share_code).trim(),                  // required
      forename: String(forename).trim(),                // required
      surname: String(surname).trim(),                  // required
      dob: formatDDMMYYYY(dobDate),                     // required (docs say dd-mm-yyyy)
      company_name: companyName,                        // required
      allow_student: "true",                            // optional
      allow_sponsorship: "true",                        // optional
      // include_image: "false",
      // include_pdf: "false",
    });

    // Docs: base URL + header X-UKRTWAPI-SECRET; test codes available (TEST_ACCEPTED, TEST_NOT_FOUND, TEST_EXPIRED, etc.).  [oai_citation:1‡UK Share Code API _ Verify UK Right to Work & Rent Share Codes.pdf](file-service://file-8GyFQFMLEzzpt3t9KiRSRW)
    const upstream = await fetch(`${API_BASE}?${params.toString()}`, {
      method: "GET",
      headers: { "X-UKRTWAPI-SECRET": apiKey },
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return NextResponse.json(
        { error: `RTW provider error (${upstream.status})`, detail: text?.slice(0, 500) },
        { status: 502 }
      );
    }

    const data = await upstream.json();

    // Map provider → your UI schema (handles both RTW and v2/rtw shapes)
    const status = data?.status ?? {};
    const now = new Date();

    const payload = {
      outcome: String(status?.outcome || "NOT_FOUND").toUpperCase() as Outcome,
      name: { forename, surname },
      dob: formatDDMMYYYY(dobDate),
      permission_expiry_date: status?.expiry_date || null, // dd-mm-yyyy or null
      govuk_check_details: {
        check_date: status?.govuk_check_details?.check_date || now.toISOString().slice(0, 10),
        reference_number: status?.govuk_check_details?.reference_number ||
          `RTW-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        company_name: status?.govuk_check_details?.company_name || companyName,
      },
      details: status?.details || null,
      evidence_available: status?.image && status?.image !== "Not Requested",
      last_checked_at: now.toISOString(),
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Invalid JSON or server error", detail: String(err?.message || err) },
      { status: 400 }
    );
  }
}