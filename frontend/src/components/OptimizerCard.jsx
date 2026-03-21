import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";


/* ── Helpers ─────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const PRIORITY = {
  high: {
    label: "High priority",
    color: "#0F6E56",
    bg: "rgba(29,158,117,0.1)",
    dot: "#1D9E75",
  },
  medium: {
    label: "Medium",
    color: "#854F0B",
    bg: "rgba(239,159,39,0.1)",
    dot: "#EF9F27",
  },
  low: {
    label: "Low",
    color: "#5F5E5A",
    bg: "rgba(136,135,128,0.1)",
    dot: "#888780",
  },
};

const STAGGER = {
  container: {
    animate: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
  },
  item: {
    initial: { opacity: 0, y: 12 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: "easeOut" },
    },
  },
};

/* ── Net gain counter ────────────────────────────────────── */
function GainMetric({ label, value, accent, sub }) {
  return (
    <div
      style={{
        background: "var(--color-background-secondary)",
        borderRadius: "var(--border-radius-md)",
        padding: "1rem 1.1rem",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {accent && (
        <span
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 3,
            height: "100%",
            background: accent,
            borderRadius: "4px 0 0 4px",
          }}
        />
      )}
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "var(--color-text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          paddingLeft: accent ? 8 : 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 22,
          fontWeight: 500,
          color: accent ?? "var(--color-text-primary)",
          paddingLeft: accent ? 8 : 0,
          lineHeight: 1.2,
        }}
      >
        {value}
      </span>
      {sub && (
        <span
          style={{
            fontSize: 12,
            color: "var(--color-text-tertiary)",
            paddingLeft: accent ? 8 : 0,
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

/* ── Step card ───────────────────────────────────────────── */
function StepCard({ step, index }) {
  const [expanded, setExpanded] = useState(false);
  const p = PRIORITY[step.priority] ?? PRIORITY.low;
  const isPositiveAdj = step.income_adjustment >= 0;

  return (
    <motion.div
      variants={STAGGER.item}
      style={{
        border: "0.5px solid var(--color-border-secondary)",
        borderRadius: "var(--border-radius-md)",
        overflow: "hidden",
        background: "var(--color-background-primary)",
      }}
    >
      {/* Step header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          padding: "14px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {/* Step number */}
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: p.bg,
            color: p.color,
            fontSize: 12,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          {index + 1}
        </span>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Action + priority badge */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "var(--color-text-primary)",
                lineHeight: 1.4,
                flex: 1,
              }}
            >
              {step.action}
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontWeight: 500,
                padding: "3px 9px",
                borderRadius: 99,
                background: p.bg,
                color: p.color,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: p.dot,
                }}
              />
              {p.label}
            </span>
          </div>

          {/* Metrics row */}
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              fontSize: 12,
              color: "var(--color-text-secondary)",
            }}
          >
            <span>
              Income adj:{" "}
              <strong
                style={{
                  fontWeight: 500,
                  color: isPositiveAdj ? "#1D9E75" : "#E24B4A",
                }}
              >
                {isPositiveAdj ? "+" : ""}
                {fmt(step.income_adjustment)}
              </strong>
            </span>
            <span>
              Benefits retained:{" "}
              <strong style={{ fontWeight: 500, color: "#1D9E75" }}>
                {fmt(step.benefits_preserved)}
              </strong>
            </span>
            <span>
              Net gain:{" "}
              <strong style={{ fontWeight: 500, color: "#1D9E75" }}>
                +{fmt(step.net_gain)}
              </strong>
            </span>
            <span
              style={{
                marginLeft: "auto",
                color: "var(--color-text-tertiary)",
                fontSize: 11,
              }}
            >
              {expanded ? "▲ less" : "▼ more"}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                padding: "0 16px 14px 54px",
                fontSize: 13,
                color: "var(--color-text-secondary)",
                lineHeight: 1.65,
                borderTop: "0.5px solid var(--color-border-tertiary)",
                paddingTop: 12,
              }}
            >
              {step.detail ?? "Pre-tax contribution that reduces your reportable income and preserves benefits eligibility."}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Empty state ─────────────────────────────────────────── */
