import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: "📉",
    title: "Detect Your Cliff",
    desc: "See exactly where a raise could cost you more in lost benefits than you'd gain in pay.",
  },
  {
    icon: "🧮",
    title: "Run the Numbers",
    desc: "Enter your income, state, and household size — get a full benefits breakdown in seconds.",
  },
  {
    icon: "🛡️",
    title: "Optimize Safely",
    desc: "Get concrete strategies — pre-tax contributions, FSAs, and more — to stay on the safe side of the cliff.",
  },
  {
    icon: "💬",
    title: "Ask an Advisor",
    desc: "Chat with a Claude-powered advisor that explains your situation in plain language.",
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cliff-50 to-white">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl font-extrabold text-cliff-900 leading-tight"
        >
          Don't fall off the<br />
          <span className="text-cliff-600">benefits cliff.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-5 text-lg text-gray-500 max-w-xl mx-auto"
        >
          CliffSafe shows you exactly how a raise affects your government benefits — and helps
          you build a strategy so earning more never means taking home less.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-8 flex gap-4 justify-center"
        >
          <button
            onClick={() => navigate("/calculator")}
            className="bg-cliff-600 hover:bg-cliff-700 text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-colors shadow-md"
          >
            Calculate My Cliff
          </button>
          <button
            onClick={() => navigate("/calculator")}
            className="border border-cliff-300 text-cliff-700 hover:bg-cliff-50 font-semibold px-8 py-3.5 rounded-xl text-lg transition-colors"
          >
            Learn More
          </button>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.4 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center"
            >
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-cliff-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Warning banner */}
      <section className="bg-danger-50 border-t border-danger-100 py-8">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-danger-600 font-semibold text-lg">
            ⚠️ The benefits cliff affects over 30 million American households.
          </p>
          <p className="text-danger-500 text-sm mt-2">
            A $1 raise can cost a family of four $10,000+ per year in lost assistance.
            CliffSafe helps you navigate it.
          </p>
        </div>
      </section>
    </div>
  );
}
