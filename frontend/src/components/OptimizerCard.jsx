import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Theme tokens ───────────────────────────────────────────── */
const T = {
  bg:           "#ffffff",
  bgSecondary:  "#f7f4ef",
  bgTertiary:   "#faf8f5",
  border:       "rgba(0,0,0,0.08)",
  borderMd:     "rgba(0,0,0,0.14)",
  textPrimary:  "#1a1a1a",
  textSecondary:"#555",
  textTertiary: "#999",
  green:        "#1D9E75",
  greenDark:    "#0F6E56",
  greenBg:      "rgba(29,158,117,0.08)",
  red:          "#c0392b",
  redAlt:       "#E24B4A",
  amber:        "#EF9F27",
  amberDark:    "#854F0B",
  blue:         "#378ADD",
  gray:         "#888780",
  radiusMd:     "10px",
  radiusLg:     "16px",
};

/* ── Formatters ─────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(n);

/* ── Priority config ────────────────────────────────────────── */
const PRIORITY = {
  high:   { label: "High priority", color: T.greenDark, bg: "rgba(29,158,117,0.1)",   dot: T.green },
  medium: { label: "Medium",        color: T.amberDark, bg: "rgba(239,159,39,0.1)",   dot: T.amber },
  low:    { label: "Low",           color: T.gray,      bg: "rgba(136,135,128,0.1)",  dot: T.gray  },
};

/* ── Stagger variants ───────────────────────────────────────── */
const STAGGER = {
  container: { animate: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } },
  item:      {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  },
};

