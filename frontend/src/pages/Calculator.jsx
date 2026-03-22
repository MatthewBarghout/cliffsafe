import { useState } from "react";
import { useNavigate } from "react-router-dom";
import IncomeForm from "../components/IncomeForm";
import { calculateCliff } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingScreen } from "../components/Loading";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');`;

function ErrorState({ message, onRetry, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.28 }}
      style={{
        width: "100%", maxWidth: "520px",
        background: "white",
        border: "1.5px solid #f0c4c4", borderLeft: "4px solid #c0392b",
        borderRadius: "12px", padding: "1.1rem 1.3rem",
        marginBottom: "1.25rem",
        boxShadow: "0 4px 20px rgba(192,57,43,0.08)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.9rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "#fdf2f2", border: "1.5px solid #f0c4c4",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5C4 1.5 1.5 4 1.5 7S4 12.5 7 12.5 12.5 10 12.5 7 10 1.5 7 1.5Z"
                stroke="#c0392b" strokeWidth="1.4" fill="none" />
              <path d="M7 4.5V7.5" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="7" cy="9.5" r="0.7" fill="#c0392b" />
            </svg>
          </div>
          <div>
            <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "0.9rem", fontWeight: 700, color: "#1a1a1a", margin: 0 }}>
              Something went wrong
            </p>
            <p style={{ fontSize: "0.8rem", color: "#888", lineHeight: 1.5, margin: "0.2rem 0 0" }}>
              {message}
            </p>
          </div>
        </div>
        <button onClick={onDismiss} aria-label="Dismiss"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: "1.15rem", lineHeight: 1, padding: "2px", flexShrink: 0, transition: "color 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#888")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#ccc")}
        >×</button>
      </div>
      <div style={{ height: 1, background: "#f5eded", margin: "0.9rem 0" }} />
      <div style={{ display: "flex", gap: "0.7rem", alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={onRetry}
          style={{
            background: "#c0392b", color: "white", border: "none", borderRadius: "6px",
            padding: "0.45rem 1rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            boxShadow: "0 2px 8px rgba(192,57,43,0.22)", transition: "background 0.18s, transform 0.14s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#a93226"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#c0392b"; e.currentTarget.style.transform = "translateY(0)"; }}
        >↺ Try again</button>
        <span style={{ fontSize: "0.75rem", color: "#bbb" }}>
          Backend should be on{" "}
          <code style={{ background: "#f7f4ef", padding: "0.1rem 0.3rem", borderRadius: "4px", fontSize: "0.72rem", color: "#999", border: "1px solid #e8e2d9" }}>
            localhost:8000
          </code>
        </span>
      </div>
    </motion.div>
  );
}

export default function Calculator() {
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [lastFormData, setLastFormData] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    setLastFormData(formData);
    setLoading(true);
    setError(null);
    try {
      const { data } = await calculateCliff(formData);
      navigate("/results", { state: { results: data, formData } });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to connect to the backend. Make sure the API is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>{loading && <LoadingScreen />}</AnimatePresence>

      <div style={{
        minHeight: "calc(100vh - 58px)",
        background: "linear-gradient(155deg, #f7f4ef 0%, #ede8df 55%, #e4dbd0 100%)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}>
        <style>{`
          ${FONT_IMPORT}
          @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
          @keyframes spin-ring { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        `}</style>

        {/* Grain overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`,
          backgroundSize: "200px",
        }} />

        {/* Decorative cliff SVG bottom-right */}
        <div style={{
          position: "absolute", right: "-30px", bottom: "-20px",
          pointerEvents: "none", opacity: 0.055, zIndex: 0,
        }} aria-hidden="true">
          <svg width="520" height="380" viewBox="0 0 520 380" fill="none">
            <path d="M 20 340 C 80 310 150 275 210 245 C 270 215 320 185 355 160"
              stroke="#c0392b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M 355 160 L 357 290"
              stroke="#c0392b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M 357 290 C 410 290 465 286 500 283"
              stroke="#c0392b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <circle cx="355" cy="160" r="10" fill="#c0392b" />
            {[80,160,240,320,400,480].map(x => (
              <line key={x} x1={x} y1="30" x2={x} y2="360"
                stroke="#2c3e50" strokeWidth="0.7" strokeDasharray="5 5"/>
            ))}
            {[80,160,240,320].map(y => (
              <line key={y} x1="20" y1={y} x2="500" y2={y}
                stroke="#2c3e50" strokeWidth="0.7" strokeDasharray="5 5"/>
            ))}
          </svg>
        </div>

        {/* Main content */}
        <div style={{
          position: "relative", zIndex: 1,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          minHeight: "calc(100vh - 58px)",
          padding: "4rem 1.5rem 5rem",
        }}>

          {/* Heading block */}
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: "center", marginBottom: "2.25rem", maxWidth: "540px", width: "100%" }}
          >
            {/* Eyebrow */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "0.65rem", marginBottom: "0.9rem",
            }}>
              <div style={{ width: 24, height: 1.5, background: "#c0392b", borderRadius: 2 }} />
              <span style={{
                fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.16em",
                color: "#c0392b", textTransform: "uppercase",
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}>Benefits Cliff Calculator</span>
              <div style={{ width: 24, height: 1.5, background: "#c0392b", borderRadius: 2 }} />
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(1.9rem, 4vw, 2.9rem)",
              fontWeight: 900, color: "#1a1a1a",
              lineHeight: 1.12, margin: "0 0 0.8rem",
            }}>
              Find your{" "}
              <em style={{ color: "#c0392b", fontStyle: "italic" }}>benefits cliff</em>
            </h1>

            <p style={{
              fontSize: "0.95rem", color: "#777", lineHeight: 1.65, margin: 0,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
              Enter your details to see exactly where earning more starts costing you and how much.
            </p>


          </motion.div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <ErrorState
                message={error}
                onRetry={() => handleSubmit(lastFormData)}
                onDismiss={() => setError(null)}
              />
            )}
          </AnimatePresence>

          {/* Form card */}
          <IncomeForm onSubmit={handleSubmit} loading={loading} />

          {/* Trust line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            style={{
              marginTop: "1.5rem", fontSize: "0.72rem", color: "#bbb",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              display: "flex", alignItems: "center", gap: "0.5rem",
            }}
          >
            <span style={{ width: 12, height: 1, background: "#ddd", display: "inline-block" }} />
            No account required · Your data stays local
            <span style={{ width: 12, height: 1, background: "#ddd", display: "inline-block" }} />
          </motion.p>
        </div>
      </div>
    </>
  );
}