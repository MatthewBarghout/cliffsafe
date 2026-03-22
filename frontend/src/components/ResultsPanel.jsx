import { motion, AnimatePresence } from "framer-motion";

const MOCK_DATA = {
  gross_income: 28000,
  net_income: 24800,
  total_benefits: 21092,
  total_compensation: 49092,
  effective_marginal_rate: 0.68,
  cliff_points: [
    {
      income_level: 20345,
      benefits_lost: 3492,
      net_change: -1847,
      program: "SNAP",
      description: "Exceeding 130% FPL removes your SNAP food benefit entirely.",
    },
    {
      income_level: 21597,
      benefits_lost: 7800,
      net_change: -6548,
      program: "Medicaid",
      description:
        "At 138% FPL, Medicaid eligibility ends. This is the steepest cliff — worth ~$650/month in coverage.",
    },
    {
      income_level: 31300,
      benefits_lost: 9600,
      net_change: -8300,
      program: "CCAP",
      description:
        "Childcare assistance ends at 200% FPL. For families, this is often the most painful loss.",
    },
  ],
  benefits: [
    {
      name: "Medicaid",
      monthly_value: 650,
      annual_value: 7800,
      eligibility_threshold: 21597,
      currently_eligible: true,
    },
    {
      name: "SNAP",
      monthly_value: 291,
      annual_value: 3492,
      eligibility_threshold: 20345,
      currently_eligible: false,
    },
    {
      name: "CCAP (childcare)",
      monthly_value: 800,
      annual_value: 9600,
      eligibility_threshold: 31300,
      currently_eligible: true,
    },
    {
      name: "ACA subsidies",
      monthly_value: 183,
      annual_value: 2196,
      eligibility_threshold: 58350,
      currently_eligible: true,
    },
  ],
  recommendation:
    "At your current income, you are $1,345 below the Medicaid cliff. Accepting a raise above $21,597 would cost you roughly $6,548 in net compensation. Consider negotiating non-cash benefits, timing raises after open enrollment, or asking about employer-sponsored health coverage before crossing this threshold.",
};

/* ── Helpers ──────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const STAGGER = {
  container: {
    animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  },
  item: {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } },
  },
};

/* ── Metric card ─────────────────────────────────────────── */
function MetricCard({ label, value, sub, accent }) {
  return (
    <motion.div
      variants={STAGGER.item}
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
    </motion.div>
  );
}

/* ── Marginal rate bar ───────────────────────────────────── */
function MarginalRateBar({ rate }) {
  const pct = Math.min(rate * 100, 100);
  const color =
    pct >= 80 ? "#E24B4A" : pct >= 50 ? "#EF9F27" : "#1D9E75";

  return (
    <motion.div variants={STAGGER.item}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <span
          style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}
        >
          Effective marginal rate
        </span>
        <span style={{ fontSize: 18, fontWeight: 500, color }}>
          {Math.round(pct)}%
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: "var(--color-background-secondary)",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
          style={{ height: "100%", background: color, borderRadius: 99 }}
        />
      </div>
      <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 6 }}>
        For every $1 earned above your current income,{" "}
        <strong style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>
          {Math.round(pct)}¢
        </strong>{" "}
        is lost through taxes + benefit reductions.
      </p>
    </motion.div>
  );
}

/* ── Cliff point card ────────────────────────────────────── */
const PROGRAM_COLORS = {
  SNAP: { border: "#EF9F27", bg: "rgba(239,159,39,0.07)", text: "#854F0B" },
  Medicaid: { border: "#E24B4A", bg: "rgba(226,75,74,0.07)", text: "#A32D2D" },
  CCAP: { border: "#D85A30", bg: "rgba(216,90,48,0.07)", text: "#993C1D" },
  default: { border: "#888780", bg: "rgba(136,135,128,0.07)", text: "#5F5E5A" },
};

function CliffCard({ cp, index }) {
  const palette = PROGRAM_COLORS[cp.program] ?? PROGRAM_COLORS.default;
  const isNegative = cp.net_change < 0;

  return (
    <motion.div
      variants={STAGGER.item}
      style={{
        borderLeft: `3px solid ${palette.border}`,
        background: palette.bg,
        borderRadius: "0 var(--border-radius-md) var(--border-radius-md) 0",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: "3px 8px",
              borderRadius: 99,
              background: palette.border + "22",
              color: palette.text,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {cp.program}
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: palette.text,
            }}
          >
            at {fmt(cp.income_level)}
          </span>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
          <span style={{ color: "var(--color-text-secondary)" }}>
            Benefits lost:{" "}
            <strong style={{ color: palette.text, fontWeight: 500 }}>
              {fmt(cp.benefits_lost)} (annual value)
            </strong>
          </span>
          <span
            style={{
              color: isNegative ? "#A32D2D" : "#3B6D11",
              fontWeight: 500,
            }}
          >
            {isNegative ? "−" : "+"}
            {fmt(Math.abs(cp.net_change))} net (post-tax)
          </span>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
        {cp.description}
      </p>
    </motion.div>
  );
}

