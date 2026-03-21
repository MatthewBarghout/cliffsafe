import { useState } from "react";
import { motion } from "framer-motion";
import { optimizeIncome } from "../services/api";

function fmt(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

const PRIORITY_COLORS = {
  high: "bg-safe-100 text-safe-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};

export default function OptimizerCard({ formData }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOptimize = async () => {
    if (!formData) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await optimizeIncome(formData);
      setResult(data);
    } catch {
      setError("Could not fetch optimization. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-8 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-cliff-900">Income Optimizer</h2>
          <p className="text-gray-500 text-sm mt-1">
            See how pre-tax strategies can keep you benefit-eligible.
          </p>
        </div>
        <button
          onClick={handleOptimize}
          disabled={loading || !formData}
          className="bg-safe-500 hover:bg-safe-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm"
        >
          {loading ? "Optimizing…" : "Run Optimizer"}
        </button>
      </div>

      {error && (
        <p className="text-danger-500 text-sm">{error}</p>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Net gain summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Current Net", value: fmt(result.current_net) },
              { label: "Optimized Net", value: fmt(result.optimized_net), color: "text-safe-600" },
              { label: "Net Gain", value: `+${fmt(result.net_gain)}`, color: "text-safe-600" },
            ].map(({ label, value, color = "text-cliff-900" }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                <p className={`text-xl font-bold ${color} mt-1`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Strategy name */}
          <div>
            <p className="text-xs font-semibold text-cliff-600 uppercase tracking-wide">
              Strategy: {result.strategy_name}
            </p>
            <p className="text-sm text-gray-600 mt-1">{result.summary}</p>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {result.steps.map((step, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-medium text-gray-800">{step.action}</p>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                      PRIORITY_COLORS[step.priority] || PRIORITY_COLORS.low
                    }`}
                  >
                    {step.priority} priority
                  </span>
                </div>
                <div className="flex gap-6 mt-2 text-xs text-gray-500">
                  <span>Income adj: {fmt(step.income_adjustment)}</span>
                  <span>Benefits preserved: {fmt(step.benefits_preserved)}</span>
                  <span className="text-safe-600 font-semibold">Net gain: +{fmt(step.net_gain)}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!result && !loading && (
        <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 text-sm">
          Run the optimizer to see recommended strategies for your income level.
        </div>
      )}
    </div>
  );
}
