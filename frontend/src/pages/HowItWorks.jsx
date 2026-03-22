import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const STEPS = [
  {
    number: "01",
    title: "Detect Your Cliff",
    summary: "See exactly where a raise triggers a net loss.",
    body: `Most people assume that earning more always means taking home more. The benefits cliff is the hidden exception. When your income crosses a program threshold for SNAP, Medicaid, childcare subsidies, or housing assistance, you can lose hundreds or thousands of dollars in annual benefits almost overnight.

CliffSafe maps your entire income range against every benefit program you're currently enrolled in, identifying the precise dollar amounts where a raise could leave you worse off. We call these "cliff points." Some are steep: a single $500 raise crossing a Medicaid threshold can result in a $7,800 annual loss in coverage value. Others are gradual phase-outs that still erode your real compensation faster than your paycheck grows.

The cliff map shows you the full picture: your gross income on one axis, your total compensation (take-home pay plus benefits) on the other. The moment the curve drops is your cliff.`,
    icon: (
      <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
        <path d="M4 22 C8 18 11 14 14 10 C16 7 17.5 5.5 19 5" stroke="#c0392b" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M19 5 L19 17" stroke="#c0392b" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M19 17 C21 17 23 16.5 24 16" stroke="#c0392b" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="19" cy="5" r="2" fill="#c0392b"/>
        <line x1="4" y1="22" x2="24" y2="22" stroke="#ddd6cc" strokeWidth="1" strokeDasharray="3 3"/>
      </svg>
    ),
    accent: "#c0392b",
    accentBg: "rgba(192,57,43,0.06)",
    details: [
      { label: "Programs tracked", value: "SNAP, Medicaid, CHIP, childcare subsidies, housing assistance" },
      { label: "Cliff detection", value: "Flags every income level where net compensation drops" },
      { label: "Data source", value: "Federal Poverty Level thresholds updated annually by state" },
    ],
  },
  {
    number: "02",
    title: "Run the Numbers",
    summary: "A full benefits breakdown in seconds.",
    body: `Understanding your cliff requires knowing exactly which benefits you're receiving, what they're worth in dollar terms, and at what income level each one cuts off. CliffSafe does this calculation automatically based on your state, household size, and employment type.

Each benefit program has its own eligibility formula. SNAP uses 130% of the Federal Poverty Level as a hard cutoff. Medicaid uses 138% in expansion states. Childcare subsidies phase out on a sliding scale. Housing assistance has waiting lists and local variations. We model all of these simultaneously so you don't have to cross-reference multiple government websites.

The result is a benefits breakdown table showing each program's monthly and annual value, the income threshold where you'd lose it, and whether you're currently eligible. This is the foundation everything else is built on. The cliff map, the optimizer, and the advisor all use these numbers.`,
    icon: (
      <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="4" width="20" height="20" rx="3" stroke="#1a1a1a" strokeWidth="1.6" fill="none"/>
        <line x1="9" y1="4" x2="9" y2="24" stroke="#ddd6cc" strokeWidth="1"/>
        <line x1="4" y1="10" x2="24" y2="10" stroke="#ddd6cc" strokeWidth="1"/>
        <rect x="11" y="12" width="4" height="8" rx="1" fill="#c0392b" opacity="0.7"/>
        <rect x="16" y="15" width="4" height="5" rx="1" fill="#c0392b" opacity="0.4"/>
        <rect x="6"  y="14" width="4" height="6" rx="1" fill="#c0392b"/>
      </svg>
    ),
    accent: "#1a1a1a",
    accentBg: "rgba(0,0,0,0.04)",
    details: [
      { label: "Calculation time", value: "Under 2 seconds for a full household analysis" },
      { label: "State coverage", value: "All 50 states with state-specific Medicaid thresholds" },
      { label: "Household sizes", value: "1–6 people, with FPL adjustments per person" },
    ],
  },
  {
    number: "03",
    title: "Optimize Safely",
    summary: "Concrete strategies to stay on the right side of the cliff.",
    body: `Knowing where your cliff is only solves half the problem. The other half is figuring out what to do about it. CliffSafe's income optimizer analyzes your specific situation and generates a ranked set of pre-tax strategies designed to lower your reportable income just enough to preserve your benefits eligibility, without actually reducing your real compensation.

The most common strategies involve pre-tax contributions: 401(k) deferrals, Health Savings Account (HSA) contributions, Flexible Spending Accounts (FSAs), and dependent care FSAs. Each dollar contributed to these accounts reduces your Adjusted Gross Income, which is what most benefit programs use to determine eligibility. A household of three earning $43,000 might contribute $5,000 to an HSA and $3,000 to a dependent care FSA, bringing their reportable income to $35,000, safely below the Medicaid cliff, while their actual spending power remains nearly unchanged.

The optimizer shows you the exact contribution amounts, the benefits preserved, and the net gain for each strategy, ranked by impact.`,
    icon: (
      <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
        <path d="M14 3 L5 7 L5 15 C5 19.5 9 23.5 14 25 C19 23.5 23 19.5 23 15 L23 7 Z"
          stroke="#1a1a1a" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
        <path d="M9.5 14 L12.5 17 L18.5 11" stroke="#1D9E75" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    accent: "#1D9E75",
    accentBg: "rgba(29,158,117,0.06)",
    details: [
      { label: "Strategies modeled", value: "401(k), HSA, FSA, dependent care FSA, IRA contributions" },
      { label: "Output", value: "Ranked steps with exact contribution amounts and net gain" },
      { label: "Goal", value: "Maximize real compensation without crossing a cliff threshold" },
    ],
  },
  {
    number: "04",
    title: "Ask an Advisor",
    summary: "Plain-language explanations powered by AI.",
    body: `Benefits rules are notoriously complex. Phase-out rates, income counting methodologies, household composition rules, and state-level variations make it difficult to understand what the numbers actually mean for your situation. The CliffSafe advisor is designed to bridge that gap.

Powered by AI, the advisor reads your actual cliff analysis: your income, your state, your household size, and the specific programs at risk. It explains everything in plain language. It can tell you why you're close to a Medicaid cliff, what would happen if you took a second job, whether a bonus would push you over a threshold, and what your options are. It can also answer follow-up questions, so you're not left interpreting raw numbers on your own.

The advisor doesn't replace a financial counselor or benefits navigator for complex situations, but for the majority of working households trying to understand what a raise really means for their total compensation, it provides immediate, personalized, and accurate guidance.`,
    icon: (
      <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
        <path d="M5 8 C5 6.3 6.3 5 8 5 L20 5 C21.7 5 23 6.3 23 8 L23 16 C23 17.7 21.7 19 20 19 L16 19 L12 23 L12 19 L8 19 C6.3 19 5 17.7 5 16 Z"
          stroke="#1a1a1a" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
        <circle cx="10" cy="12" r="1.2" fill="#1a1a1a"/>
        <circle cx="14" cy="12" r="1.2" fill="#1a1a1a"/>
        <circle cx="18" cy="12" r="1.2" fill="#1a1a1a"/>
      </svg>
    ),
    accent: "#378ADD",
    accentBg: "rgba(55,138,221,0.06)",
    details: [
      { label: "Powered by", value: "Gemini AI with your actual cliff data as context" },
      { label: "Response style", value: "Conversational, plain-language, no jargon" },
      { label: "Follow-ups", value: "Ask as many questions as you need in the same session" },
    ],
  },
];

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #f7f4ef 0%, #ede8df 60%, #e4dbd0 100%)",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      position: "relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');

        .grain-hiw {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 200px;
        }
      `}</style>

      <div className="grain-hiw" />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "780px", margin: "0 auto", padding: "5rem 1.5rem 6rem" }}>

        {/* ── Page header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: "4rem" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "1rem" }}>
            <div style={{ width: 24, height: 1.5, background: "#c0392b", borderRadius: 2 }} />
            <span style={{
              fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.16em",
              color: "#c0392b", textTransform: "uppercase",
            }}>
              How it works
            </span>
            <div style={{ width: 24, height: 1.5, background: "#c0392b", borderRadius: 2 }} />
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 900, color: "#1a1a1a",
            lineHeight: 1.12, margin: "0 0 1rem",
          }}>
            Four steps from confusion<br />
            to <em style={{ color: "#c0392b", fontStyle: "italic" }}>clarity</em>
          </h1>
          <p style={{ fontSize: "1rem", color: "#777", lineHeight: 1.7, maxWidth: "540px", margin: 0 }}>
            CliffSafe breaks the benefits cliff problem into four distinct layers, each building on the last — so you always know exactly where you stand and what to do next.
          </p>
        </motion.div>

        {/* ── Step sections ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              {/* Step card */}
              <div style={{
                background: "white",
                borderRadius: "16px",
                border: "1px solid #e8e2d9",
                boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
                overflow: "hidden",
              }}>
                {/* Card header strip */}
                <div style={{
                  background: step.accentBg,
                  borderBottom: "1px solid #e8e2d9",
                  padding: "1.5rem 2rem",
                  display: "flex", alignItems: "center", gap: "1.25rem",
                }}>
                  {/* Step number */}
                  <div style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "2.8rem", fontWeight: 900,
                    color: step.accent, opacity: 0.2,
                    lineHeight: 1, flexShrink: 0,
                    letterSpacing: "-0.02em",
                  }}>
                    {step.number}
                  </div>

                  <div style={{ width: 1, height: 48, background: "#e8e2d9", flexShrink: 0 }} />

                  {/* Icon + title */}
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
                    <div style={{ flexShrink: 0 }}>{step.icon}</div>
                    <div>
                      <h2 style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: "1.3rem", fontWeight: 900,
                        color: "#1a1a1a", margin: 0,
                      }}>
                        {step.title}
                      </h2>
                      <p style={{
                        fontSize: "0.85rem", color: "#888",
                        margin: "0.2rem 0 0", lineHeight: 1.4,
                      }}>
                        {step.summary}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: "1.75rem 2rem" }}>
                  {/* Long-form text */}
                  <div style={{ marginBottom: "1.75rem" }}>
                    {step.body.split("\n\n").map((para, j) => (
                      <p key={j} style={{
                        fontSize: "0.925rem", color: "#444",
                        lineHeight: 1.78, margin: j === 0 ? 0 : "1rem 0 0",
                      }}>
                        {para}
                      </p>
                    ))}
                  </div>

                  {/* Detail pills */}
                  <div style={{
                    display: "flex", flexDirection: "column", gap: "0.6rem",
                    borderTop: "1px solid #f0ebe4", paddingTop: "1.25rem",
                  }}>
                    {step.details.map((d) => (
                      <div key={d.label} style={{
                        display: "flex", gap: "0.75rem",
                        alignItems: "baseline", flexWrap: "wrap",
                      }}>
                        <span style={{
                          fontSize: "0.7rem", fontWeight: 700,
                          letterSpacing: "0.08em", textTransform: "uppercase",
                          color: step.accent, flexShrink: 0, width: "145px",
                        }}>
                          {d.label}
                        </span>
                        <span style={{
                          fontSize: "0.875rem", color: "#555", lineHeight: 1.5,
                        }}>
                          {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Connector arrow between cards */}
              {i < STEPS.length - 1 && (
                <div style={{
                  display: "flex", justifyContent: "center",
                  marginTop: "1.25rem",
                }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 3 L10 14" stroke="#ddd6cc" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M5 11 L10 16 L15 11" stroke="#ddd6cc" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* ── Bottom CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            marginTop: "4rem", textAlign: "center",
            padding: "3rem 2rem",
            background: "white",
            borderRadius: "16px",
            border: "1px solid #e8e2d9",
            boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.65rem", marginBottom: "1rem" }}>
            <div style={{ width: 20, height: 1.5, background: "#c0392b", borderRadius: 2 }} />
            <span style={{
              fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em",
              color: "#c0392b", textTransform: "uppercase",
            }}>
              Ready to start
            </span>
            <div style={{ width: 20, height: 1.5, background: "#c0392b", borderRadius: 2 }} />
          </div>
          <h3 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.6rem", fontWeight: 900, color: "#1a1a1a",
            margin: "0 0 0.6rem",
          }}>
            See your cliff in under a minute.
          </h3>
          <p style={{ fontSize: "0.9rem", color: "#888", margin: "0 0 1.75rem", lineHeight: 1.6 }}>
            No account required. Just your income, state, and household size.
          </p>
          <div style={{ display: "flex", gap: "0.85rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/calculator")}
              style={{
                background: "#c0392b", color: "white", border: "none",
                borderRadius: "8px", padding: "0.9rem 2.2rem",
                fontSize: "0.975rem", fontWeight: 700, cursor: "pointer",
                fontFamily: "'DM Sans', system-ui, sans-serif",
                boxShadow: "0 4px 16px rgba(192,57,43,0.3)",
                transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#a93226";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 7px 22px rgba(192,57,43,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#c0392b";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(192,57,43,0.3)";
              }}
            >
              Calculate My Cliff →
            </button>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "white", border: "1.5px solid #d4cdc5",
                borderRadius: "8px", padding: "0.9rem 2.2rem",
                fontSize: "0.975rem", fontWeight: 600, cursor: "pointer",
                fontFamily: "'DM Sans', system-ui, sans-serif",
                color: "#555",
                transition: "border-color 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#c0392b";
                e.currentTarget.style.color = "#c0392b";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#d4cdc5";
                e.currentTarget.style.color = "#555";
              }}
            >
              ← Back To Home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}