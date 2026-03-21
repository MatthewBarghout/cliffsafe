import { useLocation, useNavigate } from "react-router-dom";
import ResultsPanel from "../components/ResultsPanel";
import CliffChart from "../components/CliffChart";
import OptimizerCard from "../components/OptimizerCard";
import AdvisorChat from "../components/AdvisorChat";
import { optimizeIncome } from "../services/api";

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state?.results) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">No results to display.</p>
        <button
          onClick={() => navigate("/calculator")}
          className="bg-cliff-600 text-white px-6 py-2.5 rounded-lg font-semibold"
        >
          Go to Calculator
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cliff-50 to-white py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-cliff-900">Your Results</h1>
          <button
            onClick={() => navigate("/calculator")}
            className="text-cliff-600 hover:underline text-sm font-medium"
          >
            ← Recalculate
          </button>
        </div>

        <CliffChart
          data={state.results.net_income_curve?.map((p) => ({
            gross: p.gross_income,
            netIncome: p.total_compensation,
          }))}
          householdSize={state.formData?.household_size}
          userIncome={state.formData?.gross_income}
        />
        <ResultsPanel data={state.results} />
        <OptimizerCard formData={state.formData} optimizeIncome={optimizeIncome} />
        <AdvisorChat results={state.results} formData={state.formData} />
      </div>
    </div>
  );
}
