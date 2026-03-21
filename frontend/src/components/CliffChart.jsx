import { useMemo } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";

/* ── Mock data (used when real API data is absent) ─────────── */
function generateMockData(householdSize = 1) {
  const fpl = 15650 + (householdSize - 1) * 5500;
  const data = [];
  for (let gross = 12000; gross <= 75000; gross += 500) {
    let benefits = 0;
    const snapMax = householdSize === 1 ? 3492 : 3492 + (householdSize - 1) * 1800;
    const snapThreshold = Math.round(fpl * 1.3);
    if (gross <= snapThreshold) {
      benefits += snapMax;
    } else if (gross <= snapThreshold + snapMax * 3) {
      benefits += Math.max(0, snapMax - Math.round((gross - snapThreshold) / 3));
    }
    if (gross <= Math.round(fpl * 1.38)) benefits += 7800;
    if (householdSize > 1 && gross <= Math.round(fpl * 2.0)) benefits += 9600;
    data.push({ gross, netIncome: gross + benefits });
  }
  return data;
}

/* ── Cliff detection from real data ────────────────────────── */
function detectCliffs(data, threshold = 600) {
  const cliffs = [];
  for (let i = 1; i < data.length; i++) {
    const drop = data[i - 1].netIncome - data[i].netIncome;
    if (drop > threshold) {
      cliffs.push({
        atGross: data[i].gross,
        drop: Math.round(drop),
        netBefore: data[i - 1].netIncome,
        netAfter: data[i].netIncome,
      });
    }
  }
  return cliffs;
}

/* Find where netIncome climbs back to pre-cliff level */
function findRecovery(data, cliff) {
  for (const pt of data) {
    if (pt.gross > cliff.atGross && pt.netIncome >= cliff.netBefore) {
      return pt.gross;
    }
  }
  return data[data.length - 1]?.gross ?? cliff.atGross + 15000;
}

/* ── Formatters ─────────────────────────────────────────────── */
const fmtK = (v) => "$" + (v / 1000).toFixed(0) + "k";
const fmtFull = (v) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);

/* ── Tooltip ────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label, cliffs }) => {
  if (!active || !payload?.length) return null;
  const net = payload.find((p) => p.dataKey === "netIncome")?.value;
  if (net == null) return null;
  const benefits = Math.max(0, net - label);
  const nearCliff = cliffs.find((c) => Math.abs(c.atGross - label) < 1500);

  return (
    <div
      style={{
        background: "#fff",
        border: nearCliff
          ? "1px solid rgba(226,75,74,0.4)"
          : "1px solid rgba(0,0,0,0.08)",
        borderRadius: 10,
        padding: "12px 16px",
        fontSize: 13,
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
        minWidth: 190,
      }}
    >
      {nearCliff && (
        <div
          style={{
            background: "rgba(226,75,74,0.08)",
            borderRadius: 6,
            padding: "4px 8px",
            marginBottom: 8,
            color: "#C0392B",
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          ⚠ Benefits cliff — {fmtFull(nearCliff.drop)} drop
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ color: "#666", fontSize: 12 }}>
          Gross income:{" "}
          <span style={{ fontWeight: 600, color: "#111" }}>{fmtFull(label)}</span>
        </div>
        <div style={{ color: "#1D9E75", fontWeight: 600 }}>
          Total compensation: {fmtFull(net)}
        </div>
        {benefits > 0 && (
          <div style={{ color: "#378ADD", fontSize: 12 }}>
            Benefits included: +{fmtFull(benefits)}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Cliff drop annotation label ───────────────────────────── */
const BADGE_H = 26;

const CliffAnnotation = ({ viewBox, drop, yOffset = 0 }) => {
  const { x, height } = viewBox ?? {};
  if (!x) return null;
  const label = `↓ ${fmtFull(drop)}`;
  const w = label.length * 7 + 16;
  const y = 4 + yOffset;
  const connectorBottom = height != null ? height + 36 : 300;
  return (
    <g>
      {/* connector line from badge down to the chart reference line */}
      {yOffset > 0 && (
        <line
          x1={x}
          y1={y + BADGE_H}
          x2={x}
          y2={connectorBottom}
          stroke="#E24B4A"
          strokeWidth={1}
          strokeDasharray="3 2"
          opacity={0.5}
        />
      )}
      <rect
        x={x - w / 2}
        y={y}
        rx={5}
        width={w}
        height={BADGE_H}
        fill="#E24B4A"
        opacity={0.92}
      />
      <text
        x={x}
        y={y + BADGE_H - 7}
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
        fill="#fff"
        fontFamily="system-ui, sans-serif"
      >
        {label}
      </text>
    </g>
  );
};

/* Compute vertical offsets so badges don't overlap.
   Two badges overlap when their gross incomes are within ~$7k at typical chart width. */
function computeYOffsets(cliffs, grossRange) {
  const approxChartPx = 700;
  const badgePx = 90;
  const overlapDollars = (badgePx / approxChartPx) * grossRange;
  const offsets = new Array(cliffs.length).fill(0);
  for (let i = 1; i < cliffs.length; i++) {
    if (cliffs[i].atGross - cliffs[i - 1].atGross < overlapDollars) {
      offsets[i] = offsets[i - 1] + BADGE_H + 4;
    }
  }
  return offsets;
}

/* ── "You are here" label — anchored to bottom of chart ─────── */
const YouAreHereLabel = ({ viewBox }) => {
  const { x, height } = viewBox ?? {};
  if (!x || !height) return null;
  const y = height + 8; // just below the plot area
  return (
    <g>
      <rect x={x - 41} y={y} rx={5} width={82} height={22} fill="#378ADD" opacity={0.9} />
      <text
        x={x}
        y={y + 15}
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
        fill="#fff"
        fontFamily="system-ui, sans-serif"
      >
        You are here
      </text>
    </g>
  );
};

