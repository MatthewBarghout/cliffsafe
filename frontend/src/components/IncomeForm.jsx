mport { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const US_STATES = [
  { abbr: "AL", name: "Alabama" }, { abbr: "AK", name: "Alaska" },
  { abbr: "AZ", name: "Arizona" }, { abbr: "AR", name: "Arkansas" },
  { abbr: "CA", name: "California" }, { abbr: "CO", name: "Colorado" },
  { abbr: "CT", name: "Connecticut" }, { abbr: "DE", name: "Delaware" },
  { abbr: "FL", name: "Florida" }, { abbr: "GA", name: "Georgia" },
  { abbr: "HI", name: "Hawaii" }, { abbr: "ID", name: "Idaho" },
  { abbr: "IL", name: "Illinois" }, { abbr: "IN", name: "Indiana" },
  { abbr: "IA", name: "Iowa" }, { abbr: "KS", name: "Kansas" },
  { abbr: "KY", name: "Kentucky" }, { abbr: "LA", name: "Louisiana" },
  { abbr: "ME", name: "Maine" }, { abbr: "MD", name: "Maryland" },
  { abbr: "MA", name: "Massachusetts" }, { abbr: "MI", name: "Michigan" },
  { abbr: "MN", name: "Minnesota" }, { abbr: "MS", name: "Mississippi" },
  { abbr: "MO", name: "Missouri" }, { abbr: "MT", name: "Montana" },
  { abbr: "NE", name: "Nebraska" }, { abbr: "NV", name: "Nevada" },
  { abbr: "NH", name: "New Hampshire" }, { abbr: "NJ", name: "New Jersey" },
  { abbr: "NM", name: "New Mexico" }, { abbr: "NY", name: "New York" },
  { abbr: "NC", name: "North Carolina" }, { abbr: "ND", name: "North Dakota" },
  { abbr: "OH", name: "Ohio" }, { abbr: "OK", name: "Oklahoma" },
  { abbr: "OR", name: "Oregon" }, { abbr: "PA", name: "Pennsylvania" },
  { abbr: "RI", name: "Rhode Island" }, { abbr: "SC", name: "South Carolina" },
  { abbr: "SD", name: "South Dakota" }, { abbr: "TN", name: "Tennessee" },
  { abbr: "TX", name: "Texas" }, { abbr: "UT", name: "Utah" },
  { abbr: "VT", name: "Vermont" }, { abbr: "VA", name: "Virginia" },
  { abbr: "WA", name: "Washington" }, { abbr: "WV", name: "West Virginia" },
  { abbr: "WI", name: "Wisconsin" }, { abbr: "WY", name: "Wyoming" },
];

const EMPLOYMENT_TYPES = [
  {
    value: "full_time",
    label: "Full-time",
    sublabel: "Salaried or hourly, 35+ hrs/wk",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="6" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 6V5a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M10 11v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    value: "part_time",
    label: "Part-time",
    sublabel: "Under 35 hrs/wk",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: "gig",
    label: "Gig worker",
    sublabel: "Rideshare, delivery, freelance",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 13l4-4 3 3 4-5 3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: "self_employed",
    label: "Self-employed",
    sublabel: "Business owner, contractor",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    value: "seasonal",
    label: "Seasonal",
    sublabel: "Variable or temp work",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.05 5.05l1.41 1.41M13.54 13.54l1.41 1.41M5.05 14.95l1.41-1.41M13.54 6.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
];

const STAGGER = {
  container: { animate: { transition: { staggerChildren: 0.07 } } },
  item: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  },
};

/* ── Field wrapper ───────────────────────────────────────── */
function Field({ label, hint, children }) {
  return (
    <motion.div variants={STAGGER.item} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", letterSpacing: "0.01em" }}>
          {label}
        </label>
        {hint && <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>{hint}</span>}
      </div>
      {children}
    </motion.div>
  );
}

/* ── Styled input ────────────────────────────────────────── */
const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  fontSize: 15,
  border: "0.5px solid var(--color-border-secondary)",
  borderRadius: "var(--border-radius-md)",
  background: "var(--color-background-secondary)",
  color: "var(--color-text-primary)",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

/* ── Household size stepper ──────────────────────────────── */
function HouseholdStepper({ value, onChange }) {
  const n = parseInt(value, 10);
  const label = n === 1 ? "1 person" : `${n} people`;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", overflow: "hidden", background: "var(--color-background-secondary)" }}>
      <button
        type="button"
        onClick={() => n > 1 && onChange(String(n - 1))}
        disabled={n <= 1}
        style={{ padding: "10px 18px", fontSize: 18, background: "none", border: "none", color: n <= 1 ? "var(--color-text-tertiary)" : "var(--color-text-primary)", cursor: n <= 1 ? "default" : "pointer", fontWeight: 400, lineHeight: 1 }}
      >
        −
      </button>
      <span style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
        {label}
      </span>
      <button
        type="button"
        onClick={() => n < 8 && onChange(String(n + 1))}
        disabled={n >= 8}
        style={{ padding: "10px 18px", fontSize: 18, background: "none", border: "none", color: n >= 8 ? "var(--color-text-tertiary)" : "var(--color-text-primary)", cursor: n >= 8 ? "default" : "pointer", fontWeight: 400, lineHeight: 1 }}
      >
        +
      </button>
    </div>
  );
}