/* ── Metric card ────────────────────────────────────────────── */
function GainMetric({ label, value, accent, sub }) {
  return (
    <div style={{
      background: T.bgSecondary, borderRadius: T.radiusMd,
      padding: "1rem 1.1rem", display: "flex", flexDirection: "column", gap: 4,
      position: "relative", overflow: "hidden",
      border: `1px solid rgba(0,0,0,0.05)`,
    }}>
      {accent && (
        <span style={{
          position: "absolute", top: 0, left: 0,
          width: 3, height: "100%", background: accent,
          borderRadius: "4px 0 0 4px",
        }} />
      )}
      <span style={{
        fontSize: 11, fontWeight: 600, color: T.textTertiary,
        textTransform: "uppercase", letterSpacing: "0.06em",
        paddingLeft: accent ? 8 : 0,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 22, fontWeight: 800, lineHeight: 1.2,
        color: accent ?? T.textPrimary, paddingLeft: accent ? 8 : 0,
        fontFamily: "'Playfair Display', Georgia, serif",
      }}>
        {value}
      </span>
      {sub && (
        <span style={{
          fontSize: 12, color: T.textTertiary, paddingLeft: accent ? 8 : 0,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          {sub}
        </span>
      )}
    </div>
  );
}

/* ── Step card ──────────────────────────────────────────────── */
function StepCard({ step, index }) {
  const [expanded, setExpanded] = useState(false);
  const p = PRIORITY[step.priority] ?? PRIORITY.low;
  const isPos = step.income_adjustment >= 0;

  return (
    <motion.div
      variants={STAGGER.item}
      style={{
        border: `0.5px solid ${T.borderMd}`, borderRadius: T.radiusMd,
        overflow: "hidden", background: T.bg,
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "flex-start",
          gap: 14, padding: "14px 16px",
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{
          width: 24, height: 24, borderRadius: "50%",
          background: p.bg, color: p.color, fontSize: 12, fontWeight: 600,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginTop: 1,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          {index + 1}
        </span>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 14, fontWeight: 500, color: T.textPrimary,
              lineHeight: 1.4, flex: 1,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
              {step.action}
            </span>
            <span style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 11, fontWeight: 600, padding: "3px 9px",
              borderRadius: 99, background: p.bg, color: p.color,
              whiteSpace: "nowrap", flexShrink: 0,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: p.dot }} />
              {p.label}
            </span>
          </div>

          <div style={{
            display: "flex", gap: 16, flexWrap: "wrap",
            fontSize: 12, color: T.textSecondary,
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            <span>
              Income adj:{" "}
              <strong style={{ fontWeight: 600, color: isPos ? T.green : T.redAlt }}>
                {isPos ? "+" : ""}{fmt(step.income_adjustment)}
              </strong>
            </span>
            <span>
              Benefits retained (post-tax):{" "}
              <strong style={{ fontWeight: 600, color: T.green }}>{fmt(step.benefits_preserved)}</strong>
            </span>
            <span>
              Net gain:{" "}
              <strong style={{ fontWeight: 600, color: T.green }}>
                {step.net_gain >= 0 ? `+${fmt(step.net_gain)}` : fmt(step.net_gain)}
              </strong>
            </span>
            <span style={{ marginLeft: "auto", color: T.textTertiary, fontSize: 11 }}>
              {expanded ? "▲ less" : "▼ more"}
            </span>
          </div>
        </div>
      </button>

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
            <div style={{
              padding: "12px 16px 14px 54px",
              fontSize: 13, color: T.textSecondary, lineHeight: 1.65,
              borderTop: `0.5px solid ${T.border}`,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
              {step.detail ?? "Pre-tax contribution that reduces your reportable income and preserves benefits eligibility."}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Animated "Find my best strategy" button ────────────────── */
function StrategyButton({ onClick, loading, disabled }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const isActive = !loading && !disabled;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Glow ring that expands on hover */}
      <motion.div
        animate={hovered && isActive
          ? { scale: 1.08, opacity: 1 }
          : { scale: 0.95, opacity: 0 }
        }
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{
          position: "absolute", inset: -4,
          borderRadius: 14,
          background: "rgba(29,158,117,0.15)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <motion.button
        type="button"
        onClick={onClick}
        disabled={!isActive}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => { setHovered(false); setPressed(false); }}
        onTapStart={() => setPressed(true)}
        onTap={() => setPressed(false)}
        onTapCancel={() => setPressed(false)}
        animate={
          pressed && isActive ? { scale: 0.96 } :
          hovered && isActive ? { scale: 1.04, y: -2 } :
          { scale: 1, y: 0 }
        }
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        style={{
          position: "relative", zIndex: 1,
          padding: "11px 26px",
          fontSize: 14, fontWeight: 700,
          borderRadius: 10, border: "none",
          background: isActive
            ? (hovered ? "#158a62" : T.green)
            : T.bgSecondary,
          color: isActive ? "#fff" : T.textTertiary,
          cursor: isActive ? "pointer" : "default",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          letterSpacing: "0.01em",
          boxShadow: isActive
            ? (hovered
                ? "0 8px 24px rgba(29,158,117,0.4), 0 2px 8px rgba(29,158,117,0.2)"
                : "0 4px 14px rgba(29,158,117,0.3)")
            : "none",
          transition: "background 0.2s, box-shadow 0.2s, color 0.2s",
          display: "flex", alignItems: "center", gap: "0.5rem",
        }}
      >
        {/* Animated arrow that slides right on hover */}
        {loading ? (
          <>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              style={{
                display: "inline-block", width: 14, height: 14,
                border: "2px solid rgba(255,255,255,0.35)",
                borderTopColor: "white", borderRadius: "50%",
              }}
            />
            Optimizing…
          </>
        ) : (
          <>
            Find my best strategy
            <motion.span
              animate={hovered && isActive ? { x: 4 } : { x: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={{ display: "inline-block", fontSize: 15 }}
            >
              →
            </motion.span>
          </>
        )}
      </motion.button>
    </div>
  );
}

/* ── Empty state ────────────────────────────────────────────── */
function EmptyState({ onRun, loading, disabled }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 14, padding: "2.5rem 1rem",
      borderRadius: T.radiusMd, background: T.bgSecondary, textAlign: "center",
      border: `1px solid rgba(0,0,0,0.05)`,
    }}>
      {/* Icon */}
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M6 24l6-8 5 5 4-6 5 9"
          stroke={T.textTertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="8" r="4" stroke={T.green} strokeWidth="1.5" />
        <path d="M22.5 8h3M24 6.5v3" stroke={T.green} strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      <div>
        <p style={{
          fontSize: 14, fontWeight: 600, color: T.textPrimary, margin: 0,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          Run the optimizer
        </p>
        <p style={{
          fontSize: 13, color: T.textSecondary, margin: "4px 0 0", lineHeight: 1.55,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          We'll find strategies to maximize your real net income<br />without losing benefits.
        </p>
      </div>

      <StrategyButton onRun={onRun} onClick={onRun} loading={loading} disabled={disabled} />
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function OptimizerCard({ formData, optimizeIncome }) {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleOptimize = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await optimizeIncome(formData);
      setResult(data);
    } catch {
      setError("Could not reach the optimizer. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: T.bg,
      borderRadius: T.radiusLg,
      border: `1px solid ${T.border}`,
      boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
      padding: "1.75rem",
      width: "100%",
      display: "flex", flexDirection: "column", gap: "1.5rem",
      boxSizing: "border-box",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
            <div style={{ width: 18, height: 2, background: T.green, borderRadius: 2 }} />
            <span style={{ fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.14em", color: T.green, textTransform: "uppercase" }}>
              Income Optimizer
            </span>
          </div>
          <h2 style={{
            fontSize: 20, fontWeight: 800, color: T.textPrimary, margin: 0,
            fontFamily: "'Playfair Display', Georgia, serif",
          }}>
            Find your best strategy
          </h2>
          <p style={{ fontSize: 13, color: T.textTertiary, margin: "4px 0 0" }}>
            Pre-tax moves to keep you benefit-eligible while earning more.
          </p>
        </div>

        {result && (
          <button
            type="button"
            onClick={handleOptimize}
            disabled={loading}
            style={{
              padding: "8px 16px", fontSize: 13, fontWeight: 500,
              borderRadius: T.radiusMd, border: `0.5px solid ${T.borderMd}`,
              background: T.bgSecondary, color: T.textSecondary,
              cursor: loading ? "default" : "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#ede8df"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = T.bgSecondary; }}
          >
            {loading ? "Recalculating…" : "Recalculate"}
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          padding: "10px 14px", borderRadius: T.radiusMd,
          background: "rgba(226,75,74,0.08)", border: "0.5px solid rgba(226,75,74,0.25)",
          fontSize: 13, color: "#A32D2D",
        }}>
          {error}
        </div>
      )}

      {/* ── Results or empty state ── */}
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key="results"
            initial="initial" animate="animate"
            variants={STAGGER.container}
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            {/* Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
              <GainMetric label="Total compensation"  value={fmt(result.current_net)} sub="post-tax + benefits" />
              <GainMetric label="Optimized total"    value={fmt(result.optimized_net)} accent={T.green} sub="post-tax + benefits" />
              <GainMetric
                label="Net gain"
                value={result.net_gain >= 0 ? `+${fmt(result.net_gain)}` : fmt(result.net_gain)}
                accent={T.green}
                sub={Math.abs(result.net_gain - result.benefits_retained) > 1
                  ? "post-tax, per year · includes tax savings"
                  : "post-tax, per year"}
              />
              <GainMetric
                label={result.net_gain > 0 ? "Benefits retained" : "Benefits at risk"}
                value={fmt(result.benefits_retained)}
                accent={T.blue}
                sub={result.net_gain === 0 ? "if cliff crossed · post-tax annual value" : "post-tax · annual value"}
              />
            </div>

            {/* Strategy callout */}
            {result.steps.length > 0 && result.strategy_name && (
              <motion.div
                variants={STAGGER.item}
                style={{
                  borderLeft: `3px solid ${T.green}`,
                  background: T.greenBg,
                  borderRadius: `0 ${T.radiusMd} ${T.radiusMd} 0`,
                  padding: "12px 16px",
                }}
              >
                <p style={{
                  fontSize: 11, fontWeight: 700, color: T.greenDark,
                  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5,
                }}>
                  Strategy — {result.strategy_name}
                </p>
                <p style={{ fontSize: 13, color: T.textSecondary, margin: 0, lineHeight: 1.65 }}>
                  {result.summary}
                </p>
              </motion.div>
            )}

            {/* No-steps message */}
            {result.steps.length === 0 && (
              <motion.div
                variants={STAGGER.item}
                style={{
                  borderLeft: `3px solid ${T.borderMd}`,
                  background: T.bgSecondary,
                  borderRadius: `0 ${T.radiusMd} ${T.radiusMd} 0`,
                  padding: "12px 16px",
                }}
              >
                <p style={{ fontSize: 13, color: T.textSecondary, margin: 0, lineHeight: 1.65 }}>
                  {result.summary}
                </p>
              </motion.div>
            )}

            {/* Step cards */}
            {result.steps.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{
                  fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.06em", color: T.textTertiary, marginBottom: 2,
                }}>
                  Action steps — click to expand
                </p>
                {result.steps.map((step, i) => (
                  <StepCard key={i} step={step} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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