function EmptyState({ onRun, loading, disabled }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "2.5rem 1rem",
        borderRadius: "var(--border-radius-md)",
        background: "var(--color-background-secondary)",
        textAlign: "center",
      }}
    >
      {/* Icon */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        <path
          d="M6 24l6-8 5 5 4-6 5 9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="24"
          cy="8"
          r="4"
          stroke="#1D9E75"
          strokeWidth="1.5"
        />
        <path
          d="M22.5 8h3M24 6.5v3"
          stroke="#1D9E75"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <div>
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          Run the optimizer
        </p>
        <p
          style={{
            fontSize: 13,
            color: "var(--color-text-secondary)",
            margin: "4px 0 0",
          }}
        >
          We'll find strategies to maximize your real net income without
          losing benefits.
        </p>
      </div>
      <button
        type="button"
        onClick={onRun}
        disabled={loading || disabled}
        style={{
          marginTop: 4,
          padding: "10px 24px",
          fontSize: 14,
          fontWeight: 500,
          borderRadius: "var(--border-radius-md)",
          border: "none",
          background: disabled || loading ? "var(--color-background-secondary)" : "#1D9E75",
          color: disabled || loading ? "var(--color-text-tertiary)" : "#fff",
          cursor: disabled || loading ? "default" : "pointer",
          transition: "background 0.15s",
        }}
      >
        {loading ? "Optimizing…" : "Find my best strategy →"}
      </button>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */
export default function OptimizerCard({ formData, optimizeIncome }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOptimize = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await optimizeIncome(formData);
      // Compute benefits_retained from steps if not returned by API
      if (data.benefits_retained == null) {
        data.benefits_retained = (data.steps ?? []).reduce(
          (sum, s) => sum + (s.benefits_preserved ?? 0),
          0
        );
      }
      setResult(data);
    } catch {
      setError("Could not reach the optimizer. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        borderRadius: "var(--border-radius-lg)",
        border: "0.5px solid var(--color-border-tertiary)",
        padding: "2rem",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        boxSizing: "border-box",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            Income optimizer
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-text-secondary)",
              margin: "4px 0 0",
            }}
          >
            Pre-tax strategies to keep you benefit-eligible while earning more.
          </p>
        </div>

        {result && (
          <button
            type="button"
            onClick={handleOptimize}
            disabled={loading}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 500,
              borderRadius: "var(--border-radius-md)",
              border: "0.5px solid var(--color-border-secondary)",
              background: "var(--color-background-secondary)",
              color: "var(--color-text-secondary)",
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Recalculating…" : "Recalculate"}
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "var(--border-radius-md)",
            background: "rgba(226,75,74,0.08)",
            border: "0.5px solid rgba(226,75,74,0.25)",
            fontSize: 13,
            color: "#A32D2D",
          }}
        >
          {error}
        </div>
      )}

      {/* ── Results ── */}
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key="results"
            initial="initial"
            animate="animate"
            variants={STAGGER.container}
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            {/* Metric row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 10,
              }}
            >
              <GainMetric
                label="Current net"
                value={fmt(result.current_net)}
              />
              <GainMetric
                label="Optimized net"
                value={fmt(result.optimized_net)}
                accent="#1D9E75"
                sub="gross + retained benefits"
              />
              <GainMetric
                label="Net gain"
                value={`+${fmt(result.net_gain)}`}
                accent="#1D9E75"
                sub="per year"
              />
              <GainMetric
                label="Benefits retained"
                value={fmt(result.benefits_retained)}
                accent="#378ADD"
              />
            </div>

            {/* Strategy summary */}
            <motion.div
              variants={STAGGER.item}
              style={{
                borderLeft: "3px solid #1D9E75",
                background: "rgba(29,158,117,0.06)",
                borderRadius: "0 var(--border-radius-md) var(--border-radius-md) 0",
                padding: "12px 16px",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#0F6E56",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 5,
                }}
              >
                Strategy — {result.strategy_name}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--color-text-secondary)",
                  margin: 0,
                  lineHeight: 1.65,
                }}
              >
                {result.summary}
              </p>
            </motion.div>

            {/* Step cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--color-text-tertiary)",
                  marginBottom: 2,
                }}
              >
                Action steps — click to expand
              </p>
              {result.steps.map((step, i) => (
                <StepCard key={i} step={step} index={i} />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <EmptyState
              onRun={handleOptimize}
              loading={loading}
              disabled={!optimizeIncome || !formData}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
