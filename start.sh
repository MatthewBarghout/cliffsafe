#!/bin/bash
# CliffSafe — start frontend + backend

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Starting CliffSafe..."

# Backend
cd "$ROOT/backend"
if [ ! -d "venv" ]; then
  echo "Creating virtualenv..."
  python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
echo "Backend running on http://localhost:8000 (PID $BACKEND_PID)"

# Frontend
cd "$ROOT/frontend"
npm install --silent
npm start &
FRONTEND_PID=$!
echo "Frontend running on http://localhost:3000 (PID $FRONTEND_PID)"

echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
