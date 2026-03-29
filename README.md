# Color Word App

Type any word and see its colour.

- Named CSS colours (e.g. "red", "goldenrod") resolve to their actual values
- Any other word gets a unique, deterministic colour via SHA-256

## Setup

**Backend** — first time only:
```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

**Frontend** — first time only:
```bash
cd frontend
npm install
```

## Run

```bash
./run.sh
```

Open **http://localhost:3000**. Press `Ctrl+C` to stop everything.

## Stack

- Backend: FastAPI + uvicorn (Python, runs in `backend/.venv`)
- Frontend: Next.js 14 (React, TypeScript)
