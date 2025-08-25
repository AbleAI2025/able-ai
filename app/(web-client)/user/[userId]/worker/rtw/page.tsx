/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/rtw/page.tsx
"use client";

import { useState } from "react";
import { styles as s } from "./pageStyles";
import { runRtwCheckAndStore } from "./rtwActions";
import { useAuth } from "@/context/AuthContext";

/* ---------- Types ---------- */
type Result = {
  outcome: "ACCEPTED" | "EXPIRED" | "NOT_FOUND" | "LOCKED" | "REJECTED" | string;
  name: { forename: string; surname: string };
  dob: string;
  permission_expiry_date: string | null;
  govuk_check_details: { check_date: string; reference_number: string; company_name: string };
  evidence_available: boolean;
  last_checked_at: string;

  // NEW: for the “Status” line
  details?: string | null;

  // Optional extras if you added name matching earlier
  provider_name?: string;
  name_match?: boolean;
  raw?: any; // Raw response from the RTW API
};
type FormState = { share_code: string; dob: string; forename: string; surname: string };

/* ---------- DOB helpers ---------- */
function parseDob(dobStr: string): string | null {
  if (!dobStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dobStr)) {
    const [y, m, d] = dobStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return isNaN(dt.getTime()) ? null : dobStr;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(dobStr)) {
    const [d, m, y] = dobStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return isNaN(dt.getTime()) ? null : dobStr;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dobStr)) {
    const [d, m, y] = dobStr.split("/").map(Number);
    const dt = new Date(y, m - 1, d);
    return isNaN(dt.getTime()) ? null : dobStr;
  }
  return null;
}
function isUnder18(dob: string): boolean {
  const today = new Date();
  const cutOff = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  return new Date(dob) > cutOff;
}

/* ---------- Small UI helpers ---------- */
function FieldRow(props: {
  id: string;
  label: string;
  required?: boolean;
  helpText?: string;
  children: React.ReactNode;
}) {
  const { id, label, required, helpText, children } = props;
  return (
    <div style={s.fieldRow}>
      <label htmlFor={id} style={s.label}>
        {label} {required && <span style={s.required}>(Required)</span>}
      </label>
      {children}
      {helpText ? <div style={s.help}>{helpText}</div> : null}
    </div>
  );
}

function TextInput(props: {
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { id, type = "text", placeholder, value, onChange } = props;
  const [focused, setFocused] = useState(false);
  const baseStyle = focused ? { ...s.input, ...s.inputFocus } : s.input;

  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ ...baseStyle, ...(type === "date" ? { colorScheme: "dark" as any } : null) }}
    />
  );
}

function Banner({ children }: { children: React.ReactNode }) {
  return <div style={s.banner}>{children}</div>;
}

export default function RTWPage() {
  const [form, setForm] = useState<FormState>({
    share_code: "",
    dob: "",
    forename: "",
    surname: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    // DOB validation
    const dobDate = parseDob(form.dob);
    if (!dobDate) {
      alert("Please enter a valid date of birth.");
      setError("Please enter a valid date of birth.");
      return;
    }
    if (isUnder18(dobDate)) {
      alert("We can only process applications for individuals aged 18 or over.");
      setError("Applicants must be at least 18 years old.");
      return;
    }

    if (!user?.uid) return;

    setLoading(true);
    try {
      const { error, payload } = await runRtwCheckAndStore({
        userId: user?.uid,
        forename: form.forename,
        surname: form.surname,
        dob: dobDate,
        shareCode: form.share_code,
      });

      if (error) throw new Error();
      console.warn(payload);
      setResult(payload as Result);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function Badge({ outcome }: { outcome: string }) {
    const bg =
      outcome === "ACCEPTED"
        ? "#10b981"
        : outcome === "EXPIRED" || outcome === "REJECTED"
        ? "#ef4444"
        : "#f59e0b";
    return <span style={{ ...s.badge, background: bg }}>{outcome}</span>;
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={s.title}>Validate your Right to Work in the UK</h1>
        <p style={s.subtitle}>
          Use mock share codes: <code>WACCEPT</code>, <code>WEXPIRED</code>, <code>WLOCKED</code>,{" "}
          <code>WREJECT</code> (anything else = NOT_FOUND). For staging, use the provider’s test codes like{" "}
          <code>TEST_ACCEPTED</code>.
        </p>
      </header>

      <main style={s.main}>
        <form onSubmit={onSubmit} style={s.formGrid}>
          <div style={s.colHalf}>
            <FieldRow
              id="share_code"
              label="Share Code"
              required
              helpText="This is usually 8–11 characters, a mixture of letters and numbers, starting with ‘W’."
            >
              <TextInput
                id="share_code"
                placeholder="Enter share code"
                value={form.share_code}
                onChange={(v) => setForm((f) => ({ ...f, share_code: v }))}
              />
            </FieldRow>
          </div>

          <div style={s.colHalf}>
            <FieldRow id="dob" label="Date of Birth" required>
              <TextInput
                id="dob"
                type="date"
                placeholder="dd-mm-yyyy"
                value={form.dob}
                onChange={(v) => setForm((f) => ({ ...f, dob: v }))}
              />
            </FieldRow>
          </div>

          <div style={s.colHalf}>
            <FieldRow id="forename" label="Forename" required>
              <TextInput
                id="forename"
                placeholder="Enter first name(s)"
                value={form.forename}
                onChange={(v) => setForm((f) => ({ ...f, forename: v }))}
              />
            </FieldRow>
          </div>

          <div style={s.colHalf}>
            <FieldRow id="surname" label="Surname" required>
              <TextInput
                id="surname"
                placeholder="Enter surname(s)"
                value={form.surname}
                onChange={(v) => setForm((f) => ({ ...f, surname: v }))}
              />
            </FieldRow>
          </div>

          <div style={s.colFull}>
            <Banner>
              Sorry, right now because of UK immigration laws, foreign students cannot work as freelancers :(
            </Banner>
          </div>

          {error && (
            <div style={s.colFull}>
              <div style={s.error}>{error}</div>
            </div>
          )}

          <div style={s.colFull}>
            <button disabled={loading} type="submit" style={s.submit}>
              {loading ? "Checking..." : "Submit"}
            </button>
          </div>
        </form>

        {result && (
          <section style={s.result}>
            <div style={s.resultHeader}>
              <Badge outcome={result.outcome} />
              <strong style={s.resultName}>
                {result.name.forename} {result.name.surname}
              </strong>
            </div>

            <div style={s.resultGrid}>
              <div>DOB: {result.dob}</div>
              <div>Permission expiry: {result.permission_expiry_date ?? "—"}</div>
              <div>Reference: {result.govuk_check_details.reference_number}</div>
              <div>Last checked: {new Date(result.last_checked_at).toLocaleString()}</div>
              <div>Company: {result.govuk_check_details.company_name}</div>

              {/* NEW: Status/details line directly under company */}
              {result.details && (
                <p style={s.resultDetail}>
                  <strong>Status:</strong> {result.details}
                </p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}