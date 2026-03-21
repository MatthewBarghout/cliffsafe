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
  { value: "full_time", label: "Full-time Employee" },
  { value: "part_time", label: "Part-time Employee" },
  { value: "self_employed", label: "Self-Employed" },
  { value: "seasonal", label: "Seasonal Worker" },
];

export default function IncomeForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    gross_income: "",
    household_size: "1",
    state: "CA",
    employment_type: "full_time",
  });

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

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl shadow-md p-8 space-y-6 w-full max-w-lg"
    >
      <h2 className="text-2xl font-bold text-cliff-900">Your Situation</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Annual Gross Income ($)
        </label>
        <input
          type="number"
          name="gross_income"
          value={form.gross_income}
          onChange={handleChange}
          placeholder="e.g. 38000"
          required
          min={0}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cliff-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Household Size
        </label>
        <select
          name="household_size"
          value={form.household_size}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cliff-500"
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "person" : "people"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          State
        </label>
        <select
          name="state"
          value={form.state}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cliff-500"
        >
          {US_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Employment Type
        </label>
        <select
          name="employment_type"
          value={form.employment_type}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cliff-500"
        >
          {EMPLOYMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-cliff-600 hover:bg-cliff-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? "Calculating…" : "Calculate My Cliff"}
      </button>
    </motion.form>
  );
}
