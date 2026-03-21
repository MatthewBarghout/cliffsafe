import { motion } from "framer-motion";

function fmt(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function StatCard({ label, value, color = "text-cliff-700" }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </span>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
    </div>
  );
}

export default function ResultsPanel({ data }) {
  if (!data) return null;

  const {
    gross_income,
    net_income,
    total_benefits,
    total_compensation,
    cliff_points,
    benefits,
    effective_marginal_rate,
    recommendation,
  } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-white rounded-2xl shadow-md p-8 space-y-8 w-full"
    >
      <h2 className="text-2xl font-bold text-cliff-900">Your Benefits Cliff Analysis</h2>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Gross Income" value={fmt(gross_income)} />
        <StatCard label="Net Income" value={fmt(net_income)} color="text-safe-600" />
        <StatCard label="Total Benefits" value={fmt(total_benefits)} color="text-cliff-600" />
        <StatCard
          label="Effective Marginal Rate"
          value={`${(effective_marginal_rate * 100).toFixed(0)}%`}
          color="text-danger-500"
        />
      </div>

      {/* Cliff points */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Cliff Points Detected</h3>
        <div className="space-y-3">
          {cliff_points.map((cp, i) => (
            <div
              key={i}
              className="border-l-4 border-danger-500 bg-danger-50 rounded-r-xl px-4 py-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-danger-600">
                  At {fmt(cp.income_level)}
                </span>
                <span className="text-sm text-danger-500 font-medium">
                  Benefits lost: {fmt(cp.benefits_lost)}
                </span>
              </div>
              <p className="text-sm text-gray-600">{cp.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                Net income change: {cp.net_change < 0 ? "−" : "+"}
                {fmt(Math.abs(cp.net_change))}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Benefits Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 pr-4">Program</th>
                <th className="pb-2 pr-4">Monthly Value</th>
                <th className="pb-2 pr-4">Annual Value</th>
                <th className="pb-2 pr-4">Income Limit</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {benefits.map((b) => (
                <tr key={b.name} className="border-b last:border-0">
                  <td className="py-2.5 pr-4 font-medium">{b.name}</td>
                  <td className="py-2.5 pr-4 text-gray-600">{fmt(b.monthly_value)}</td>
                  <td className="py-2.5 pr-4 text-gray-600">{fmt(b.annual_value)}</td>
                  <td className="py-2.5 pr-4 text-gray-600">{fmt(b.eligibility_threshold)}</td>
                  <td className="py-2.5">
                    {b.currently_eligible ? (
                      <span className="bg-safe-100 text-safe-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                        Eligible
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded-full">
                        Ineligible
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-cliff-50 border border-cliff-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-cliff-700 uppercase tracking-wide mb-2">
          Recommendation
        </h3>
        <p className="text-gray-700 text-sm">{recommendation}</p>
      </div>
    </motion.div>
  );
}
