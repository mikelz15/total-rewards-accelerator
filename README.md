# Total Rewards Accelerator

**Stop crunching rows. Start designing strategy.**

Mikéz Comp Engineering Toolkit — modular compensation engines for market data cleaning, pay equity + merit, candidate tracking, and four-year total wealth projection. Public demo is open; SaaS workspace is live at https://totalrewardsaccelerator.com.

## Modules

Canonical list. If this table changes, follow [docs/SYSTEM-CHANGE-PROTOCOL.md](docs/SYSTEM-CHANGE-PROTOCOL.md).

| # | Module | Route | Commercial |
|---|--------|-------|------------|
| 01 | **Market Data Cleaner** | `/cleaner` | Own price |
| 02 | **Equity + Merit** | `/auditor` | Own price. Includes Cycle Lock |
| 03 | **Cycle Lock** | `/cycle` | Not a separate invoice |
| 04 | **Candidate Tracker** | `/candidates` | Own price |
| 05 | **Candidate Closer** | `/closer` | Own price |
| — | **Muse connector** | `/muse` | Propose-only API for agents |

Full suite is $499/mo or $4,990/year and includes Cycle Lock.

**Three-Click Philosophy:** no action, analysis, or remediation should take more than three clicks.

## Muse connector (propose-only)

Agent-facing API at `https://tra-api-starter.onrender.com/v1` (Bearer key). Verbs: clean, place, audit, fund, closer, brief. No writeback, no email, no system-of-record. Humans post pay. See `/muse` page and `api/app/routers/muse.py`.

## Stack

- **Web:** Next.js 14 (App Router) + TypeScript + Tailwind + Recharts (Vercel)
- **API:** FastAPI + pandas + ReportLab (Render)
- **Auth / data:** Supabase (SaaS) + in-memory demo
- **Billing:** Stripe (groundwork in code; setup pending)

## Live

- Public site: https://totalrewardsaccelerator.com
- API health: https://tra-api-starter.onrender.com/health (v0.6.7)
- Contest / design-partner page live on main

## Status

Production demo + SaaS scaffold live. Muse connector implemented (propose-only). Stripe billing code present; env + products still to finish. Job Matching module in progress. CI/CD secrets open.

See `docs/SAAS-ROADMAP.md`, `docs/STRIPE-SETUP.md`, `docs/PRODUCTION-SAAS.md`.

## Run locally

API:
```bash
cd api
python3 -m pip install -r requirements.txt
PYTHONPATH=. python3 -m uvicorn app.main:app --reload --port 8000
```

Web:
```bash
cd web
npm install
npm run dev
```

Demo path: Cleaner → Auditor → Closer.
