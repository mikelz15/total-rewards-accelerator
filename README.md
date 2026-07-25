# Total Rewards Accelerator

**Stop crunching rows. Start designing strategy.**

Mikéz Comp Engineering Toolkit — a thin full-stack MVP of the portfolio program in  
`Michael L Lopez Portfolio 2025 / 7. Total Rewards Accelerator *Program Created*`.

## Modules

| # | Module | What it does |
|---|--------|----------------|
| 01 | **Market Data Cleaner** | Upload/paste messy HRIS CSV → map columns, fix money/dates → analysis-ready records |
| 02 | **Pay Equity Auditor** | Compa-ratio scatter, under/overpaid flags, top 5 raise targets + gap to parity |
| 03 | **Candidate Closer** | Base / bonus / LTI → 4-year total wealth projection + one-page PDF |

**Three-Click Philosophy:** no action, analysis, or remediation should take more than three clicks.

## Stack

- **Web:** Next.js 14 (App Router) + TypeScript + Tailwind + Recharts  
- **API:** FastAPI + pandas + ReportLab  
- **Path:** `~/Desktop/Total_Rewards_Accelerator`

## Prerequisites

- Node.js 20+ (this machine uses nvm: `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"`)
- Python 3.9+ with packages from `api/requirements.txt`

## Run locally

### 1. API (port 8000)

```bash
cd ~/Desktop/Total_Rewards_Accelerator/api
python3 -m pip install --user -r requirements.txt
PYTHONPATH=. python3 -m uvicorn app.main:app --reload --port 8000
```

API docs: http://127.0.0.1:8000/docs

### 2. Web (port 3000)

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
cd ~/Desktop/Total_Rewards_Accelerator/web
npm install
npm run dev
```

App: http://localhost:3000

### Demo path (three clicks)

1. Open **Market Data Cleaner** → **Load sample HRIS**  
2. Click **Send to Pay Equity Auditor** → **Run equity audit**  
3. Open **Candidate Closer** → **Project total wealth** / **Download PDF**

## Project layout

```
Total_Rewards_Accelerator/
├── api/
│   ├── app/
│   │   ├── main.py              # FastAPI routes
│   │   ├── data/sample_hris.csv
│   │   └── services/
│   │       ├── cleaner.py
│   │       ├── auditor.py
│   │       └── closer.py
│   └── requirements.txt
├── web/                         # Next.js frontend
└── README.md
```

## Environment

Optional web override:

```bash
# web/.env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Status (v0.3.1)

MVP demo-ready — domain logic and UI wired end-to-end with sample data.

**Included now**
- Cleaner → Auditor/Flight risk → Merit remediation → Candidates → Closer PDF
- Placement engine (YOE + education) shared across modules
- **Reset demo** (nav) + one-click sample path
- **CSV export pack** (cleaned / audit / merit allocations)
- Optional **demo password** (`DEMO_PASSWORD` on web; optional API header)

**Not yet:** multi-tenant auth, persistence, real ML flight-risk, HRIS connectors, billing.

### Hosting
See `deploy/README.md` (Render blueprint, Vercel web + API, Docker).

### Demo password (optional)

```bash
# web/.env.local
DEMO_PASSWORD=pilot2026
# NEXT_PUBLIC_API_DEMO_PASSWORD=pilot2026   # only if API also sets DEMO_PASSWORD
```

Built to match the portfolio product narrative (Cleaner · Auditor · Closer · intelligence layer later).
