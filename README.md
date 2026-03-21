# CliffSafe — Benefits Cliff Calculator

CliffSafe helps low-income and gig workers understand exactly where a raise or extra hours causes a net loss in total compensation due to lost government benefits — SNAP, Medicaid, childcare subsidies, housing assistance. We run a Monte Carlo simulation to show the probability your income volatility hits that cliff this year, find the income sweet spot that maximizes real take-home, and explain it all in plain English via a Gemini-powered AI advisor.

Built in response to the One Big Beautiful Bill (signed July 4, 2025), which introduced $863B in Medicaid cuts, new work requirements, and more frequent eligibility checks — making the cliff steeper and harder to see coming.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + NumPy + Pydantic |
| Frontend | React 18 + Tailwind CSS + Recharts + Framer Motion |
| AI | Google Gemini API (gemini-2.5-flash, streaming SSE) |

---

## Local Development

### Prerequisites
- Python 3.10+
- Node 18+
- Google Gemini API key (`GEMINI_API_KEY`)

### Start everything

```bash
./start.sh
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs

### Manual setup

**Backend**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then add your GEMINI_API_KEY
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm start
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

Get a free API key at https://aistudio.google.com/apikey

---

## Project Structure

```
cliffsafe/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI entry point, CORS
│   │   ├── config.py               # Settings / .env loader
│   │   ├── schemas.py              # Pydantic request/response models
│   │   ├── routes/
│   │   │   ├── calculator.py       # POST /api/calculate
│   │   │   ├── benefits.py         # GET  /api/benefits/{state}/{household_size}
│   │   │   ├── optimizer.py        # POST /api/optimize
│   │   │   ├── monte_carlo.py      # POST /api/monte-carlo
│   │   │   └── advisor.py          # POST /api/advisor (Gemini streaming SSE)
│   │   └── services/
│   │       ├── cliff_engine.py     # Core cliff math + Monte Carlo (NumPy)
│   │       └── benefits_data.py    # 2025 FPL thresholds by state/household
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── IncomeForm.jsx      # Input form
│   │   │   ├── CliffChart.jsx      # Hero cliff curve visualization
│   │   │   ├── ResultsPanel.jsx    # Cliff analysis results
│   │   │   ├── OptimizerCard.jsx   # Income optimization strategies
│   │   │   └── AdvisorChat.jsx     # Gemini advisor streaming UI
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Calculator.jsx
│   │   │   └── Results.jsx
│   │   ├── services/api.js         # Axios instance
│   │   ├── App.jsx
│   │   └── index.js
│   └── package.json
├── start.sh
└── README.md
```

---

## API Reference

### `POST /api/calculate`
Calculate benefits cliff for a given income scenario. Returns net income curve (70 points, $10k–$80k), cliff points, benefit details, and effective marginal rate.

**Body:**
```json
{
  "gross_income": 28000,
  "household_size": 2,
  "state": "NC",
  "employment_type": "self_employed",
  "has_children": true
}
```

### `GET /api/benefits/{state}/{household_size}`
Get benefit program thresholds for a state and household size.

### `POST /api/optimize`
Get income optimization strategies to preserve benefits eligibility.

### `POST /api/monte-carlo`
Run 1000 income simulations, return cliff probability and 90% confidence interval.

**Body:**
```json
{
  "gross_income": 28000,
  "household_size": 2,
  "state": "NC",
  "employment_type": "self_employed",
  "has_children": true,
  "n_simulations": 1000
}
```

### `POST /api/advisor`
Stream a plain-English Gemini summary of the user's cliff situation via Server-Sent Events.

**Body:**
```json
{
  "gross_income": 28000,
  "household_size": 2,
  "state": "NC",
  "employment_type": "self_employed",
  "has_children": true,
  "cliff_probability": 0.56
}
```

**Response:** `text/event-stream`
```
data: {"text": "Based on your numbers..."}
data: {"text": " here's what you need to know..."}
data: [DONE]
```

---

### Backend ✅ Complete (continued)
- [x] `/advisor` endpoint — empathetic system prompt using user's actual cliff numbers
- [x] Error handling + input validation on all routes
- [x] CORS config — allow production frontend URL (Vercel)

### Backend ✅ Complete
- [x] Real cliff math in `cliff_engine.py` — 2025 FPL-based thresholds, SNAP phase-out curves
- [x] Monte Carlo simulation — 1000 runs, 12-month lognormal income paths, gig vs salaried variance
- [x] Real benefits thresholds by state/household in `benefits_data.py` — all 50 states
- [x] `/advisor` endpoint — Gemini API streaming via SSE
- [x] Wire real calc logic into `/calculate` route — net income curve + cliff detection
- [x] `POST /api/monte-carlo` route
- [x] `POST /api/optimize` — replaced hardcoded mock with real optimizer wired to `cliff_engine.py`: scans income curve to find the optimal reportable income (max total compensation), generates sized IRA/401(k)/SEP-IRA/FSA steps with real `benefits_preserved` and `net_gain` computed from actual benefit math, handles self-employed (SEP-IRA) and `has_children` (Dependent Care FSA) scenarios

### Frontend
- [ ] `CliffChart.jsx` — Recharts line chart showing income vs net compensation curve with cliff drop
- [x] `AdvisorChat.jsx` — SSE streaming UI for Gemini advisor response
- [ ] `IncomeForm.jsx` — form polish, state dropdown, employment type selector
- [ ] `ResultsPanel.jsx` — display cliff points, benefits lost, effective marginal rate
- [ ] `OptimizerCard.jsx` — display optimization steps and net gain
- [x] Home page — hero section with tagline and CTA
- [x] Loading states / skeleton UI while waiting on API
- [x] Error state UI if API call fails
- [ ] Animated cliff drop on chart (Framer Motion)
- [ ] Color coding — green (safe zone) / red (cliff zone) on chart
- [ ] Mobile-responsive layout
