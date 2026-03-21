import { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
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

/* ─────────────────────────────────────────────────────────────
   Mock data (used when real API data is absent)
───────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────
   Cliff detection
───────────────────────────────────────────────────────────── */
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

function findRecovery(data, cliff) {
  for (const pt of data) {
    if (pt.gross > cliff.atGross && pt.netIncome >= cliff.netBefore) return pt.gross;
  }
  return data[data.length - 1]?.gross ?? cliff.atGross + 15000;
}

/* ─────────────────────────────────────────────────────────────
   Formatters
───────────────────────────────────────────────────────────── */
const fmtK = (v) => "$" + (v / 1000).toFixed(0) + "k";
const fmtFull = (v) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);

/* ─────────────────────────────────────────────────────────────
   Tooltip
───────────────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label, cliffs }) => {
  if (!active || !payload?.length) return null;
  const net = payload.find((p) => p.dataKey === "netIncome")?.value;
  if (net == null) return null;
  const benefits = Math.max(0, net - label);
  const nearCliff = cliffs.find((c) => Math.abs(c.atGross - label) < 1500);
  return (
    <div style={{
      background: "#fff",
      border: nearCliff ? "1px solid rgba(226,75,74,0.4)" : "1px solid rgba(0,0,0,0.08)",
      borderRadius: 10, padding: "12px 16px", fontSize: 13,
      boxShadow: "0 4px 20px rgba(0,0,0,0.12)", minWidth: 190,
    }}>
      {nearCliff && (
        <div style={{
          background: "rgba(226,75,74,0.08)", borderRadius: 6, padding: "4px 8px",
          marginBottom: 8, color: "#C0392B", fontWeight: 600, fontSize: 11,
          letterSpacing: "0.05em", textTransform: "uppercase",
        }}>
          ⚠ Benefits cliff — {fmtFull(nearCliff.drop)} drop
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ color: "#666", fontSize: 12 }}>
          Gross income: <span style={{ fontWeight: 600, color: "#111" }}>{fmtFull(label)}</span>
        </div>
        <div style={{ color: "#1D9E75", fontWeight: 600 }}>Total compensation: {fmtFull(net)}</div>
        {benefits > 0 && (
          <div style={{ color: "#378ADD", fontSize: 12 }}>Benefits included: +{fmtFull(benefits)}</div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Cliff drop badge (rendered inside Recharts SVG layer)
───────────────────────────────────────────────────────────── */
const BADGE_H = 26;

const CliffAnnotation = ({ viewBox, drop, yOffset = 0, visible }) => {
  const { x, height } = viewBox ?? {};
  if (!x || !visible) return null;
  const label = `↓ ${fmtFull(drop)}`;
  const w = label.length * 7 + 16;
  const y = 4 + yOffset;
  const connectorBottom = height != null ? height + 36 : 300;
  return (
    <g style={{ opacity: visible ? 1 : 0, transition: "opacity 0.4s ease" }}>
      {yOffset > 0 && (
        <line x1={x} y1={y + BADGE_H} x2={x} y2={connectorBottom}
          stroke="#E24B4A" strokeWidth={1} strokeDasharray="3 2" opacity={0.5} />
      )}
      <rect x={x - w / 2} y={y} rx={5} width={w} height={BADGE_H} fill="#E24B4A" opacity={0.92} />
      <text x={x} y={y + BADGE_H - 7} textAnchor="middle" fontSize={11} fontWeight={600}
        fill="#fff" fontFamily="system-ui, sans-serif">{label}</text>
    </g>
  );
};

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

/* ─────────────────────────────────────────────────────────────
   "You are here" label
───────────────────────────────────────────────────────────── */
const YouAreHereLabel = ({ viewBox, visible }) => {
  const { x, height } = viewBox ?? {};
  if (!x || !height || !visible) return null;
  const y = height + 8;
  return (
    <g style={{ opacity: visible ? 1 : 0, transition: "opacity 0.5s ease 0.2s" }}>
      <rect x={x - 41} y={y} rx={5} width={82} height={22} fill="#378ADD" opacity={0.9} />
      <text x={x} y={y + 15} textAnchor="middle" fontSize={11} fontWeight={600}
        fill="#fff" fontFamily="system-ui, sans-serif">You are here</text>
    </g>
  );
};

