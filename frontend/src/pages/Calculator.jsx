import { useState } from "react";
import { useNavigate } from "react-router-dom";
import IncomeForm from "../components/IncomeForm";
import { calculateCliff } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";

function ErrorState({ message, onRetry, onDismiss }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.3 }}
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "white",
          border: "1.5px solid #f0c4c4",
          borderLeft: "4px solid #c0392b",
          borderRadius: "12px",
          padding: "1.25rem 1.4rem",
          marginBottom: "1.5rem",
          boxShadow: "0 4px 20px rgba(192,57,43,0.08)",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            {/* Icon */}
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "#fdf2f2",
                border: "1.5px solid #f0c4c4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1.5C4 1.5 1.5 4 1.5 7S4 12.5 7 12.5 12.5 10 12.5 7 10 1.5 7 1.5Z"
                  stroke="#c0392b" strokeWidth="1.4" fill="none"
                />
                <path d="M7 4.5V7.5" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="7" cy="9.5" r="0.7" fill="#c0392b" />
              </svg>
            </div>

            <div>
              <p
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  marginBottom: "0.2rem",
                }}
              >
                Something went wrong
              </p>
              <p style={{ fontSize: "0.825rem", color: "#777", lineHeight: 1.5 }}>
                {message}
              </p>
            </div>
          </div>

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            aria-label="Dismiss error"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px",
              color: "#bbb",
              flexShrink: 0,
              lineHeight: 1,
              fontSize: "1.2rem",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#888")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#bbb")}
          >
            ×
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "#f5eded", margin: "1rem 0" }} />

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={onRetry}
            style={{
              background: "#c0392b",
              color: "white",
              border: "none",
              borderRadius: "7px",
              padding: "0.5rem 1.1rem",
              fontSize: "0.825rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              boxShadow: "0 2px 8px rgba(192,57,43,0.25)",
              transition: "background 0.2s, transform 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#a93226";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#c0392b";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            ↺ Try again
          </button>
          <span style={{ fontSize: "0.775rem", color: "#aaa" }}>
            Backend should be running on{" "}
            <code
              style={{
                background: "#f7f4ef",
                padding: "0.1rem 0.35rem",
                borderRadius: "4px",
                fontSize: "0.75rem",
                color: "#888",
                border: "1px solid #e8e2d9",
              }}
            >
              localhost:8000
            </code>
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Calculator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

  const handleRetry = () => {
    if (lastFormData) handleSubmit(lastFormData);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f7f4ef 0%, #ede8df 45%, #e8ddd0 100%)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');
        .calc-hero-font { font-family: 'Playfair Display', Georgia, serif; }
        .calc-body-font { font-family: 'DM Sans', system-ui, sans-serif; }
        .grain-overlay-calc {
          position: absolute; inset: 0; pointer-events: none; z-index: 1;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 200px;
        }
      `}</style>

      <div className="grain-overlay-calc" />

      {/* Decorative background SVG */}
      <div
        style={{
          position: "absolute",
          right: "-40px",
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          opacity: 0.07,
          zIndex: 1,
        }}
        aria-hidden="true"
      >
        <svg width="480" height="420" viewBox="0 0 480 420" fill="none">
          <path d="M 30 360 C 80 330 140 300 190 270 C 240 240 285 210 315 188" stroke="#c0392b" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M 315 188 L 317 320" stroke="#c0392b" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M 317 320 C 370 320 430 315 470 310" stroke="#c0392b" strokeWidth="4" strokeLinecap="round" fill="none" />
          <circle cx="315" cy="188" r="9" fill="#c0392b" />
          {[80, 160, 240, 320, 400].map((x) => (
            <line key={x} x1={x} y1="40" x2={x} y2="380" stroke="#2c3e50" strokeWidth="0.8" strokeDasharray="5 5" />
          ))}
          {[100, 180, 260, 340].map((y) => (
            <line key={y} x1="20" y1={y} x2="460" y2={y} stroke="#2c3e50" strokeWidth="0.8" strokeDasharray="5 5" />
          ))}
        </svg>
      </div>

      {/* Main content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "5rem 1.5rem",
        }}
      >
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: "2.5rem", maxWidth: "560px" }}
        >
          <div
            className="calc-body-font"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ width: 28, height: 2, background: "#c0392b" }} />
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.15em",
                color: "#c0392b",
                textTransform: "uppercase",
              }}
            >
              Step 1 of 1
            </span>
            <div style={{ width: 28, height: 2, background: "#c0392b" }} />
          </div>

          <h1
            className="calc-hero-font"
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 900,
              color: "#1a1a1a",
              lineHeight: 1.15,
              marginBottom: "0.85rem",
            }}
          >
            Find your{" "}
            <em style={{ color: "#c0392b", fontStyle: "italic" }}>benefits cliff</em>
          </h1>
          <p
            className="calc-body-font"
            style={{ fontSize: "0.975rem", color: "#666", lineHeight: 1.65 }}
          >
            Enter your details below to see where the cliff hits — and how hard.
          </p>
        </motion.div>

        {/* Error state */}
        {error && (
          <ErrorState
            message={error}
            onRetry={handleRetry}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Form */}
        <IncomeForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}