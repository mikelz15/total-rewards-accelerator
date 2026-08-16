# TRA SaaS roadmap

**Status:** Phase 0–1 scaffolding in repo (v0.5.0 API)  
**Stack:** Supabase Auth + Postgres · FastAPI `/api/v1` · Next.js `/app`  
**Public demo:** unchanged at `/cleaner`, `/auditor`, etc.

## Architecture

| Path | Mode | Auth | Data |
|------|------|------|------|
| `/`, modules, pricing | Public demo | Optional `DEMO_PASSWORD` | `sessionStorage` + demo API caps |
| `/app/*` | SaaS | Supabase session | Postgres via `/api/v1` + Bearer JWT |
| `/api/*` (existing) | Demo API | Optional header password | In-memory candidates, sample-only pipeline |
| `/api/v1/*` | SaaS API | `Authorization: Bearer <supabase_access_token>` | Org-scoped rows |

## Setup (local)

### 1. Create Supabase project

1. [supabase.com](https://supabase.com) → New project  
2. **SQL** → paste and run `api/app/db/migrations/001_saas.sql`  
3. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - JWT Secret (Settings → API) → `SUPABASE_JWT_SECRET` on API
   - Database URI → `DATABASE_URL` on API  

### 2. API

```bash
cd api
python3 -m pip install -r requirements.txt
# export DATABASE_URL=...
# export SUPABASE_JWT_SECRET=...
PYTHONPATH=. python3 -m uvicorn app.main:app --reload --port 8000
curl -s http://127.0.0.1:8000/health | python3 -m json.tool
# expect "saas": { "enabled": true, ... }
```

### 3. Web

```bash
cd web
# add Supabase keys to .env.local (see .env.example)
npm install
npm run dev
```

Open http://localhost:3000/signup → create account → lands on `/app`.

## Phase checklist

### Phase 1 (current)

- [x] Schema migration  
- [x] JWT verification + org bootstrap on `GET /api/v1/me`  
- [x] Datasets CRUD  
- [x] Candidates CRUD (org-scoped)  
- [x] SaaS cleaner (`/api/v1/cleaner/*`)  
- [x] `/app` shell, signup/login (when Supabase configured)  
- [x] Equity/Merit/Closer under `/app` + `/api/v1/auditor|remediation|closer`  
- [x] Analysis runs persisted (audit / remediation / closer)  
- [ ] Production env on Render + Vercel (Supabase project + secrets)  


### Phase 2

- [ ] Stripe subscriptions + module entitlements  
- [ ] Customer portal  

### Phase 3

- [ ] Invites, audit log UI, anonymize toggle, scenario compare  

## Isolation rule

Every SaaS query filters by `org_id` from the caller’s membership. Never trust client-supplied `org_id` without membership check.