/* ─────────────────────────────────────────────────────────────
   Legend helpers
───────────────────────────────────────────────────────────── */
function LegendDot({ color, label }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 28, height: 3, background: color, display: "inline-block", borderRadius: 2 }} />
      {label}
    </span>
  );
}
function LegendDash({ color, label }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 28, height: 0, borderTop: `2px dashed ${color}`, display: "inline-block" }} />
      {label}
    </span>
  );
}
function LegendBox({ color, label }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{
        width: 14, height: 14, background: color, display: "inline-block",
        borderRadius: 3, border: "1px solid rgba(226,75,74,0.3)",
      }} />
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   Animation phases
   0 → idle (before inView)
   1 → chart line drawing (Recharts animationDuration fires)
   2 → danger zones fade in
   3 → cliff badges drop in
   4 → "you are here" slides up
   5 → stat pill pulses once
───────────────────────────────────────────────────────────── */
const PHASE_DELAYS = {
  chartStart:   0,      // ms after inView
  dangerZones:  900,
  badges:       1400,
  youAreHere:   1800,
  statPulse:    2100,
};

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────── */
export default function CliffChart({ data, householdSize = 1, userIncome }) {
  const chartData = data ?? generateMockData(householdSize);

  const cliffs     = useMemo(() => detectCliffs(chartData), [chartData]);
  const dangerZones = useMemo(
    () => cliffs.map((c) => ({ ...c, recoveryGross: findRecovery(chartData, c) })),
    [cliffs, chartData]
  );
  const biggestCliff = cliffs.reduce((max, c) => (c.drop > (max?.drop ?? 0) ? c : max), null);

  const yMin = Math.max(0, Math.min(...chartData.map((d) => d.netIncome)) - 3000);
  const yMax = Math.max(...chartData.map((d) => d.netIncome)) + 4000;
  const xMin = chartData[0]?.gross ?? 12000;
  const xMax = chartData[chartData.length - 1]?.gross ?? 75000;
  const yOffsets = useMemo(() => computeYOffsets(cliffs, xMax - xMin), [cliffs, xMin, xMax]);

  // ── Scroll-triggered phase sequencer ──────────────────────
  const wrapperRef = useRef(null);
  const inView     = useInView(wrapperRef, { once: true, margin: "-80px" });

  const [phase, setPhase] = useState(0);
  const [statPulse, setStatPulse] = useState(false);
  const [lineAnimKey, setLineAnimKey] = useState(0); // force Recharts re-animate on inView

  useEffect(() => {
    if (!inView) return;

    // Kick off Recharts line animation immediately
    setLineAnimKey((k) => k + 1);
    setPhase(1);

    const timers = [
      setTimeout(() => setPhase(2), PHASE_DELAYS.dangerZones),
      setTimeout(() => setPhase(3), PHASE_DELAYS.badges),
      setTimeout(() => setPhase(4), PHASE_DELAYS.youAreHere),
      setTimeout(() => { setPhase(5); setStatPulse(true); }, PHASE_DELAYS.statPulse),
    ];
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  const showDangerZones = phase >= 2;
  const showBadges      = phase >= 3;
  const showYouAreHere  = phase >= 4;

  return (
    <div ref={wrapperRef}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');

        @keyframes danger-pulse {
          0%   { opacity: 0; }
          60%  { opacity: 1; }
          100% { opacity: 1; }
        }

        @keyframes badge-drop {
          0%   { opacity: 0; transform: translateY(-10px); }
          60%  { opacity: 1; transform: translateY(2px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes stat-pulse {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.06); box-shadow: 0 0 0 6px rgba(192,57,43,0.12); }
          100% { transform: scale(1); box-shadow: none; }
        }

        @keyframes cliff-shimmer {
          0%   { opacity: 0.07; }
          50%  { opacity: 0.18; }
          100% { opacity: 0.07; }
        }

        .danger-zone-entering {
          animation: danger-pulse 0.7s ease-out forwards;
        }

        .cliff-line-shimmer {
          animation: cliff-shimmer 2s ease-in-out 2s 2;
        }

        .stat-pulse-once {
          animation: stat-pulse 0.6s ease-out forwards;
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,0.08)",
          padding: "1.75rem",
          boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
                <div style={{ width: 20, height: 2, background: "#c0392b" }} />
                <span style={{
                  fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.14em",
                  color: "#c0392b", textTransform: "uppercase",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}>Benefits cliff map</span>
              </div>
              <h2 style={{
                fontSize: 20, fontWeight: 800, color: "#1a1a1a", margin: 0,
                fontFamily: "'Playfair Display', Georgia, serif",
              }}>
                How earning more affects your take-home
              </h2>
              <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                Total compensation (income + benefits) as your gross income grows
              </p>
            </motion.div>

            {/* Biggest cliff stat — pulses on reveal */}
            {biggestCliff && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.25 }}
                className={statPulse ? "stat-pulse-once" : ""}
                style={{
                  background: "rgba(226,75,74,0.06)",
                  border: "1px solid rgba(226,75,74,0.22)",
                  borderRadius: 12, padding: "10px 16px", textAlign: "right",
                  borderLeft: "3px solid #c0392b",
                }}
              >
                <div style={{
                  fontSize: 10, color: "#C0392B", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}>Biggest cliff drop</div>
                <div style={{
                  fontSize: 24, fontWeight: 900, color: "#E24B4A", lineHeight: 1.2,
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}>
                  {fmtFull(biggestCliff.drop)}
                </div>
                <div style={{ fontSize: 11, color: "#999", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  at {fmtFull(biggestCliff.atGross)}/yr gross
                </div>
              </motion.div>
            )}
          </div>

          {/* Legend — staggered fade in */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.35 }}
            style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 16, fontSize: 12, color: "#666", fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            <LegendDot   color="#1D9E75" label="Total compensation (take-home + benefits)" />
            <LegendDash  color="#378ADD" label="Gross income (baseline)" />
            <LegendBox   color="rgba(226,75,74,0.15)" label="Danger zone" />
          </motion.div>
        </div>

        {/* ── Chart ── */}
        <div style={{ position: "relative" }}>
          <ResponsiveContainer width="100%" height={380}>
            <ComposedChart
              key={lineAnimKey}   /* re-mount triggers Recharts line draw animation */
              data={chartData}
              margin={{
                top: 36 + (yOffsets.length ? Math.max(...yOffsets) : 0),
                right: 24, left: 8, bottom: 36,
              }}
            >
              <defs>
                <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#1D9E75" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#1D9E75" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />

              <XAxis
                dataKey="gross" type="number" domain={[xMin, xMax]}
                tickFormatter={fmtK} tick={{ fontSize: 11, fill: "#999" }}
                tickLine={false} axisLine={{ stroke: "rgba(0,0,0,0.08)" }}
                label={{ value: "Gross annual income", position: "insideBottom", offset: -14, fontSize: 12, fill: "#999" }}
              />
              <YAxis
                tickFormatter={fmtK} tick={{ fontSize: 11, fill: "#999" }}
                tickLine={false} axisLine={false} domain={[yMin, yMax]}
                label={{ value: "Annual value", angle: -90, position: "insideLeft", offset: 14, fontSize: 12, fill: "#999" }}
              />

              <Tooltip content={<CustomTooltip cliffs={cliffs} />} />

              {/* Danger zones — fade in during phase 2 */}
              {dangerZones.map((dz, i) => (
                <ReferenceArea
                  key={i}
                  x1={dz.atGross} x2={dz.recoveryGross}
                  fill={showDangerZones ? "rgba(226,75,74,0.08)" : "transparent"}
                  stroke={showDangerZones ? "rgba(226,75,74,0.2)" : "transparent"}
                  strokeWidth={0.5}
                  className={showDangerZones ? "danger-zone-entering" : ""}
                />
              ))}

              {/* Net compensation — hero line, animates on mount */}
              <Area
                dataKey="netIncome"
                stroke="#1D9E75" strokeWidth={2.5}
                fill="url(#netGradient)"
                dot={false} type="monotone"
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
                animationBegin={0}
              />

              {/* Gross income diagonal */}
              <Line
                dataKey="gross"
                stroke="#378ADD" strokeWidth={1.5} strokeDasharray="6 4"
                dot={false} type="linear"
                isAnimationActive={true}
                animationDuration={1000}
                animationEasing="ease-out"
                animationBegin={200}
              />

              {/* Cliff reference lines + badges */}
              {cliffs.map((c, i) => (
                <ReferenceLine
                  key={i} x={c.atGross}
                  stroke={showBadges ? "#E24B4A" : "transparent"}
                  strokeWidth={1.5} strokeDasharray="4 3"
                  label={
                    <CliffAnnotation
                      drop={c.drop}
                      yOffset={yOffsets[i]}
                      visible={showBadges}
                    />
                  }
                />
              ))}

              {/* "You are here" */}
              {userIncome && (
                <ReferenceLine
                  x={userIncome}
                  stroke={showYouAreHere ? "#378ADD" : "transparent"}
                  strokeWidth={2}
                  label={<YouAreHereLabel visible={showYouAreHere} />}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>

          {/* ── Framer Motion overlay: cliff flash ────────────────
              A full-height red flash that fires when badges appear,
              drawing the eye to the cliff moment               */}
          <AnimatePresence>
            {showBadges && cliffs.map((c, i) => {
              // Convert gross income value to approximate pixel x position
              const pct = (c.atGross - xMin) / (xMax - xMin);
              // Chart inner width ≈ container minus left/right margins (8+24+~50 axis)
              const chartInnerLeft  = 58;   // approx px for YAxis + margin
              const chartInnerRight = 24;
              const containerWidth  = wrapperRef.current?.offsetWidth ?? 700;
              const innerWidth = containerWidth - chartInnerLeft - chartInnerRight;
              const xPx = chartInnerLeft + pct * innerWidth;

              return (
                <motion.div
                  key={`flash-${i}`}
                  initial={{ opacity: 0.35, scaleY: 0, originY: 0 }}
                  animate={{ opacity: 0, scaleY: 1 }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.1 }}
                  style={{
                    position: "absolute",
                    top: 36,
                    bottom: 36,
                    left: xPx - 1,
                    width: 2,
                    background: "linear-gradient(to bottom, #E24B4A, transparent)",
                    pointerEvents: "none",
                    transformOrigin: "top",
                  }}
                />
              );
            })}
          </AnimatePresence>
        </div>

        {/* ── Cliff summary pills ─────────────────────────────── */}
        {cliffs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={showBadges ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              marginTop: "1.25rem",
              display: "flex",
              gap: "0.65rem",
              flexWrap: "wrap",
            }}
          >
            {cliffs.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={showBadges ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.35, delay: 0.05 * i }}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  background: "rgba(226,75,74,0.07)",
                  border: "1px solid rgba(226,75,74,0.2)",
                  borderRadius: "20px",
                  padding: "0.35rem 0.85rem",
                  fontSize: "0.78rem",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  color: "#c0392b",
                  fontWeight: 600,
                }}
              >
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#E24B4A", display: "inline-block", flexShrink: 0,
                }} />
                Cliff at {fmtFull(c.atGross)} — {fmtFull(c.drop)} drop
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}