import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M4 22 C8 18 11 14 14 10 C16 7 17.5 5.5 19 5" stroke="#c0392b" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M19 5 L19 17" stroke="#c0392b" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M19 17 C21 17 23 16.5 24 16" stroke="#c0392b" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="19" cy="5" r="2" fill="#c0392b"/>
        <line x1="4" y1="22" x2="24" y2="22" stroke="#ddd6cc" strokeWidth="1" strokeDasharray="3 3"/>
      </svg>
    ),
    title: "Detect Your Cliff",
    desc: "See exactly where a raise could cost you more in lost benefits than you'd gain in pay.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="4" width="20" height="20" rx="3" stroke="#1a1a1a" strokeWidth="1.6" fill="none"/>
        <line x1="9" y1="4" x2="9" y2="24" stroke="#ddd6cc" strokeWidth="1"/>
        <line x1="4" y1="10" x2="24" y2="10" stroke="#ddd6cc" strokeWidth="1"/>
        <rect x="11" y="12" width="4" height="8" rx="1" fill="#c0392b" opacity="0.7"/>
        <rect x="16" y="15" width="4" height="5" rx="1" fill="#c0392b" opacity="0.4"/>
        <rect x="6"  y="14" width="4" height="6" rx="1" fill="#c0392b"/>
      </svg>
    ),
    title: "Run the Numbers",
    desc: "Enter your income, state, and household size to get a full benefits breakdown in seconds.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 3 L5 7 L5 15 C5 19.5 9 23.5 14 25 C19 23.5 23 19.5 23 15 L23 7 Z"
          stroke="#1a1a1a" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
        <path d="M9.5 14 L12.5 17 L18.5 11" stroke="#1D9E75" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Optimize Safely",
    desc: "Get concrete strategies like pre-tax contributions, FSAs, and more to stay on the safe side of the cliff.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M5 8 C5 6.3 6.3 5 8 5 L20 5 C21.7 5 23 6.3 23 8 L23 16 C23 17.7 21.7 19 20 19 L16 19 L12 23 L12 19 L8 19 C6.3 19 5 17.7 5 16 Z"
          stroke="#1a1a1a" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
        <circle cx="10" cy="12" r="1.2" fill="#1a1a1a"/>
        <circle cx="14" cy="12" r="1.2" fill="#1a1a1a"/>
        <circle cx="18" cy="12" r="1.2" fill="#1a1a1a"/>
      </svg>
    ),
    title: "Ask an Advisor",
    desc: "Chat with a Gemini-powered advisor that explains your situation in plain language.",
  },
];

const STATS = [
  { value: "30M+", label: "households affected" },
  { value: "$10K+", label: "lost per year per family" },
  { value: "4", label: "benefit programs tracked" },
];

