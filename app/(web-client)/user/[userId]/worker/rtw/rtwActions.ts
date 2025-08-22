"use server";

import { db } from "@/lib/drizzle/db";
import { UsersTable } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";

const API_BASE = "https://app.ukrtwchecker.co.uk/rtw";

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

// ——————————————————————————————————————————————
// MAIN ACTION: runs provider call, stores, returns a normalised payload
// ——————————————————————————————————————————————
export async function runRtwCheckAndStore(params: {
  userId: string; // optional
  forename: string;
  surname: string;
  dob: string; // "dd-mm-yyyy" or "yyyy-mm-dd"
  shareCode: string;
}) {
  try {
    const { userId, forename, surname, shareCode } = params;
    const dobDate = parseDob(params.dob);

    // First, verify the user exists and get their ID
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
      columns: {
        id: true,
      },
    });

    if (!user) {
      return { error: "User not found", status: 404 };
    }

    // simple age check
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 18);
    if (dobDate > cutoff) {
      throw new Error("Applicant must be 18 or over");
    }

    // mock escape hatch if you ever need it
    const useMock =
      process.env.USE_RTW_MOCK === "true" || !process.env.UK_RTW_API_SECRET;

    let status = null;

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
            ? toDDMMYYYY(
                new Date(new Date().setMonth(new Date().getMonth() + 6))
              )
            : null,
        details: "Mock result",
        govuk_check_details: {
          check_date: toDDMMYYYY(new Date()),
          reference_number: `RTW-${Math.random()
            .toString(36)
            .slice(2, 10)
            .toUpperCase()}`,
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

      const res = await fetch(`${API_BASE}?${qs.toString()}`, {
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

    // Normalise into our shape
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

    // Persist with Drizzle
    await db
      .update(UsersTable)
      .set({
        updatedAt: new Date(),
        rtwStatus: payload.outcome,
      })
      .where(eq(UsersTable.firebaseUid, userId));

    return {
      error: null,
      payload,
      status: 200,
    };
  } catch (error) {
    console.error("Error in runRtwCheckAndStore:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    };
  }
}
