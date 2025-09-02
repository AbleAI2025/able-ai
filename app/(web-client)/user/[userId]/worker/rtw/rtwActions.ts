"use server";

import { db } from "@/lib/drizzle/db";
import { UsersTable } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";

const RTW_API_BASE = "https://app.ukrtwchecker.co.uk/rtw";
const PASSPORTREADER_GET = "https://passportreader.app/api/v1/session.get";

type Outcome = "ACCEPTED" | "EXPIRED" | "NOT_FOUND" | "LOCKED" | "REJECTED";

// Accepts "yyyy-mm-dd" or "dd-mm-yyyy" -> returns Date or throws
function parseDob(dobStr: string): Date {
  const ymd = dobStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) return new Date(+ymd[1], +ymd[2] - 1, +ymd[3]);
  const dmy = dobStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
  throw new Error("Invalid DOB format");
}

const toDDMMYYYY = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${d.getFullYear()}`;

// ---- helpers for UK-passport (PassportReader) ----
function mapPassportStateToOutcome(state?: string): Outcome {
  const s = String(state || "").toUpperCase();
  if (s === "APPROVED" || s === "VERIFIED" || s === "OK") return "ACCEPTED";
  if (s === "EXPIRED") return "EXPIRED";
  if (s === "REJECTED" || s === "FAILED") return "REJECTED";
  // vendor may return PENDING while capture ongoing
  return "NOT_FOUND";
}

function isoOrNull(s?: string | null): string | null {
  if (!s) return null;
  // pass through ISO if it looks like YYYY-MM-DD; otherwise null
  return /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s) ? s : null;
}

// ——————————————————————————————————————————————
// A) NON-UK (Share Code) — your original flow (unchanged)
// ——————————————————————————————————————————————
export async function runRtwCheckAndStore(params: {
  userId: string; // firebaseUid
  forename: string;
  surname: string;
  dob: string; // "dd-mm-yyyy" or "yyyy-mm-dd"
  shareCode: string;
}) {
  try {
    const { userId, forename, surname, shareCode } = params;
    const dobDate = parseDob(params.dob);

    // Verify user exists (by firebaseUid) -> get internal id if needed
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
      columns: { id: true },
    });
    if (!user) return { error: "User not found", status: 404 };

    // simple 18+ age check
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 18);
    if (dobDate > cutoff) throw new Error("Applicant must be 18 or over");

    // mock escape hatch
    const useMock =
      process.env.USE_RTW_MOCK === "true" || !process.env.UK_RTW_API_SECRET;

    let status: any = null;

    if (useMock) {
      const code = String(shareCode).trim().toUpperCase();
      let outcome: Outcome = "NOT_FOUND";
      if (code === "WACCEPT") outcome = "ACCEPTED";
      else if (code === "WEXPIRED") outcome = "EXPIRED";
      else if (code === "WLOCKED") outcome = "LOCKED";
      else if (code === "WREJECT") outcome = "REJECTED";

      status = {
        outcome,
        expiry_date:
          outcome === "ACCEPTED"
            ? toDDMMYYYY(new Date(new Date().setMonth(new Date().getMonth() + 6)))
            : null,
        details: "Mock result",
        govuk_check_details: {
          check_date: toDDMMYYYY(new Date()),
          reference_number: `RTW-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
          company_name: process.env.UK_RTW_COMPANY_NAME || "Able AI Ltd (Mock)",
        },
      };
    } else {
      const apiKey = process.env.UK_RTW_API_SECRET!;
      const companyName = process.env.UK_RTW_COMPANY_NAME || "Able AI Ltd";
      const qs = new URLSearchParams({
        code: shareCode,
        dob: toDDMMYYYY(dobDate),
        forename,
        surname,
        company_name: companyName,
        allow_student: "true",
        allow_sponsorship: "true",
      });
      const res = await fetch(`${RTW_API_BASE}?${qs.toString()}`, {
        method: "GET",
        headers: { "X-UKRTWAPI-SECRET": apiKey },
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Provider error ${res.status}: ${body.slice(0, 300)}`);
      }
      const json = await res.json();
      status = json?.status ?? json; // some docs show response.status
    }

    // Normalise
    const payload = {
      outcome: String(status?.outcome || "NOT_FOUND").toUpperCase() as Outcome,
      name: { forename, surname },
      dob: new Date(dobDate).toDateString(),
      permission_expiry_date: status?.expiry_date ?? null, // dd/mm/yyyy
      govuk_check_details: {
        check_date: status?.govuk_check_details?.check_date ?? null,
        reference_number: status?.govuk_check_details?.reference_number ?? null,
        company_name: status?.govuk_check_details?.company_name ?? null,
      },
      evidence_available: status?.evidence_available ?? null,
      last_checked_at: status?.last_checked_at ?? null,
      details: status?.details ?? null,
      referenceNumber: status?.govuk_check_details?.reference_number ?? null,
      provider_name: status?.govuk_check_details?.company_name ?? null,
      name_match: status?.name_match ?? null,
      raw: status,
    };

    // Persist with Drizzle — same field you already use
    await db.update(UsersTable)
      .set({ updatedAt: new Date(), rtwStatus: payload.outcome })
      .where(eq(UsersTable.firebaseUid, userId));

    return { error: null, payload, status: 200 };
  } catch (error) {
    console.error("Error in runRtwCheckAndStore:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    };
  }
}

// ——————————————————————————————————————————————
// B) UK NATIONAL (PassportReader) — NEW flow
// ——————————————————————————————————————————————
export async function savePassportSessionAndStore(params: {
  userId: string;           // firebaseUid (same as above)
  sessionId: string;        // from session.create / session storage
}) {
  try {
    const { userId, sessionId } = params;

    // Verify user exists
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
      columns: { id: true },
    });
    if (!user) return { error: "User not found", status: 404 };

    const PUBLIC_KEY =
      process.env.PASSPORTREADER_PUBLIC_KEY ||
      process.env.NEXT_PUBLIC_PASSPORTREADER_PUBLIC_KEY ||
      "";
    const SECRET_KEY = process.env.PASSPORTREADER_SECRET_KEY || "";
    if (!PUBLIC_KEY || !SECRET_KEY) {
      return { error: "Missing PASSPORTREADER keys on server", status: 500 };
    }

    // Fetch the finished session from vendor
    const auth = Buffer.from(`${PUBLIC_KEY}:${SECRET_KEY}`).toString("base64");
    const res = await fetch(PASSPORTREADER_GET, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: sessionId }),
      cache: "no-store",
    });

    const text = await res.text();
    if (!res.ok) {
      return { error: `session.get error ${res.status}: ${text}`, status: 502 };
    }

    const vendor = JSON.parse(text);

    // Map to your existing payload-ish shape
    const outcome = mapPassportStateToOutcome(vendor?.state || vendor?.status);
    const payload = {
      outcome,
      name: {
        forename: vendor?.given_names || null,
        surname: vendor?.surname || null,
      },
      dob: vendor?.date_of_birth || vendor?.dob || null,
      permission_expiry_date: vendor?.expiry_date || null, // likely ISO (YYYY-MM-DD)
      govuk_check_details: {
        check_date: null,                 // not a GOV.UK check; keep null or map if vendor provides
        reference_number: String(vendor?.id ?? sessionId),
        company_name: "PassportReader",
      },
      evidence_available: null,           // vendor-specific if available
      last_checked_at: new Date().toISOString(),
      details: vendor?.details ?? null,
      referenceNumber: String(vendor?.id ?? sessionId),
      provider_name: "PassportReader",
      name_match: null,
      raw: vendor,
      // Extras you might want to keep:
      document_number: vendor?.document_number || vendor?.passport_number || null,
      nationality: vendor?.nationality || null,
      issuing_country: vendor?.issuing_country || null,
      mrz: vendor?.mrz?.full || null,
      expiry_iso: isoOrNull(vendor?.expiry_date),
    };

    // Persist minimal status (same field as share-code flow)
    await db.update(UsersTable)
      .set({ updatedAt: new Date(), rtwStatus: payload.outcome })
      .where(eq(UsersTable.firebaseUid, userId));

    return { error: null, payload, status: 200 };
  } catch (error) {
    console.error("Error in savePassportSessionAndStore:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    };
  }
}