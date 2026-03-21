# CliffSafe — Benefits Cliff Calculator

CliffSafe helps low-income and gig workers understand exactly where a raise or extra hours causes a net loss in total compensation due to lost government benefits — SNAP, Medicaid, childcare subsidies, housing assistance. We run a Monte Carlo simulation to show the probability your income volatility hits that cliff this year, find the income sweet spot that maximizes real take-home, and explain it all in plain English via a Claude-powered AI advisor.

Built in response to the One Big Beautiful Bill (signed July 4, 2025), which introduced $863B in Medicaid cuts, new work requirements, and more frequent eligibility checks — making the cliff steeper and harder to see coming.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + NumPy + Pydantic |
| Frontend | React 18 + Tailwind CSS + Recharts + Framer Motion |
| AI | Anthropic Claude API (streaming) |

---

## Local Development

### Prerequisites
- Python 3.10+
- Node 18+

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
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm start
```

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
│   │   │   └── optimizer.py        # POST /api/optimize
│   │   └── services/
│   │       ├── cliff_engine.py     # Core cliff math + Monte Carlo
│   │       └── benefits_data.py    # FPL thresholds by state/household
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── IncomeForm.jsx      # Input form
│   │   │   ├── CliffChart.jsx      # Hero cliff curve visualization
│   │   │   ├── ResultsPanel.jsx    # Cliff analysis results
│   │   │   ├── OptimizerCard.jsx   # Income optimization strategies
│   │   │   └── AdvisorChat.jsx     # Claude advisor streaming UI
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
Calculate benefits cliff for a given income scenario.

**Body:**
```json
{
  "gross_income": 38000,
  "household_size": 3,
  "state": "NC",
  "employment_type": "gig"
}
```

### `GET /api/benefits/{state}/{household_size}`
Get benefit program thresholds for a state and household size.

### `POST /api/optimize`
Get income optimization strategies to preserve benefits eligibility.

### `POST /advisor`
Stream a plain-English Claude summary of the user's cliff situation.

---

## Task List

Add your name next to the task you're owning.

### Backend
- [ ] Real cliff math in `cliff_engine.py` — FPL-based thresholds, benefit phase-out curves — **\_\_\_\_\_\_\_\_**
- [ ] Monte Carlo simulation (1000 runs, 12-month income paths, gig vs salaried variance) — **\_\_\_\_\_\_\_\_**
- [ ] Real benefits thresholds by state/household in `benefits_data.py` — **\_\_\_\_\_\_\_\_**
- [ ] `/advisor` endpoint — Claude API streaming via SSE — **\_\_\_\_\_\_\_\_**
- [ ] Wire real calc logic into `/calculate` and `/optimize` routes — **\_\_\_\_\_\_\_\_**

### Frontend
- [ ] `CliffChart.jsx` — Recharts line chart showing income vs net compensation curve with cliff drop — **\_\_\_\_\_\_\_\_**
- [ ] `AdvisorChat.jsx` — SSE streaming UI for Claude advisor response — **\_\_\_\_\_\_\_\_**
- [ ] `IncomeForm.jsx` — form polish, state dropdown, employment type selector — **\_\_\_\_\_\_\_\_**
- [ ] `ResultsPanel.jsx` — display cliff points, benefits lost, effective marginal rate — **\_\_\_\_\_\_\_\_**
- [ ] `OptimizerCard.jsx` — display optimization steps and net gain — **\_\_\_\_\_\_\_\_**
- [ ] Mobile-responsive layout — **\_\_\_\_\_\_\_\_**

### Backend
- [ ] `/advisor` endpoint — add empathetic system prompt that uses user's actual cliff numbers — **\_\_\_\_\_\_\_\_**
- [ ] Error handling + input validation on all routes — **\_\_\_\_\_\_\_\_**
- [ ] CORS config — allow production frontend URL (Vercel) — **\_\_\_\_\_\_\_\_**


### Frontend
- [ ] Home page — hero section with tagline and CTA — **\_\_\_\_\_\_\_\_**
- [ ] Loading states / skeleton UI while waiting on API — **\_\_\_\_\_\_\_\_**
- [ ] Error state UI if API call fails — **\_\_\_\_\_\_\_\_**
- [ ] Animated cliff drop on chart (Framer Motion) — **\_\_\_\_\_\_\_\_**
- [ ] Color coding — green (safe zone) / red (cliff zone) on chart — **\_\_\_\_\_\_\_\_**
- [ ] "Share your results" copy-to-clipboard or screenshot — **\_\_\_\_\_\_\_\_**