export default function Home() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif", background: "#f7f4ef" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');

        .hero-font { font-family: 'Playfair Display', Georgia, serif; }
        .body-font { font-family: 'DM Sans', system-ui, sans-serif; }

        .grain-overlay {
          position: absolute; inset: 0; pointer-events: none; z-index: 1;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 200px;
        }

        .cliff-line {
          stroke-dasharray: 800;
          stroke-dashoffset: 800;
          animation: draw-line 2.2s ease-out 0.6s forwards;
        }
        @keyframes draw-line {
          to { stroke-dashoffset: 0; }
        }

        .drop-line {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: draw-line 0.5s ease-in 2.6s forwards;
        }

        .pulse-dot {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.4); }
        }

        .cta-primary {
          background: #c0392b;
          color: white;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(192,57,43,0.35);
        }
        .cta-primary:hover {
          background: #a93226;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(192,57,43,0.45);
        }

        .cta-secondary {
          border: 2px solid #2c3e50;
          color: #2c3e50;
          background: transparent;
          transition: background 0.2s, transform 0.15s;
        }
        .cta-secondary:hover {
          background: rgba(44,62,80,0.06);
          transform: translateY(-2px);
        }

        .stat-card {
          border-left: 3px solid #c0392b;
          background: white;
        }

        .feature-card {
          background: white;
          border: 1px solid #e8e2d9;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.08);
        }

        .warning-band {
          background: #2c3e50;
          color: #f7f4ef;
        }
      `}</style>

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden"
        style={{ minHeight: "92vh", display: "flex", alignItems: "center" }}
      >
        {/* Warm background */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #f7f4ef 0%, #ede8df 45%, #e8ddd0 100%)",
          }}
        />
        <div className="grain-overlay" />

        {/* Decorative SVG cliff chart — large, background right */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none"
          aria-hidden="true"
        >
          <svg
            width="600"
            height="500"
            viewBox="0 0 600 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ opacity: 0.13 }}
          >
            {/* Rising income line */}
            <path
              className="cliff-line"
              d="M 40 420 C 100 400 160 370 220 340 C 280 310 330 280 370 255"
              stroke="#c0392b"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            {/* Cliff drop */}
            <path
              className="drop-line"
              d="M 370 255 L 372 390"
              stroke="#c0392b"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            {/* After-cliff flat */}
            <path
              className="drop-line"
              d="M 372 390 C 430 390 500 385 560 380"
              stroke="#c0392b"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            {/* Cliff point dot */}
            <circle className="pulse-dot" cx="370" cy="255" r="10" fill="#c0392b" />
            {/* Grid lines */}
            {[100, 200, 300, 400].map((y) => (
              <line key={y} x1="40" y1={y} x2="560" y2={y} stroke="#2c3e50" strokeWidth="0.8" strokeDasharray="6 6" />
            ))}
            {[140, 240, 340, 440, 540].map((x) => (
              <line key={x} x1={x} y1="60" x2={x} y2="440" stroke="#2c3e50" strokeWidth="0.8" strokeDasharray="6 6" />
            ))}
          </svg>
        </motion.div>

        {/* Hero content */}
        <div className="relative z-10 max-w-5xl mx-auto px-8 py-24 w-full">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="body-font mb-6 flex items-center gap-3"
            >
              <div style={{ width: 36, height: 2, background: "#c0392b" }} />
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  color: "#c0392b",
                  textTransform: "uppercase",
                }}
              >
                Benefits Cliff Calculator
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="hero-font"
              style={{
                fontSize: "clamp(2.8rem, 6vw, 4.5rem)",
                lineHeight: 1.1,
                color: "#1a1a1a",
                fontWeight: 900,
                marginBottom: "1.5rem",
              }}
            >
              A raise shouldn't
              <br />
              <em style={{ color: "#c0392b", fontStyle: "italic" }}>cost</em> you more
              <br />
              than it pays.
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="body-font"
              style={{
                fontSize: "1.1rem",
                lineHeight: 1.7,
                color: "#4a4a4a",
                maxWidth: "480px",
                marginBottom: "2.5rem",
              }}
            >
              CliffSafe shows you exactly where earning more triggers a loss in government benefits
              and builds a plan to keep you on the safe side.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="body-font flex flex-wrap gap-4"
            >
              <button
                onClick={() => navigate("/calculator")}
                className="cta-primary"
                style={{
                  padding: "0.9rem 2.2rem",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  letterSpacing: "0.01em",
                }}
              >
                Calculate My Cliff →
              </button>
              <button
                onClick={() =>
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
                }
                className="cta-secondary"
                style={{
                  padding: "0.9rem 2.2rem",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                How It Works
              </button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              className="body-font flex flex-wrap gap-5 mt-14"
            >
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="stat-card"
                  style={{ padding: "0.9rem 1.2rem", borderRadius: "6px", minWidth: "120px" }}
                >
                  <div
                    style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1a1a1a", lineHeight: 1 }}
                    className="hero-font"
                  >
                    {s.value}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#777", marginTop: "0.3rem" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: "80px",
            background: "linear-gradient(to bottom, transparent, #f7f4ef)",
            pointerEvents: "none",
          }}
        />
      </section>

      {/* ── WARNING BAND ── */}
      <section className="warning-band body-font py-6 px-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <span style={{ fontSize: "1.4rem" }}>⚠️</span>
          <div>
            <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
              The benefits cliff affects over 30 million American households.{" "}
            </span>
            <span style={{ fontSize: "0.9rem", opacity: 0.75 }}>
              A $1 raise can cost a family of four $10,000+ per year in lost assistance.
              CliffSafe helps you navigate it.
            </span>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ background: "#f7f4ef", padding: "6rem 2rem" }}>
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <div className="body-font flex items-center justify-center gap-3 mb-4">
              <div style={{ width: 28, height: 2, background: "#c0392b" }} />
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  color: "#c0392b",
                  textTransform: "uppercase",
                }}
              >
                How it works
              </span>
              <div style={{ width: 28, height: 2, background: "#c0392b" }} />
            </div>
            <h2
              className="hero-font"
              style={{ fontSize: "2.4rem", fontWeight: 800, color: "#1a1a1a" }}
            >
              Four steps to clarity
            </h2>
          </motion.div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
                className="feature-card"
                style={{ padding: "1.8rem 1.4rem", borderRadius: "12px" }}
              >
                <div style={{ marginBottom: "1rem" }}>{f.icon}</div>
                <h3
                  className="hero-font"
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "#1a1a1a",
                    marginBottom: "0.6rem",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  className="body-font"
                  style={{ fontSize: "0.875rem", color: "#666", lineHeight: 1.6 }}
                >
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-16 body-font"
          >
            <p style={{ color: "#666", marginBottom: "1.4rem", fontSize: "0.95rem" }}>
              Ready to see where your cliff is?
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/calculator")}
                className="cta-primary body-font"
                style={{
                  padding: "0.9rem 2.4rem",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Get Started — It's Free →
              </button>
              <button
                onClick={() => navigate("/how-it-works")}
                className="body-font"
                style={{
                  padding: "0.9rem 2.4rem",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: "white",
                  border: "1.5px solid #d4cdc5",
                  color: "#1a1a1a",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#c0392b";
                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(192,57,43,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#d4cdc5";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                Learn More
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}