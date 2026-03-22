import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";

const T = {
  bg:          "#ffffff",
  bgSecondary: "#f7f4ef",
  bgTertiary:  "#faf8f5",
  border:      "#e8e2d9",
  borderLight: "#ece6de",
  textPrimary: "#1a1a1a",
  textSecondary: "#555",
  textTertiary:  "#999",
  red:    "#c0392b",
  redAlt: "#E24B4A",
  green:  "#1D9E75",
  amber:  "#EF9F27",
  blue:   "#378ADD",
  radiusMd: "10px",
  radiusLg: "16px",
};

/* Formatters */
const fmt = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const fmtK = (v) => {
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
  return `$${v}`;
};

const VOLATILITY_LABELS = {
  full_time:     "salaried worker",
  part_time:     "part-time worker",
  gig:           "gig worker",
  self_employed: "self-employed worker",
  seasonal:      "seasonal worker",
};

/* Normal distribution curve */
function generateCurve(mean, std, nPoints = 120) {
  const xMin = Math.max(0, mean - 3.5 * std);
  const xMax = mean + 3.5 * std;
  return Array.from({ length: nPoints + 1 }, (_, i) => {
    const x   = xMin + ((xMax - xMin) * i) / nPoints;
    const z   = (x - mean) / std;
    const pdf = Math.exp(-0.5 * z * z) / (std * Math.sqrt(2 * Math.PI));
    return { income: Math.round(x), density: pdf };
  });
}

