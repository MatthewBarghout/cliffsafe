import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ResultsPanel from "../components/ResultsPanel";
import CliffChart from "../components/CliffChart";
import OptimizerCard from "../components/OptimizerCard";
import MonteCarloSection from "../components/MonteCarloSection";
import AdvisorChat from "../components/AdvisorChat";
import { ResultsSkeleton } from "../components/Loading";
import { optimizeIncome, runMonteCarlo } from "../services/api";

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [monteCarlo, setMonteCarlo] = useState(null);

  useEffect(() => {
    if (state?.results) {
      const t = setTimeout(() => setReady(true), 900);
      return () => clearTimeout(t);
    }
  }, [state]);

  // Run Monte Carlo in the background after results load
  useEffect(() => {
    if (!state?.formData) return;
    runMonteCarlo(state.formData)
      .then(({ data }) => setMonteCarlo(data))
      .catch(() => {}); // non-critical, fail silently
  }, [state?.formData]);

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!state?.results) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f7f4ef 0%, #ede8df 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.25rem",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');`}</style>
        <p style={{ color: "#888", fontSize: "0.95rem" }}>No results to display.</p>
        <button
          onClick={() => navigate("/calculator")}
          style={{
            background: "#c0392b", color: "white", border: "none",
            borderRadius: "8px", padding: "0.75rem 1.6rem",
            fontSize: "0.925rem", fontWeight: 600, cursor: "pointer",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            boxShadow: "0 4px 14px rgba(192,57,43,0.3)",
          }}
        >
          Go to Calculator
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f7f4ef 0%, #ede8df 45%, #e8ddd0 100%)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        position: "relative",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin-ring {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .grain-results {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 200px;
        }
      `}</style>

      <div className="grain-results" />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
              <div style={{ width: 22, height: 2, background: "#c0392b" }} />
              <span style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.14em", color: "#c0392b", textTransform: "uppercase" }}>
                Your Analysis
              </span>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 900, color: "#1a1a1a", lineHeight: 1.15 }}>
              Your Results
            </h1>
          </div>
          <button
            onClick={() => navigate("/calculator")}
            style={{
              background: "white", border: "1.5px solid #e8e2d9", borderRadius: "8px",
              padding: "0.55rem 1.1rem", fontSize: "0.825rem", fontWeight: 600,
              color: "#555", cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif",
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c0392b"; e.currentTarget.style.color = "#c0392b"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e8e2d9"; e.currentTarget.style.color = "#555"; }}
          >
            ← Recalculate
          </button>
        </div>

        {/* Skeleton → real content */}
        <AnimatePresence mode="wait">
          {!ready ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              transition={{ duration: 0.3 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "1.75rem" }}>
                <div style={{
                  width: "18px", height: "18px", borderRadius: "50%",
                  border: "2.5px solid #c0392b", borderTopColor: "transparent",
                  animation: "spin-ring 0.8s linear infinite", flexShrink: 0,
                }} />
                <span style={{ fontSize: "0.825rem", color: "#888" }}>
                  Building your cliff analysis…
                </span>
              </div>
              <ResultsSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
            >
              <CliffChart
                data={state.results.net_income_curve?.map((p) => ({
                  gross: p.gross_income,
                  netIncome: p.total_compensation,
                }))}
                householdSize={state.formData?.household_size}
                userIncome={state.formData?.gross_income}
              />
              <ResultsPanel data={state.results} monteCarlo={monteCarlo} />
              <MonteCarloSection data={monteCarlo} />
              <OptimizerCard formData={state.formData} optimizeIncome={optimizeIncome} />
              <AdvisorChat results={state.results} formData={state.formData} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}