/* ── Main component ─────────────────────────────────────────── */
export default function CliffChart({ data, householdSize = 1, userIncome }) {
  const chartData = data ?? generateMockData(householdSize);

  const cliffs = useMemo(() => detectCliffs(chartData), [chartData]);

  const dangerZones = useMemo(
    () =>
      cliffs.map((c) => ({
        ...c,
        recoveryGross: findRecovery(chartData, c),
      })),
    [cliffs, chartData]
  );

  const biggestCliff = cliffs.reduce(
    (max, c) => (c.drop > (max?.drop ?? 0) ? c : max),
    null
  );

  const yMin = Math.max(
    0,
    Math.min(...chartData.map((d) => d.netIncome)) - 3000
  );
  const yMax = Math.max(...chartData.map((d) => d.netIncome)) + 4000;
  const xMin = chartData[0]?.gross ?? 12000;
  const xMax = chartData[chartData.length - 1]?.gross ?? 75000;

  const yOffsets = useMemo(
    () => computeYOffsets(cliffs, xMax - xMin),
    [cliffs, xMin, xMax]
  );

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid rgba(0,0,0,0.08)",
        padding: "1.75rem",
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
      }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "#111",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Benefits cliff map
            </h2>
            <p style={{ fontSize: 13, color: "#666", margin: "4px 0 0" }}>
              How your total compensation changes as income grows
            </p>
          </div>

          {biggestCliff && (
            <div
              style={{
                background: "rgba(226,75,74,0.08)",
                border: "1px solid rgba(226,75,74,0.25)",
                borderRadius: 10,
                padding: "8px 14px",
                textAlign: "right",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#C0392B",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Biggest cliff drop
              </div>
              <div
                style={{ fontSize: 22, fontWeight: 700, color: "#E24B4A", lineHeight: 1.2 }}
              >
                {fmtFull(biggestCliff.drop)}
              </div>
              <div style={{ fontSize: 11, color: "#888" }}>
                at {fmtFull(biggestCliff.atGross)}/yr gross
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: 20,
            flexWrap: "wrap",
            marginTop: 16,
            fontSize: 12,
            color: "#666",
          }}
        >
          <LegendDot color="#1D9E75" label="Total compensation (take-home + benefits)" />
          <LegendDash color="#378ADD" label="Gross income (baseline)" />
          <LegendBox color="rgba(226,75,74,0.15)" label="Danger zone" />
        </div>
      </div>

      {/* ── Chart ── */}
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart
          data={chartData}
          margin={{ top: 36 + (yOffsets.length ? Math.max(...yOffsets) : 0), right: 24, left: 8, bottom: 36 }}
        >
          <defs>
            <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1D9E75" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#1D9E75" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(0,0,0,0.05)"
            vertical={false}
          />

          <XAxis
            dataKey="gross"
            type="number"
            domain={[xMin, xMax]}
            tickFormatter={fmtK}
            tick={{ fontSize: 11, fill: "#999" }}
            tickLine={false}
            axisLine={{ stroke: "rgba(0,0,0,0.08)" }}
            label={{
              value: "Gross annual income",
              position: "insideBottom",
              offset: -14,
              fontSize: 12,
              fill: "#999",
            }}
          />
          <YAxis
            tickFormatter={fmtK}
            tick={{ fontSize: 11, fill: "#999" }}
            tickLine={false}
            axisLine={false}
            domain={[yMin, yMax]}
            label={{
              value: "Annual value",
              angle: -90,
              position: "insideLeft",
              offset: 14,
              fontSize: 12,
              fill: "#999",
            }}
          />

          <Tooltip content={<CustomTooltip cliffs={cliffs} />} />

          {/* Red danger zones — cliff to recovery */}
          {dangerZones.map((dz, i) => (
            <ReferenceArea
              key={i}
              x1={dz.atGross}
              x2={dz.recoveryGross}
              fill="rgba(226,75,74,0.07)"
              stroke="rgba(226,75,74,0.15)"
              strokeWidth={0.5}
            />
          ))}

          {/* Net compensation area — the hero */}
          <Area
            dataKey="netIncome"
            stroke="#1D9E75"
            strokeWidth={2.5}
            fill="url(#netGradient)"
            dot={false}
            type="monotone"
            isAnimationActive
            animationDuration={1000}
            animationEasing="ease-out"
          />

          {/* Gross income diagonal */}
          <Line
            dataKey="gross"
            stroke="#378ADD"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            dot={false}
            type="linear"
            isAnimationActive={false}
          />

          {/* Cliff vertical lines + drop annotations */}
          {cliffs.map((c, i) => (
            <ReferenceLine
              key={i}
              x={c.atGross}
              stroke="#E24B4A"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              label={<CliffAnnotation drop={c.drop} yOffset={yOffsets[i]} />}
            />
          ))}

          {/* "You are here" marker */}
          {userIncome && (
            <ReferenceLine
              x={userIncome}
              stroke="#378ADD"
              strokeWidth={2}
              strokeDasharray="none"
              label={<YouAreHereLabel />}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Legend helpers ─────────────────────────────────────────── */
function LegendDot({ color, label }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 28,
          height: 3,
          background: color,
          display: "inline-block",
          borderRadius: 2,
        }}
      />
      {label}
    </span>
  );
}

function LegendDash({ color, label }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 28,
          height: 0,
          borderTop: `2px dashed ${color}`,
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
}

function LegendBox({ color, label }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 14,
          height: 14,
          background: color,
          display: "inline-block",
          borderRadius: 3,
          border: "1px solid rgba(226,75,74,0.3)",
        }}
      />
      {label}
    </span>
  );
}
