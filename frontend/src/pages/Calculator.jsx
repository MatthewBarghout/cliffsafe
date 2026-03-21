import { useState } from "react";
import { useNavigate } from "react-router-dom";
import IncomeForm from "../components/IncomeForm";
import { calculateCliff } from "../services/api";

export default function Calculator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await calculateCliff(formData);
      navigate("/results", { state: { results: data, formData } });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail[0]?.msg ?? "Validation error"
          : "Failed to connect to the backend. Make sure the API is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cliff-50 to-white flex flex-col items-center py-16 px-6">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-cliff-900">Benefits Cliff Calculator</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Enter your details below to see where the cliff hits — and how hard.
          </p>
        </div>

        {error && (
          <div className="bg-danger-50 border border-danger-200 text-danger-600 rounded-xl px-5 py-4 text-sm">
            {error}
          </div>
        )}

        <IncomeForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}
