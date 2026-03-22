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
  full_time: "salaried worker",
  part_time: "part-time worker",
  self_employed: "gig / self-employed worker",
  seasonal: "seasonal worker",
};

function generateCurve(mean, std, nPoints = 120) {
  const xMin = Math.max(0, mean - 3.5 * std);
  const xMax = mean + 3.5 * std;
  return Array.from({ length: nPoints + 1 }, (_, i) => {
    const x = xMin + ((xMax - xMin) * i) / nPoints;
    const z = (x - mean) / std;
    const pdf = Math.exp(-0.5 * z * z) / (std * Math.sqrt(2 * Math.PI));
    return { income: Math.round(x), density: pdf };
  });
}

function StatBox({ label, value, sub, color }) {
  return (
    <div
      style={{
        background: "var(--color-background-secondary)",
        borderRadius: "var(--border-radius-md)",
        padding: "0.85rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: "var(--color-text-tertiary)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 17,
          fontWeight: 500,
          color: color ?? "var(--color-text-primary)",
          lineHeight: 1.2,
        }}
      >
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

export default function MonteCarloSection({ data }) {
  if (!data) {
    return (
      <div
        style={{
          background: "var(--color-background-primary)",
          borderRadius: "var(--border-radius-lg)",
          border: "0.5px solid var(--color-border-tertiary)",
          padding: "2rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.65rem", alignItems: "center" }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              border: "2.5px solid #c0392b",
              borderTopColor: "transparent",
              animation: "spin-ring 0.8s linear infinite",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "0.825rem", color: "#888" }}>
            Running 1,000 income simulations…
          </span>
        </div>
      </div>
    );
  }

  const {
    cliff_probability: prob,
    expected_annual_benefits_loss: benefitsLoss,
    simulated_income_mean: mean,
    income_ci_low: ciLow,
    income_ci_high: ciHigh,
    cliff_thresholds: cliffs,
    n_simulations: n,
    employment_type: empType,
  } = data;

  // Derive std from 5th–95th CI (normal approximation via CLT)
  const std = (ciHigh - ciLow) / (2 * 1.645);

  const curveData = useMemo(() => generateCurve(mean, std), [mean, std]);

  const xMin = curveData[0].income;
  const xMax = curveData[curveData.length - 1].income;
  const tickInterval = (xMax - xMin) / 4;
  const tickValues = [0, 1, 2, 3, 4].map((i) => Math.round(xMin + tickInterval * i));
  const dangerThreshold =
    cliffs && cliffs.length > 0 ? Math.min(...cliffs) : null;

  const color =
    prob >= 0.6 ? "#E24B4A" : prob >= 0.3 ? "#EF9F27" : "#1D9E75";
  const bgColor =
    prob >= 0.6
      ? "rgba(226,75,74,0.07)"
      : prob >= 0.3
      ? "rgba(239,159,39,0.07)"
      : "rgba(29,158,117,0.07)";
  const riskLabel =
    prob >= 0.6 ? "High risk" : prob >= 0.3 ? "Moderate risk" : "Low risk";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      style={{
        background: "var(--color-background-primary)",
        borderRadius: "var(--border-radius-lg)",
        border: "0.5px solid var(--color-border-tertiary)",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
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
            Income volatility risk
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-text-secondary)",
              margin: "4px 0 0",
            }}
          >
            {n.toLocaleString()} lognormal simulations ·{" "}
            {VOLATILITY_LABELS[empType] ?? empType} volatility profile
          </p>
        </div>

        {/* Probability badge */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "12px 22px",
            borderRadius: "var(--border-radius-md)",
            background: bgColor,
            border: `1px solid ${color}33`,
            gap: 2,
          }}
        >
          <span
            style={{
              fontSize: 38,
              fontWeight: 600,
              color,
              lineHeight: 1,
            }}
          >
            {Math.round(prob * 100)}%
          </span>
          <span
            style={{
              fontSize: 11,
              color: "var(--color-text-tertiary)",
              textAlign: "center",
            }}
          >
            cliff risk
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {riskLabel}
          </span>
        </div>
      </div>

      {/* Explanation */}
      <div
        style={{
          padding: "12px 16px",
          borderRadius: "var(--border-radius-md)",
          background: bgColor,
          borderLeft: `3px solid ${color}`,
        }}
      >
        <p
          style={{
            fontSize: 13,
            color: "var(--color-text-secondary)",
            margin: 0,
            lineHeight: 1.65,
          }}
        >
          <strong style={{ color, fontWeight: 600 }}>
            {Math.round(prob * 100)}% of 1,000 simulated income paths
          </strong>{" "}
          crossed a benefits cliff this year due to income volatility
          {cliffs && cliffs.length > 0 && (
            <>
              {" "}— cliff thresholds at{" "}
              {cliffs
                .slice(0, 2)
                .map((c) => fmt(c))
                .join(" and ")}
            </>
          )}
          {benefitsLoss > 0 && (
            <>
              . Average benefits loss per cliff event:{" "}
              <strong style={{ color: "#A32D2D" }}>
                {fmt(benefitsLoss)}/yr
              </strong>
            </>
          )}
          .
        </p>
      </div>

      {/* Distribution chart */}
      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--color-text-tertiary)",
            marginBottom: 10,
          }}
        >
          Simulated annual income distribution
          {dangerThreshold && (
            <span style={{ color: "#E24B4A", marginLeft: 8 }}>
              ↑ red zone = cliff danger
            </span>
          )}
        </p>

        <ResponsiveContainer width="100%" height={180}>
          <AreaChart
            data={curveData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="mcGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1D9E75" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#1D9E75" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            {/* Danger zone background */}
            {dangerThreshold && (
              <ReferenceArea
                x1={dangerThreshold}
                x2={xMax + 5000}
                fill="rgba(226,75,74,0.11)"
                fillOpacity={1}
              />
            )}

            <Area
              type="monotone"
              dataKey="density"
              stroke="#1D9E75"
              strokeWidth={2}
              fill="url(#mcGrad)"
              dot={false}
              activeDot={false}
              isAnimationActive={true}
              animationDuration={900}
            />

            {/* Cliff threshold lines */}
            {cliffs &&
              cliffs.slice(0, 3).map((c) => (
                <ReferenceLine
                  key={c}
                  x={c}
                  stroke="#E24B4A"
                  strokeDasharray="5 3"
                  strokeWidth={1.5}
                  label={false}
                />
              ))}

            {/* Mean income line */}
            <ReferenceLine
              x={mean}
              stroke="#aaa"
              strokeDasharray="3 3"
              strokeWidth={1}
            />

            <XAxis
              dataKey="income"
              type="number"
              domain={[xMin, xMax]}
              ticks={tickValues}
              tickFormatter={fmtK}
              tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis hide domain={[0, "auto"]} />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 8,
            fontSize: 11,
            color: "var(--color-text-tertiary)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                width: 12,
                height: 2,
                background: "#aaa",
                display: "inline-block",
              }}
            />
            mean income
          </span>
          {dangerThreshold && (
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span
                style={{
                  width: 12,
                  height: 2,
                  background: "#E24B4A",
                  display: "inline-block",
                }}
              />
              cliff threshold
            </span>
          )}
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                width: 12,
                height: 8,
                background: "rgba(226,75,74,0.2)",
                display: "inline-block",
              }}
            />
            danger zone
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
        }}
      >
        <StatBox label="5th pct income" value={fmt(ciLow)} sub="worst-case 5%" color="#E24B4A" />
        <StatBox label="Expected income" value={fmt(mean)} sub="simulation mean" />
        <StatBox label="95th pct income" value={fmt(ciHigh)} sub="best-case 5%" color="#1D9E75" />
      </div>

      {/* Benefits loss warning */}
      {benefitsLoss > 500 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            borderRadius: "var(--border-radius-md)",
            background: "rgba(226,75,74,0.05)",
            border: "0.5px solid rgba(226,75,74,0.2)",
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
            If a cliff event occurs, expected annual benefits loss:{" "}
            <strong style={{ color: "#A32D2D" }}>{fmt(benefitsLoss)}</strong>.
            Use the optimizer above to reduce this risk.
          </p>
        </div>
      )}
    </motion.div>
  );
}
