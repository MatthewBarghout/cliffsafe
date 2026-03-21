import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";

const FPL_1 = 15650;

const CLIFF_POINTS = [
  {
    income: Math.round(FPL_1 * 1.3),
    label: "SNAP cliff",
    color: "#E24B4A",
  },
  {
    income: Math.round(FPL_1 * 1.38),
    label: "Medicaid cliff",
    color: "#D85A30",
  },
  {
    income: Math.round(FPL_1 * 2.0),
    label: "CCAP cliff",
    color: "#BA7517",
  },
];

function generateMockData(householdSize = 1) {
  const fpl = 15650 + (householdSize - 1) * 5500;
  const data = [];

  for (let gross = 14000; gross <= 72000; gross += 500) {
    let benefits = 0;

    // SNAP: hard cliff at 130% FPL, tapers $1 per $3 earned above
    const snapMax = householdSize === 1 ? 3492 : 3492 + (householdSize - 1) * 1800;
    const snapThreshold = Math.round(fpl * 1.3);
    if (gross <= snapThreshold) {
      benefits += snapMax;
    } else if (gross <= snapThreshold + snapMax * 3) {
      benefits += Math.max(0, snapMax - Math.round((gross - snapThreshold) / 3));
    }

    // Medicaid: hard cliff at 138% FPL (~$7,800/yr value)
    if (gross <= Math.round(fpl * 1.38)) benefits += 7800;

    // CCAP childcare: hard cliff at 200% FPL (~$9,600/yr value for households >1)
    if (householdSize > 1 && gross <= Math.round(fpl * 2.0)) benefits += 9600;

    data.push({
      gross,
      netIncome: gross + benefits,
      benefits,
    });
  }

  return data;
}

const formatDollars = (v) => "$" + (v / 1000).toFixed(0) + "k";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const gross = label;
  const net = payload.find((p) => p.dataKey === "netIncome")?.value;
  const benefits = net - gross;
  const cliff = CLIFF_POINTS.find(
    (cp) => Math.abs(cp.income - gross) < 750
  );

  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-secondary)",
        borderRadius: "var(--border-radius-md)",
        padding: "10px 14px",
        fontSize: "13px",
        lineHeight: 1.8,
      }}
    >
      <p style={{ fontWeight: 500, marginBottom: 4 }}>
        Gross: {formatDollars(gross)}/yr
      </p>
      <p style={{ color: "#1D9E75" }}>
        Net (w/ benefits): {formatDollars(net)}
      </p>
      <p style={{ color: "var(--color-text-secondary)" }}>
        Benefits value: +{formatDollars(benefits)}
      </p>
      {cliff && (
        <p
          style={{
            color: cliff.color,
            fontWeight: 500,
            marginTop: 4,
            borderTop: "0.5px solid var(--color-border-tertiary)",
            paddingTop: 4,
          }}
        >
          ⚠ {cliff.label}
        </p>
      )}
    </div>
  );
};

const CliffLabel = ({ viewBox, label, color }) => {
  const { x, y } = viewBox ?? {};
  return (
    <g>
      <rect
        x={x + 4}
        y={y ?? 10}
        rx={4}
        width={label.length * 7 + 12}
        height={20}
        fill={color + "22"}
        stroke={color}
        strokeWidth={0.5}
      />
      <text
        x={x + 10}
        y={(y ?? 10) + 14}
        fontSize={11}
        fill={color}
        fontFamily="var(--font-sans)"
      >
        {label}
      </text>
    </g>
  );
};

export default function CliffChart({ data, householdSize = 1 }) {
  const chartData = data ?? generateMockData(householdSize);

  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        borderRadius: "var(--border-radius-lg)",
        border: "0.5px solid var(--color-border-tertiary)",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          marginBottom: "1rem",
          fontSize: 12,
          color: "var(--color-text-secondary)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 24,
              height: 3,
              background: "#378ADD",
              display: "inline-block",
              borderRadius: 2,
            }}
          />
          Gross income
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 24,
              height: 3,
              background: "#1D9E75",
              display: "inline-block",
              borderRadius: 2,
            }}
          />
          Net income (w/ benefits)
        </span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginLeft: "auto",
          }}
        >
          <span
            style={{
              width: 24,
              height: 0,
              borderTop: "2px dashed #E24B4A",
              display: "inline-block",
            }}
          />
          Benefit cliffs
        </span>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(0,0,0,0.06)"
            vertical={false}
          />
          <XAxis
            dataKey="gross"
            type="number"
            domain={[14000, 72000]}
            tickFormatter={formatDollars}
            tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
            label={{
              value: "Gross annual income",
              position: "insideBottom",
              offset: -12,
              fontSize: 12,
              fill: "var(--color-text-secondary)",
            }}
          />
          <YAxis
            tickFormatter={formatDollars}
            tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
            domain={[10000, 90000]}
            label={{
              value: "Annual value",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              fontSize: 12,
              fill: "var(--color-text-secondary)",
            }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Diagonal gross income reference */}
          <Line
            dataKey="gross"
            stroke="#378ADD"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
            isAnimationActive={false}
          />

          {/* Net income curve — the hero line */}
          <Line
            dataKey="netIncome"
            stroke="#1D9E75"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive
            animationDuration={800}
          />

          {/* Cliff reference lines */}
          {CLIFF_POINTS.map((cp) => (
            <ReferenceLine
              key={cp.label}
              x={cp.income}
              stroke={cp.color}
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={
                <CliffLabel label={cp.label} color={cp.color} />
              }
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
