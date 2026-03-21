import { motion, AnimatePresence } from "framer-motion";

// ─── Shimmer skeleton block ───────────────────────────────────────────────────
export function Skeleton({ width = "100%", height = "1rem", radius = "6px", style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: "linear-gradient(90deg, #ede8df 25%, #e0d9ce 50%, #ede8df 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

// ─── Skeleton card shell ──────────────────────────────────────────────────────
function SkeletonCard({ children, style = {} }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e8e2d9",
        borderRadius: "16px",
        padding: "2rem",
        width: "100%",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Results page skeleton ────────────────────────────────────────────────────
export function ResultsSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "100%" }}>

      {/* Chart skeleton */}
      <SkeletonCard>
        <Skeleton width="140px" height="0.75rem" style={{ marginBottom: "1.5rem" }} />
        <Skeleton width="100%" height="220px" radius="10px" />
      </SkeletonCard>

      {/* Stats row skeleton */}
      <SkeletonCard>
        <Skeleton width="200px" height="1.1rem" style={{ marginBottom: "1.5rem" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: "#f7f4ef", borderRadius: "10px", padding: "1rem" }}>
              <Skeleton width="60%" height="0.65rem" style={{ marginBottom: "0.6rem" }} />
              <Skeleton width="80%" height="1.6rem" radius="4px" />
            </div>
          ))}
        </div>

        {/* Cliff points skeleton */}
        <Skeleton width="160px" height="0.9rem" style={{ marginBottom: "1rem" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              style={{
                borderLeft: "4px solid #e8e2d9",
                borderRadius: "0 8px 8px 0",
                padding: "0.9rem 1rem",
                background: "#faf8f4",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <Skeleton width="100px" height="0.75rem" />
                <Skeleton width="120px" height="0.75rem" />
              </div>
              <Skeleton width="75%" height="0.65rem" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      {/* Optimizer skeleton */}
      <SkeletonCard>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <Skeleton width="160px" height="1rem" style={{ marginBottom: "0.5rem" }} />
            <Skeleton width="220px" height="0.65rem" />
          </div>
          <Skeleton width="110px" height="38px" radius="8px" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ background: "#f7f4ef", borderRadius: "10px", padding: "1rem" }}>
              <Skeleton width="60%" height="0.65rem" style={{ marginBottom: "0.6rem" }} />
              <Skeleton width="80%" height="1.4rem" radius="4px" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      {/* Advisor skeleton */}
      <SkeletonCard>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <Skeleton width="40px" height="40px" radius="50%" />
          <div style={{ flex: 1 }}>
            <Skeleton width="140px" height="0.85rem" style={{ marginBottom: "0.4rem" }} />
            <Skeleton width="100px" height="0.6rem" />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Skeleton width="70%" height="2.5rem" radius="12px" style={{ alignSelf: "flex-start" }} />
          <Skeleton width="50%" height="2rem" radius="12px" style={{ alignSelf: "flex-end" }} />
          <Skeleton width="65%" height="2.5rem" radius="12px" style={{ alignSelf: "flex-start" }} />
        </div>
      </SkeletonCard>
    </div>
  );
}

// ─── Full-page loading screen (shown during API call) ─────────────────────────
export function LoadingScreen() {
  const steps = [
    { label: "Reading your income data", delay: 0 },
    { label: "Fetching benefit thresholds", delay: 0.6 },
    { label: "Running Monte Carlo simulation", delay: 1.3 },
    { label: "Detecting cliff points", delay: 2.1 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(135deg, #f7f4ef 0%, #ede8df 45%, #e8ddd0 100%)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes cliff-draw {
          from { stroke-dashoffset: 600; }
          to   { stroke-dashoffset: 0; }
        }

        @keyframes drop-draw {
          from { stroke-dashoffset: 160; }
          to   { stroke-dashoffset: 0; }
        }

        @keyframes fade-step {
          0%   { opacity: 0; transform: translateX(-8px); }
          15%  { opacity: 1; transform: translateX(0); }
          80%  { opacity: 1; }
          100% { opacity: 0.35; }
        }

        @keyframes spin-ring {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* Animated cliff SVG */}
      <svg
        width="220"
        height="160"
        viewBox="0 0 220 160"
        fill="none"
        style={{ marginBottom: "2rem" }}
        aria-hidden="true"
      >
        {/* Grid lines */}
        {[40, 80, 120].map((y) => (
          <line key={y} x1="20" y1={y} x2="200" y2={y} stroke="#c9bfb0" strokeWidth="0.8" strokeDasharray="4 4" />
        ))}
        {[60, 110, 160].map((x) => (
          <line key={x} x1={x} y1="20" x2={x} y2="140" stroke="#c9bfb0" strokeWidth="0.8" strokeDasharray="4 4" />
        ))}

        {/* Rising line */}
        <path
          d="M 20 130 C 50 115 80 98 110 80 C 130 68 148 58 162 50"
          stroke="#c0392b"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="600"
          style={{ animation: "cliff-draw 1.8s ease-out forwards" }}
        />

        {/* Cliff drop */}
        <path
          d="M 162 50 L 164 118"
          stroke="#c0392b"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="160"
          style={{ animation: "drop-draw 0.4s ease-in 1.7s both" }}
        />

        {/* After-cliff line */}
        <path
          d="M 164 118 C 180 118 196 116 210 115"
          stroke="#c0392b"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="160"
          style={{ animation: "drop-draw 0.5s ease-out 2.1s both" }}
        />

        {/* Cliff point dot */}
        <circle
          cx="162" cy="50" r="6"
          fill="#c0392b"
          style={{ opacity: 0, animation: "fade-step 1s ease 1.6s forwards" }}
        />
      </svg>

      {/* Headline */}
      <h2
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "#1a1a1a",
          marginBottom: "0.4rem",
          textAlign: "center",
        }}
      >
        Calculating your cliff…
      </h2>
      <p
        style={{
          fontSize: "0.875rem",
          color: "#888",
          marginBottom: "2.5rem",
          textAlign: "center",
        }}
      >
        Running your numbers against benefit thresholds
      </p>

      {/* Step list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", width: "260px" }}>
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: step.delay, duration: 0.4 }}
            style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}
          >
            {/* Spinning ring → checkmark */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: step.delay }}
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                border: "2px solid #c0392b",
                borderTopColor: "transparent",
                flexShrink: 0,
                animation: "spin-ring 0.8s linear infinite",
              }}
            />
            <span style={{ fontSize: "0.825rem", color: "#555" }}>{step.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Inline button spinner (for form submit button) ───────────────────────────
export function ButtonSpinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: "14px",
        height: "14px",
        border: "2px solid rgba(255,255,255,0.4)",
        borderTopColor: "white",
        borderRadius: "50%",
        animation: "spin-ring 0.7s linear infinite",
        marginRight: "0.5rem",
        verticalAlign: "middle",
      }}
    />
  );
}