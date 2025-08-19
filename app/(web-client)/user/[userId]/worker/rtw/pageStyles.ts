// app/rtw/pageStyles.ts
export const styles = {
  // page structure
  page: { minHeight: "100vh", background: "#000", color: "white" },
  header: { padding: "32px 24px" },
  title: { fontSize: 28, fontWeight: 800, marginBottom: 6 },
  subtitle: { opacity: 0.85, marginTop: 6, maxWidth: 960, marginInline: "auto" },

  main: { padding: "0 24px 40px" },
  formGrid: {
    maxWidth: 640, // single-column width
    margin: "0 auto",
    display: "grid",
    gap: 16,
    gridTemplateColumns: "1fr",
  },
  colHalf: { gridColumn: "1 / -1" }, // stacked
  colFull: { gridColumn: "1 / -1" },

  // fields
  fieldRow: { display: "grid", gap: 8 },
  label: {
    color: "#e5e7eb",
    fontSize: 13,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  required: { color: "#9ca3af", fontSize: 12 },
  help: { color: "#9ca3af", fontSize: 11, marginTop: 6 },

  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 18,
    border: "1px solid #374151",
    backgroundColor: "#111827",
    color: "#e5e7eb",
    fontSize: 14,
    outline: "none",
    transition: "box-shadow 120ms ease, border-color 120ms ease",
  },
  inputFocus: { boxShadow: "0 0 0 2px rgba(96,165,250,0.45)" },

  banner: { color: "#e5e7eb", lineHeight: 1.5, fontSize: 16 },

  error: { color: "#fca5a5", fontSize: 13 },

  submit: {
    width: "100%",
    padding: "14px 16px",
    background: "#60a5fa",
    color: "#0b0f1a",
    borderRadius: 12,
    border: "none",
    fontWeight: 800,
    cursor: "pointer",
  },

  // result
  result: {
    maxWidth: 960,
    margin: "18px auto 0",
    padding: 16,
    border: "1px solid #1f2937",
    borderRadius: 12,
    background: "#0b1220",
    color: "#e5e7eb",
    fontSize: 14,
  },
  resultHeader: { display: "flex", gap: 8, alignItems: "center", marginBottom: 8 },
  resultName: {},
  resultGrid: { display: "grid", gap: 6 },

  // base badge style; color is set dynamically
  badge: { color: "white", padding: "2px 8px", borderRadius: 999, fontSize: 12 },

  // NEW: Status/details line style
  resultDetail: {
    fontSize: "14px",
    marginTop: "6px",
    color: "#e5e7eb",
  },

  // Optional name mismatch banner if you enabled it
  nameMismatch: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    background: "#3b0e0e",
    color: "#fca5a5",
  },
};