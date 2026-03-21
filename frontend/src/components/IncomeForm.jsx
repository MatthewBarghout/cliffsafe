import { useState } from "react";
import { motion } from "framer-motion";
import { ButtonSpinner } from "./Loading";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const EMPLOYMENT_TYPES = [
  { value: "full_time",     label: "Full-time Employee" },
  { value: "part_time",     label: "Part-time Employee" },
  { value: "gig",           label: "Gig Worker" },
  { value: "self_employed", label: "Self-Employed" },
  { value: "seasonal",      label: "Seasonal Worker" },
];

/* Two-column grid row */
function Row({ children }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "1rem",
    }}>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <label style={{
          fontSize: "0.72rem", fontWeight: 700,
          color: "#555", letterSpacing: "0.06em",
          textTransform: "uppercase",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          {label}
        </label>
        {hint && (
          <span style={{ fontSize: "0.68rem", color: "#bbb", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export default function IncomeForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    gross_income: "",
    household_size: "1",
    state: "NC",
    employment_type: "full_time",
  });
  const [focused, setFocused] = useState(null);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      gross_income:   parseFloat(form.gross_income),
      household_size: parseInt(form.household_size, 10),
    });
  };

  const base = {
    width: "100%",
    border: "1.5px solid #e2dbd3",
    borderRadius: "8px",
    padding: "0.72rem 0.95rem",
    fontSize: "0.9rem",
    background: "#faf8f5",
    color: "#1a1a1a",
    outline: "none",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    transition: "border-color 0.18s, box-shadow 0.18s, background 0.18s",
    boxSizing: "border-box",
    appearance: "none",
    WebkitAppearance: "none",
    opacity: loading ? 0.55 : 1,
  };

  const focusedStyle = (name) =>
    focused === name
      ? { borderColor: "#c0392b", boxShadow: "0 0 0 3px rgba(192,57,43,0.09)", background: "#fff" }
      : {};

  const fld = (name) => ({
    ...base,
    ...focusedStyle(name),
    cursor: loading ? "not-allowed" : undefined,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.18 }}
      style={{
        background: "white",
        borderRadius: "18px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.04)",
        padding: "2.25rem 2.25rem 2rem",
        width: "100%",
        maxWidth: "520px",
        border: "1px solid #ece6de",
      }}
    >
      {/* Card header */}
      <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "1.4rem", fontWeight: 900, color: "#1a1a1a",
          margin: "0 0 0.45rem",
        }}>
          Your Situation
        </h2>
        {/* Red rule */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
          <div style={{ flex: 1, height: 1, background: "#ece6de", maxWidth: 60 }} />
          <div style={{ width: 28, height: 2, background: "#c0392b", borderRadius: 2 }} />
          <div style={{ flex: 1, height: 1, background: "#ece6de", maxWidth: 60 }} />
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>

        {/* Annual income — full width, most important field */}
        <Field label="Annual Gross Income" hint="before taxes">
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: "0.95rem", top: "50%", transform: "translateY(-50%)",
              fontSize: "0.9rem", color: focused === "gross_income" ? "#c0392b" : "#aaa",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              transition: "color 0.18s", pointerEvents: "none",
            }}>$</span>
            <input
              type="number" name="gross_income" value={form.gross_income}
              onChange={handleChange}
              onFocus={() => setFocused("gross_income")}
              onBlur={() => setFocused(null)}
              placeholder="38,000"
              required min={0} disabled={loading}
              style={{ ...fld("gross_income"), paddingLeft: "1.8rem" }}
            />
          </div>
        </Field>

        {/* Two-column row: household + state */}
        <Row>
          <Field label="Household Size">
            <div style={{ position: "relative" }}>
              <select
                name="household_size" value={form.household_size}
                onChange={handleChange}
                onFocus={() => setFocused("household_size")}
                onBlur={() => setFocused(null)}
                disabled={loading}
                style={{ ...fld("household_size"), cursor: loading ? "not-allowed" : "pointer", paddingRight: "2rem" }}
              >
                {[1,2,3,4,5,6].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? "person" : "people"}</option>
                ))}
              </select>
              <ChevronDown focused={focused === "household_size"} />
            </div>
          </Field>

          <Field label="State">
            <div style={{ position: "relative" }}>
              <select
                name="state" value={form.state}
                onChange={handleChange}
                onFocus={() => setFocused("state")}
                onBlur={() => setFocused(null)}
                disabled={loading}
                style={{ ...fld("state"), cursor: loading ? "not-allowed" : "pointer", paddingRight: "2rem" }}
              >
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown focused={focused === "state"} />
            </div>
          </Field>
        </Row>

        {/* Employment type — full width */}
        <Field label="Employment Type">
          <div style={{ position: "relative" }}>
            <select
              name="employment_type" value={form.employment_type}
              onChange={handleChange}
              onFocus={() => setFocused("employment_type")}
              onBlur={() => setFocused(null)}
              disabled={loading}
              style={{ ...fld("employment_type"), cursor: loading ? "not-allowed" : "pointer", paddingRight: "2rem" }}
            >
              {EMPLOYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <ChevronDown focused={focused === "employment_type"} />
          </div>
        </Field>

        {/* Thin divider */}
        <div style={{ height: 1, background: "#f0ebe4", margin: "0.1rem 0" }} />

        {/* Submit */}
        <button
          type="submit" disabled={loading}
          style={{
            width: "100%",
            background: loading ? "#d4856e" : "#c0392b",
            color: "white", border: "none", borderRadius: "9px",
            padding: "0.95rem", fontSize: "0.975rem", fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            letterSpacing: "0.01em",
            boxShadow: loading ? "none" : "0 4px 18px rgba(192,57,43,0.32)",
            transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
          }}
          onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "#a93226"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 7px 24px rgba(192,57,43,0.4)"; }}}
          onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = "#c0392b"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(192,57,43,0.32)"; }}}
        >
          {loading ? <><ButtonSpinner />Calculating…</> : "Calculate My Cliff →"}
        </button>
      </form>
    </motion.div>
  );
}

/* Small custom chevron so selects look consistent across browsers */
function ChevronDown({ focused }) {
  return (
    <svg
      viewBox="0 0 10 6"
      width="10" height="6"
      fill="none"
      style={{
        position: "absolute", right: "0.85rem", top: "50%",
        transform: "translateY(-50%)", pointerEvents: "none",
        transition: "stroke 0.18s",
      }}
    >
      <path d="M1 1l4 4 4-4"
        stroke={focused ? "#c0392b" : "#aaa"}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}