#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "Stopping..."
  kill "$BACKEND_PID" 2>/dev/null
  kill "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  echo "Done."
  exit 0
}

trap cleanup INT TERM

# Free ports if already in use
for PORT in 8000 3000; do
  PID=$(lsof -ti tcp:$PORT 2>/dev/null) && kill $PID 2>/dev/null && sleep 0.3 || true
done

echo "Starting backend..."
"$ROOT/backend/.venv/bin/uvicorn" main:app --app-dir "$ROOT/backend" --port 8000 &
BACKEND_PID=$!

echo "Starting frontend..."
cd "$ROOT/frontend" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop."

wait
