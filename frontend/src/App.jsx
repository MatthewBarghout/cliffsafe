import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Calculator from "./pages/Calculator";
import Results from "./pages/Results";

function Nav() {
  const { pathname } = useLocation();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');

        .cs-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(247, 244, 239, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid #e8e2d9;
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        .cs-nav-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 2rem;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .cs-logo {
          text-decoration: none;
          display: flex;
          align-items: baseline;
          gap: 0;
          line-height: 1;
        }

        .cs-logo-cliff {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 900;
          font-size: 1.25rem;
          color: #1a1a1a;
          letter-spacing: -0.01em;
        }

        .cs-logo-safe {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 900;
          font-size: 1.25rem;
          color: #c0392b;
          font-style: italic;
        }

        .cs-logo-dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          background: #c0392b;
          border-radius: 50%;
          margin-left: 2px;
          margin-bottom: 3px;
          vertical-align: bottom;
        }

        .cs-nav-links {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .cs-nav-link {
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          color: #666;
          padding: 0.4rem 0.85rem;
          border-radius: 6px;
          transition: color 0.18s, background 0.18s;
          position: relative;
        }

        .cs-nav-link:hover {
          color: #1a1a1a;
          background: rgba(0,0,0,0.04);
        }

        .cs-nav-link.active {
          color: #1a1a1a;
          font-weight: 600;
        }

        .cs-nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 2px;
          background: #c0392b;
          border-radius: 2px;
        }

        .cs-nav-cta {
          text-decoration: none;
          font-size: 0.825rem;
          font-weight: 600;
          color: white;
          background: #c0392b;
          padding: 0.45rem 1.1rem;
          border-radius: 6px;
          margin-left: 0.5rem;
          transition: background 0.18s, transform 0.15s, box-shadow 0.18s;
          box-shadow: 0 2px 8px rgba(192,57,43,0.25);
          letter-spacing: 0.01em;
        }

        .cs-nav-cta:hover {
          background: #a93226;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(192,57,43,0.35);
        }

        /* thin red rule below nav — subtle editorial detail */
        .cs-nav-rule {
          height: 1.5px;
          background: linear-gradient(to right, #c0392b 0%, transparent 60%);
          opacity: 0.35;
        }
      `}</style>

      <nav className="cs-nav">
        <div className="cs-nav-inner">
          {/* Logo */}
          <Link to="/" className="cs-logo">
            <span className="cs-logo-cliff">Cliff</span>
            <span className="cs-logo-safe">Safe</span>
            <span className="cs-logo-dot" />
          </Link>

          {/* Links */}
          <div className="cs-nav-links">
            <Link
              to="/"
              className={`cs-nav-link${pathname === "/" ? " active" : ""}`}
            >
              Home
            </Link>
            <Link
              to="/calculator"
              className={`cs-nav-link${pathname === "/calculator" || pathname === "/results" ? " active" : ""}`}
            >
              Calculator
            </Link>
            <Link to="/calculator" className="cs-nav-cta">
              Get Started →
            </Link>
          </div>
        </div>
      </nav>
      <div className="cs-nav-rule" />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/"           element={<Home />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/results"    element={<Results />} />
      </Routes>
    </BrowserRouter>
  );
}