/* ── Employment type card selector ───────────────────────── */
function EmploymentSelector({ value, onChange }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
      {EMPLOYMENT_TYPES.map((t) => {
        const selected = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 6,
              padding: "12px 14px",
              borderRadius: "var(--border-radius-md)",
              border: selected
                ? "1.5px solid #1D9E75"
                : "0.5px solid var(--color-border-secondary)",
              background: selected
                ? "rgba(29,158,117,0.08)"
                : "var(--color-background-secondary)",
              color: selected ? "#0F6E56" : "var(--color-text-secondary)",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ color: selected ? "#1D9E75" : "var(--color-text-tertiary)" }}>
              {t.icon}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: selected ? "#0F6E56" : "var(--color-text-primary)", lineHeight: 1.2 }}>
              {t.label}
            </span>
            <span style={{ fontSize: 11, color: selected ? "#1D9E75" : "var(--color-text-tertiary)", lineHeight: 1.3 }}>
              {t.sublabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Income input with live FPL context ──────────────────── */
function IncomeInput({ value, onChange, householdSize }) {
  const fpl = 15650 + (parseInt(householdSize, 10) - 1) * 5500;
  const pct = value ? Math.round((parseFloat(value) / fpl) * 100) : null;

  const getContext = () => {
    if (!pct) return null;
    if (pct <= 100) return { text: "Below poverty line", color: "#A32D2D", bg: "rgba(226,75,74,0.08)" };
    if (pct <= 130) return { text: `${pct}% FPL — SNAP eligible`, color: "#854F0B", bg: "rgba(239,159,39,0.1)" };
    if (pct <= 138) return { text: `${pct}% FPL — Medicaid eligible`, color: "#854F0B", bg: "rgba(239,159,39,0.1)" };
    if (pct <= 200) return { text: `${pct}% FPL — near childcare cliff`, color: "#185FA5", bg: "rgba(55,138,221,0.08)" };
    return { text: `${pct}% FPL — above most thresholds`, color: "#3B6D11", bg: "rgba(99,153,34,0.08)" };
  };

  const ctx = getContext();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "var(--color-text-tertiary)", pointerEvents: "none" }}>
          $
        </span>
        <input
          type="number"
          name="gross_income"
          value={value}
          onChange={onChange}
          placeholder="38,000"
          required
          min={0}
          step={1000}
          style={{ ...inputStyle, paddingLeft: 26 }}
          onFocus={(e) => (e.target.style.borderColor = "#1D9E75")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-border-secondary)")}
        />
      </div>
      <AnimatePresence mode="wait">
        {ctx && (
          <motion.div
            key={ctx.text}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 99, background: ctx.bg, fontSize: 12, fontWeight: 500, color: ctx.color }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: ctx.color, flexShrink: 0 }} />
              {ctx.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main form ───────────────────────────────────────────── */
export default function IncomeForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    gross_income: "",
    household_size: "1",
    state: "NC",
    employment_type: "gig",
  });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const setField = (name, val) =>
    setForm((prev) => ({ ...prev, [name]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      gross_income: parseFloat(form.gross_income),
      household_size: parseInt(form.household_size, 10),
    });
  };

  const isReady = form.gross_income && parseFloat(form.gross_income) > 0;

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial="initial"
      animate="animate"
      variants={STAGGER.container}
      style={{
        background: "var(--color-background-primary)",
        borderRadius: "var(--border-radius-lg)",
        border: "0.5px solid var(--color-border-tertiary)",
        padding: "2rem",
        width: "100%",
        maxWidth: 520,
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <motion.div variants={STAGGER.item}>
        <h2 style={{ fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>
          Your situation
        </h2>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "4px 0 0" }}>
          We'll calculate exactly where your benefits cliff is.
        </p>
      </motion.div>

      {/* Annual income */}
      <Field label="Annual gross income" hint="before taxes">
        <IncomeInput
          value={form.gross_income}
          onChange={handleChange}
          householdSize={form.household_size}
        />
      </Field>

      {/* Household size */}
      <Field label="Household size" hint="including yourself">
        <HouseholdStepper
          value={form.household_size}
          onChange={(v) => setField("household_size", v)}
        />
      </Field>

      {/* State */}
      <Field label="State">
        <select
          name="state"
          value={form.state}
          onChange={handleChange}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "#1D9E75")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-border-secondary)")}
        >
          {US_STATES.map((s) => (
            <option key={s.abbr} value={s.abbr}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>

      {/* Employment type */}
      <Field label="Employment type">
        <EmploymentSelector
          value={form.employment_type}
          onChange={(v) => setField("employment_type", v)}
        />
      </Field>

      {/* Submit */}
      <motion.div variants={STAGGER.item}>
        <motion.button
          type="submit"
          disabled={loading || !isReady}
          whileTap={isReady && !loading ? { scale: 0.98 } : {}}
          style={{
            width: "100%",
            padding: "13px 0",
            fontSize: 15,
            fontWeight: 500,
            borderRadius: "var(--border-radius-md)",
            border: "none",
            background: isReady && !loading ? "#1D9E75" : "var(--color-background-secondary)",
            color: isReady && !loading ? "#fff" : "var(--color-text-tertiary)",
            cursor: isReady && !loading ? "pointer" : "default",
            transition: "background 0.2s, color 0.2s",
            letterSpacing: "0.01em",
          }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <LoadingSpinner /> Calculating…
            </span>
          ) : (
            "Calculate my cliff →"
          )}
        </motion.button>
      </motion.div>
    </motion.form>
  );
}

function LoadingSpinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: "spin 0.8s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" fill="none" strokeLinecap="round"/>
    </svg>
  );
}
