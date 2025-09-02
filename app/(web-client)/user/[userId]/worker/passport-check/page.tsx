'use client';

import React, { useState } from 'react';
import { styles as s } from './pageStyles';

type FormState = {
  forename: string;
  surname: string;
  dob: string;            // dd-mm-yyyy
  passportNumber: string;
  passportExpiry: string; // dd-mm-yyyy
  nationality: string;
  mrz: string;
  consent: boolean;
};

function sanitiseDateInput(raw: string) {
  // Replace any weird dash with ascii hyphen, strip invalid chars
  return raw
    .replace(/[\u2010-\u2015]/g, '-')     // en/em/figure/minus to '-'
    .replace(/[^0-9-]/g, '')              // only digits and -
    .slice(0, 10);                         // cap at 10 chars
}

const DATE_PATTERN = '^[0-9]{2}-[0-9]{2}-[0-9]{4}$';
const dateRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(19|20)\d{2}$/;

function isValidDDMMYYYY(s: string) {
  if (!dateRegex.test(s)) return false;
  const [dd, mm, yyyy] = s.split('-').map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
}

export default function PassportCheckPage() {
  const [form, setForm] = useState<FormState>({
    forename: '',
    surname: '',
    dob: '',
    passportNumber: '',
    passportExpiry: '',
    nationality: 'British',
    mrz: '',
    consent: false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function onDateChange(key: 'dob' | 'passportExpiry', raw: string) {
    update(key, sanitiseDateInput(raw));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!form.consent) return setMessage('Please provide consent to proceed.');
    if (!file) return setMessage('Please upload the passport photo/MRZ page image (or PDF).');

    // Extra JS validation so we don’t rely solely on HTML pattern
    if (!isValidDDMMYYYY(form.dob)) {
      return setMessage('Date of birth must be a real date in dd-mm-yyyy.');
    }
    if (!isValidDDMMYYYY(form.passportExpiry)) {
      return setMessage('Passport expiry must be a real date in dd-mm-yyyy.');
    }

    try {
      setBusy(true);

      // 1) Create vendor session on the server (keeps your keys private)
      const sessionRes = await fetch('/api/passportreader/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            purpose: 'UK Passport RTW',
            userProvided: {
              forename: form.forename,
              surname: form.surname,
              dob: form.dob,                    // dd-mm-yyyy (server can normalise to ISO)
              passportNumber: form.passportNumber,
              passportExpiry: form.passportExpiry,
              nationality: form.nationality,
              mrz: form.mrz || null,
            },
          },
        }),
      });

      if (!sessionRes.ok) {
        const txt = await sessionRes.text();
        throw new Error(`Session create failed: ${txt}`);
      }

      const { token } = await sessionRes.json();

      // 2) Upload evidence file via our server
      const fd = new FormData();
      fd.append('file', file);
      fd.append('token', token);

      const uploadRes = await fetch('/api/passportreader/upload', {
        method: 'POST',
        body: fd,
      });

      if (!uploadRes.ok) {
        const txt = await uploadRes.text();
        throw new Error(`Upload failed: ${txt}`);
      }

      setMessage('Passport submitted. We’ll display verification shortly.');
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.container}>
        <h1 style={s.title}>UK Passport Check</h1>
        <p style={s.subtitle}>
          Upload the photo/MRZ page of your British passport. We’ll securely process it to confirm your Right-to-Work.
          Buyers never see your passport photo.
        </p>
        <form onSubmit={onSubmit} style={{ ...s.form, gridTemplateColumns: '1fr 1fr' }} noValidate>
          <div>
            <label style={s.label}>Given names</label>
            <input
              style={s.input}
              value={form.forename}
              onChange={e => update('forename', e.target.value)}
              required
              placeholder="e.g. JOHN MICHAEL"
            />
          </div>
          <div>
            <label style={s.label}>Surname</label>
            <input
              style={s.input}
              value={form.surname}
              onChange={e => update('surname', e.target.value)}
              required
              placeholder="e.g. DOE"
            />
          </div>
          <div>
            <label style={s.label}>Date of birth (dd-mm-yyyy)</label>
            <input
              style={s.input}
              value={form.dob}
              onChange={e => onDateChange('dob', e.target.value)}
              required
              inputMode="numeric"
              pattern={DATE_PATTERN}
              title="Use dd-mm-yyyy"
              placeholder="07-09-1998"
            />
          </div>
          <div>
            <label style={s.label}>Passport number</label>
            <input
              style={s.input}
              value={form.passportNumber}
              onChange={e => update('passportNumber', e.target.value)}
              required
              placeholder="e.g. 123456789"
            />
          </div>
          <div>
            <label style={s.label}>Passport expiry (dd-mm-yyyy)</label>
            <input
              style={s.input}
              value={form.passportExpiry}
              onChange={e => onDateChange('passportExpiry', e.target.value)}
              required
              inputMode="numeric"
              pattern={DATE_PATTERN}
              title="Use dd-mm-yyyy"
              placeholder="30-01-2032"
            />
          </div>
          <div>
            <label>Nationality</label>
            <select
              style={s.select}
              value={form.nationality}
              onChange={e => update('nationality', e.target.value)}
              required
            >
              <option>British</option>
              <option>Irish</option>
            </select>
          </div>
          <div>
            <label>MRZ (optional)</label>
            <input
              style={s.input}
              value={form.mrz}
              onChange={e => update('mrz', e.target.value)}
              placeholder="Enter MRZ lines if OCR fails"
            />
          </div>
          <div>
            <label>Passport photo/MRZ page (image or PDF)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              style={s.input}
              required
            />
            {file && <p style={s.info}>Selected: {file.name}</p>}
          </div>
          <div>
            <label style={{ ...s.label, flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <input
                type="checkbox"
                checked={form.consent}
                onChange={e => update('consent', e.target.checked)}
                style={s.checkbox}
              />
              <span>
                I consent to Able securely processing my passport data for Right-to-Work verification and storing evidence per our retention policy.
              </span>
            </label>
          </div>
          <div style={{ ...s.col, gridColumn: '1 / -1', flexDirection: 'row', gap: 12 }}>
            <button
              type="submit"
              disabled={busy}
              style={s.button}
            >
              {busy ? 'Submitting…' : 'Submit Passport'}
            </button>
          </div>
          {message && <div style={s.message}>{message}</div>}
        </form>
        <div style={s.info}>
          We create a secure session on our server using a public/secret key pair from PassportReader, then upload your document within that session. Your secret key is never exposed client-side.
        </div>
      </div>
    </div>
  );
}