/* ── Benefits breakdown table ────────────────────────────── */
function BenefitsTable({ benefits }) {
  return (
    <motion.div variants={STAGGER.item} style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          fontSize: 13,
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <colgroup>
          <col style={{ width: "28%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "14%" }} />
        </colgroup>
        <thead>
          <tr
            style={{
              borderBottom: "0.5px solid var(--color-border-secondary)",
              color: "var(--color-text-tertiary)",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {["Program", "Monthly (post-tax)", "Annual (post-tax)", "Income limit (gross)", "Status"].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    paddingBottom: 8,
                    fontWeight: 500,
                    textAlign: "left",
                  }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {benefits.map((b, i) => (
            <tr
              key={b.name}
              style={{
                borderBottom:
                  i < benefits.length - 1
                    ? "0.5px solid var(--color-border-tertiary)"
                    : "none",
              }}
            >
              <td
                style={{
                  padding: "10px 0",
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                  fontSize: 13,
                }}
              >
                {b.name}
              </td>
              <td style={{ padding: "10px 0", color: "var(--color-text-secondary)" }}>
                {b.currently_eligible ? fmt(b.monthly_value) : fmt(0)}
              </td>
              <td style={{ padding: "10px 0", color: "var(--color-text-secondary)" }}>
                {b.currently_eligible ? fmt(b.annual_value) : fmt(0)}
              </td>
              <td style={{ padding: "10px 0", color: "var(--color-text-secondary)" }}>
                {fmt(b.eligibility_threshold)}
              </td>
              <td style={{ padding: "10px 0" }}>
                {b.currently_eligible ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      padding: "3px 10px",
                      borderRadius: 99,
                      background: "rgba(29,158,117,0.1)",
                      color: "#0F6E56",
                    }}
                  >
                    Eligible
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      padding: "3px 10px",
                      borderRadius: 99,
                      background: "var(--color-background-secondary)",
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    Ineligible
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}

/* ── Section header ──────────────────────────────────────── */
function SectionHeader({ title, count }) {
  return (
    <motion.div
      variants={STAGGER.item}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        paddingBottom: 12,
        borderBottom: "0.5px solid var(--color-border-tertiary)",
      }}
    >
      <h3
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "var(--color-text-primary)",
          margin: 0,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </h3>
      {count != null && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            padding: "2px 7px",
            borderRadius: 99,
            background: "var(--color-background-secondary)",
            color: "var(--color-text-tertiary)",
          }}
        >
          {count}
        </span>
      )}
    </motion.div>
  );
}

/* ── Main component ──────────────────────────────────────── */
export default function ResultsPanel({ data, monteCarlo }) {
  const d = data ?? MOCK_DATA;

  const cliffCount = d.cliff_points?.length ?? 0;
  const totalCompensation = d.total_compensation ?? (d.net_income + d.total_benefits);
  const headlineColor =
    d.effective_marginal_rate >= 0.8
      ? "#A32D2D"
      : d.effective_marginal_rate >= 0.5
      ? "#854F0B"
      : "#0F6E56";

  return (
    <AnimatePresence>
      <motion.div
        initial="initial"
        animate="animate"
        variants={STAGGER.container}
        style={{
          background: "var(--color-background-primary)",
          borderRadius: "var(--border-radius-lg)",
          border: "0.5px solid var(--color-border-tertiary)",
          padding: "2rem",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
          boxSizing: "border-box",
        }}
      >
        {/* ── Header ── */}
        <motion.div variants={STAGGER.item}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>
                Benefits cliff analysis
              </h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "4px 0 0" }}>
                Based on {fmt(d.gross_income)} gross annual income
              </p>
            </div>
            {cliffCount > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 99,
                  background: "rgba(226,75,74,0.08)",
                  border: "0.5px solid rgba(226,75,74,0.25)",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#A32D2D",
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#E24B4A" }} />
                {cliffCount} cliff{cliffCount !== 1 ? "s" : ""} detected
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Summary metrics ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
          <MetricCard
            label="Gross income"
            value={fmt(d.gross_income)}
            sub="pre-tax"
          />
          <MetricCard
            label="Total compensation"
            value={fmt(totalCompensation)}
            sub="post-tax + benefits"
            accent="#1D9E75"
          />
          <MetricCard
            label="Benefits at risk"
            value={fmt(d.total_benefits)}
            sub="annual value"
            accent="#E24B4A"
          />
          <MetricCard
            label="Net income"
            value={fmt(d.net_income)}
            sub="post-tax"
            accent={headlineColor}
          />
          <MetricCard
            label="Cliff risk this year"
            value={
              monteCarlo
                ? `${Math.round(monteCarlo.cliff_probability * 100)}%`
                : "—"
            }
            sub={
              monteCarlo
                ? "Monte Carlo · 10,000 sims · see below"
                : "Running 10,000 simulations…"
            }
            accent={
              monteCarlo
                ? monteCarlo.cliff_probability >= 0.6
                  ? "#E24B4A"
                  : monteCarlo.cliff_probability >= 0.3
                  ? "#854F0B"
                  : "#0F6E56"
                : undefined
            }
          />
        </div>

        {/* ── Marginal rate ── */}
        <motion.div
          variants={STAGGER.item}
          style={{
            background: "var(--color-background-secondary)",
            borderRadius: "var(--border-radius-md)",
            padding: "1rem 1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <MarginalRateBar rate={d.effective_marginal_rate} />
        </motion.div>

        {/* ── Cliff points ── */}
        {d.cliff_points?.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SectionHeader title="Cliff points" count={d.cliff_points.length} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {d.cliff_points.map((cp, i) => (
                <CliffCard key={i} cp={cp} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* ── Benefits breakdown ── */}
        {d.benefits?.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SectionHeader title="Benefits breakdown" count={d.benefits.length} />
            <BenefitsTable benefits={d.benefits} />
          </div>
        )}

        {/* ── Recommendation ── */}
        {d.recommendation && (
          <motion.div
            variants={STAGGER.item}
            style={{
              borderLeft: "3px solid #1D9E75",
              background: "rgba(29,158,117,0.06)",
              borderRadius: "0 var(--border-radius-md) var(--border-radius-md) 0",
              padding: "14px 18px",
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#0F6E56",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              Recommendation
            </p>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.7 }}>
              {d.recommendation}
            </p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