/* Stat box */
function StatBox({ label, value, sub, color }) {
  return (
    <div style={{
      background: T.bgSecondary,
      borderRadius: T.radiusMd,
      padding: "0.85rem 1rem",
      display: "flex", flexDirection: "column", gap: 3,
      border: `1px solid ${T.borderLight}`,
    }}>
      <span style={{
        fontSize: 10, fontWeight: 600, textTransform: "uppercase",
        letterSpacing: "0.07em", color: T.textTertiary,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 17, fontWeight: 700,
        color: color ?? T.textPrimary, lineHeight: 1.2,
        fontFamily: "'Playfair Display', Georgia, serif",
      }}>
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: 11, color: T.textTertiary, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

/* Loading placeholder */
function LoadingState() {
  return (
    <div style={{
      background: T.bg,
      borderRadius: T.radiusLg,
      border: `1px solid ${T.border}`,
      padding: "2rem",
      display: "flex", gap: "0.65rem", alignItems: "center",
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: "50%",
        border: `2.5px solid ${T.red}`, borderTopColor: "transparent",
        animation: "spin-ring 0.8s linear infinite", flexShrink: 0,
      }} />
      <span style={{ fontSize: "0.825rem", color: T.textTertiary, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        Running 10,000 income simulations…
      </span>
    </div>
  );
}

/* Main component */
export default function MonteCarloSection({ data }) {
  if (!data) return <LoadingState />;

  const {
    cliff_probability:            prob,
    expected_annual_benefits_loss: benefitsLoss,
    simulated_income_mean:         mean,
    income_ci_low:                 ciLow,
    income_ci_high:                ciHigh,
    cliff_thresholds:              cliffs,
    n_simulations:                 n,
    employment_type:               empType,
  } = data;

  // Derive std from 5th–95th CI
  const std = (ciHigh - ciLow) / (2 * 1.645);
  const curveData = useMemo(() => generateCurve(mean, std), [mean, std]);

  const xMin = curveData[0].income;
  const xMax = curveData[curveData.length - 1].income;
  const tickInterval = (xMax - xMin) / 4;
  const tickValues   = [0,1,2,3,4].map((i) => Math.round(xMin + tickInterval * i));
  const dangerThreshold = cliffs?.length > 0 ? Math.min(...cliffs) : null;

  const riskColor =
    prob >= 0.6 ? T.redAlt  :
    prob >= 0.3 ? T.amber   : T.green;
  const riskBg =
    prob >= 0.6 ? "rgba(226,75,74,0.07)"  :
    prob >= 0.3 ? "rgba(239,159,39,0.07)" : "rgba(29,158,117,0.07)";
  const riskLabel =
    prob >= 0.6 ? "High risk" : prob >= 0.3 ? "Moderate risk" : "Low risk";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      style={{
        background: T.bg,
        borderRadius: T.radiusLg,
        border: `1px solid ${T.border}`,
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        padding: "1.75rem",
        display: "flex", flexDirection: "column", gap: "1.5rem",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
            <div style={{ width: 18, height: 2, background: T.red, borderRadius: 2 }} />
            <span style={{ fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.14em", color: T.red, textTransform: "uppercase" }}>
              Monte Carlo Simulation
            </span>
          </div>
          <h2 style={{
            fontSize: 20, fontWeight: 800, color: T.textPrimary, margin: 0,
            fontFamily: "'Playfair Display', Georgia, serif",
          }}>
            Income volatility risk
          </h2>
          <p style={{ fontSize: 13, color: T.textTertiary, margin: "4px 0 0" }}>
            {n.toLocaleString()} lognormal simulations of gross annual income ·{" "}
            {VOLATILITY_LABELS[empType] ?? empType} volatility profile
          </p>
        </div>

        {/* Probability badge */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "12px 22px",
          borderRadius: T.radiusMd,
          background: riskBg,
          border: `1px solid ${riskColor}44`,
          borderLeft: `3px solid ${riskColor}`,
          gap: 2,
        }}>
          <span style={{ fontSize: 38, fontWeight: 900, color: riskColor, lineHeight: 1, fontFamily: "'Playfair Display', Georgia, serif" }}>
            {Math.round(prob * 100)}%
          </span>
          <span style={{ fontSize: 11, color: T.textTertiary, textAlign: "center" }}>
            cliff risk this year
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: riskColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {riskLabel}
          </span>
        </div>
      </div>

      {/* Explanation callout */}
      <div style={{
        padding: "12px 16px", borderRadius: T.radiusMd,
        background: riskBg, borderLeft: `3px solid ${riskColor}`,
      }}>
        <p style={{ fontSize: 13, color: T.textSecondary, margin: 0, lineHeight: 1.65 }}>
          <strong style={{ color: riskColor, fontWeight: 700 }}>
            {Math.round(prob * 100)}% of {n.toLocaleString()} simulated gross income paths
          </strong>{" "}
          crossed a benefits cliff this year due to income volatility
          {cliffs?.length > 0 && (
            <> — cliff thresholds at{" "}
              {cliffs.slice(0, 2).map((c) => fmt(c)).join(" and ")}
            </>
          )}
          {benefitsLoss > 0 && (
            <>. Average benefits loss per cliff event:{" "}
              <strong style={{ color: T.red }}>{fmt(benefitsLoss)}/yr</strong>
            </>
          )}.
        </p>
      </div>

      {/* Distribution chart */}
      <div>
        <p style={{
          fontSize: 11, fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.06em", color: T.textTertiary, marginBottom: 10,
        }}>
          Simulated annual income distribution
          {dangerThreshold && (
            <span style={{ color: T.redAlt, marginLeft: 8 }}>
              ↑ red zone = cliff danger
            </span>
          )}
        </p>

        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={curveData} margin={{ top: 8, right: 8, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="mcGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={T.green} stopOpacity={0.35} />
                <stop offset="100%" stopColor={T.green} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            {dangerThreshold && (
              <ReferenceArea x1={dangerThreshold} x2={xMax + 5000}
                fill="rgba(226,75,74,0.11)" fillOpacity={1} />
            )}

            <Area
              type="monotone" dataKey="density"
              stroke={T.green} strokeWidth={2}
              fill="url(#mcGrad)"
              dot={false} activeDot={false}
              isAnimationActive animationDuration={900}
            />

            {cliffs?.slice(0, 3).map((c) => (
              <ReferenceLine key={c} x={c}
                stroke={T.redAlt} strokeDasharray="5 3" strokeWidth={1.5} label={false} />
            ))}

            <ReferenceLine x={mean} stroke="#bbb" strokeDasharray="3 3" strokeWidth={1} />

            <XAxis
              dataKey="income" type="number" domain={[xMin, xMax]}
              ticks={tickValues} tickFormatter={fmtK}
              tick={{ fontSize: 10, fill: T.textTertiary }}
              tickLine={false} axisLine={false}
              label={{ value: "Gross Annual Income (pre-tax)", position: "insideBottom", offset: -2, fontSize: 10, fill: T.textTertiary }}
            />
            <YAxis hide domain={[0, "auto"]} />
          </AreaChart>
        </ResponsiveContainer>

        {/* Chart legend */}
        <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, color: T.textTertiary }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 12, height: 2, background: "#bbb", display: "inline-block" }} />
            mean income
          </span>
          {dangerThreshold && (
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 12, height: 2, background: T.redAlt, display: "inline-block" }} />
              cliff threshold
            </span>
          )}
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 12, height: 8, background: "rgba(226,75,74,0.2)", display: "inline-block" }} />
            danger zone
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <StatBox label="5th pct income (gross)"   value={fmt(ciLow)}  sub="worst-case 5%"  color={T.redAlt} />
        <StatBox label="Expected income (gross)"  value={fmt(mean)}   sub="simulation mean" />
        <StatBox label="95th pct income (gross)"  value={fmt(ciHigh)} sub="best-case 5%"   color={T.green} />
      </div>

      {/* Benefits loss warning */}
      {benefitsLoss > 500 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px", borderRadius: T.radiusMd,
          background: "rgba(226,75,74,0.05)",
          border: `1px solid rgba(226,75,74,0.2)`,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
          <p style={{ fontSize: 13, color: T.textSecondary, margin: 0 }}>
            If a cliff event occurs, expected annual benefits loss:{" "}
            <strong style={{ color: T.red }}>{fmt(benefitsLoss)}</strong>.
            Use the optimizer above to reduce this risk.
          </p>
        </div>
      )}
    </motion.div>
  );
}