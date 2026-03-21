import { useState } from "react";
import { motion } from "framer-motion";

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
  { value: "self_employed", label: "Self-Employed" },
  { value: "seasonal",      label: "Seasonal Worker" },
];

const fieldStyle = {
  width: "100%",
  border: "1.5px solid #ddd6cc",
  borderRadius: "8px",
  padding: "0.75rem 1rem",
  fontSize: "0.925rem",
  background: "#faf8f4",
  color: "#1a1a1a",
  outline: "none",
  fontFamily: "'DM Sans', system-ui, sans-serif",
  transition: "border-color 0.18s, box-shadow 0.18s",
  boxSizing: "border-box",
};

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label
        style={{
          fontSize: "0.78rem",
          fontWeight: 600,
          color: "#555",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {label}
      </label>
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
      gross_income: parseFloat(form.gross_income),
      household_size: parseInt(form.household_size, 10),
    });
  };

  const focusStyle = (name) =>
    focused === name
      ? { borderColor: "#c0392b", boxShadow: "0 0 0 3px rgba(192,57,43,0.1)" }
      : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      style={{
        background: "white",
        borderRadius: "16px",
        boxShadow: "0 4px 32px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
        padding: "2.5rem",
        width: "100%",
        maxWidth: "520px",
        border: "1px solid #e8e2d9",
      }}
    >
      {/* Card header */}
      <div style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "#1a1a1a",
            marginBottom: "0.3rem",
            textAlign: "center",
          }}
        >
          Your Situation
        </h2>
        <div
          style={{
            width: "36px",
            height: "2px",
            background: "#c0392b",
            margin: "0 auto",
          }}
        />
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}>
        <Field label="Annual Gross Income ($)">
          <input
            type="number"
            name="gross_income"
            value={form.gross_income}
            onChange={handleChange}
            onFocus={() => setFocused("gross_income")}
            onBlur={() => setFocused(null)}
            placeholder="e.g. 38,000"
            required
            min={0}
            style={{ ...fieldStyle, ...focusStyle("gross_income") }}
          />
        </Field>

        <Field label="Household Size">
          <select
            name="household_size"
            value={form.household_size}
            onChange={handleChange}
            onFocus={() => setFocused("household_size")}
            onBlur={() => setFocused(null)}
            style={{ ...fieldStyle, ...focusStyle("household_size"), cursor: "pointer" }}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "person" : "people"}
              </option>
            ))}
          </select>
        </Field>

        <Field label="State">
          <select
            name="state"
            value={form.state}
            onChange={handleChange}
            onFocus={() => setFocused("state")}
            onBlur={() => setFocused(null)}
            style={{ ...fieldStyle, ...focusStyle("state"), cursor: "pointer" }}
          >
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>

        <Field label="Employment Type">
          <select
            name="employment_type"
            value={form.employment_type}
            onChange={handleChange}
            onFocus={() => setFocused("employment_type")}
            onBlur={() => setFocused(null)}
            style={{ ...fieldStyle, ...focusStyle("employment_type"), cursor: "pointer" }}
          >
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Field>

        {/* Divider */}
        <div style={{ height: "1px", background: "#ede8df", margin: "0.25rem 0" }} />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            background: loading ? "#ddd" : "#c0392b",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "0.95rem",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            letterSpacing: "0.01em",
            transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
            boxShadow: loading ? "none" : "0 4px 16px rgba(192,57,43,0.3)",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = "#a93226";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(192,57,43,0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.background = "#c0392b";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(192,57,43,0.3)";
            }
          }}
        >
          {loading ? "Calculating…" : "Calculate My Cliff →"}
        </button>

        <p
          style={{
            textAlign: "center",
            fontSize: "0.75rem",
            color: "#aaa",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          Free to use · No account required
        </p>
      </form>
    </motion.div>
  );
}