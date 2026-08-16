# Connect Supabase to TRA (after project is created)

## Checklist

1. [ ] SQL migration ran: `api/app/db/migrations/001_saas.sql`
2. [ ] RLS enabled on SaaS tables (optional policies — skip for Phase 1)
3. [ ] Fill `api/.env` and `web/.env.local` (templates ready, gitignored)
4. [ ] Start API + web and open `/signup`

## Where to copy values

| Supabase UI | File | Variable |
|-------------|------|----------|
| Settings → API → Project URL | `web/.env.local` | `NEXT_PUBLIC_SUPABASE_URL` |
| Settings → API → `anon` `public` | `web/.env.local` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Settings → API → JWT Secret | `api/.env` | `SUPABASE_JWT_SECRET` |
| Settings → Database → Connect → URI | `api/.env` | `DATABASE_URL` |

### DATABASE_URL tips

- Prefer **Session mode** pooler URI if offered.
- If password has special characters, URL-encode them (`@` → `%40`, etc.).
- Our API rewrites `postgres://` → `postgresql+psycopg://` automatically.

### Auth settings (recommended for local)

- Authentication → Providers → Email → enable Email
- **URL Configuration** (Authentication → URL Configuration):
  - **Site URL:** `http://localhost:3000`
  - **Redirect URLs** (add all):
    - `http://localhost:3000/auth/callback`
    - `http://localhost:3000/auth/reset-password`
    - `http://localhost:3000/**`
- Email confirm links must land on `/auth/callback` (or `/auth/confirm` for hash tokens), not a blank root page.
- For fastest local testing you may disable “Confirm email” temporarily  
  (Authentication → Providers → Email → Confirm email = off)

## Run locally

```bash
# Terminal 1 — API
cd ~/Desktop/Total_Rewards_Accelerator/api
python3 -m pip install -r requirements.txt
PYTHONPATH=. python3 -m uvicorn app.main:app --reload --port 8000

# Terminal 2 — Web
cd ~/Desktop/Total_Rewards_Accelerator/web
npm run dev
```

```bash
curl -s http://127.0.0.1:8000/health | python3 -m json.tool
# expect: "saas": { "enabled": true, ... }
```

Open http://localhost:3000/signup → create account → `/app`.

## Production (later)

Add the same keys to:

- **Vercel** (web): `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_API_URL` (Render API URL)
- **Render** (API): `DATABASE_URL`, `SUPABASE_JWT_SECRET`, `CORS_ORIGINS`
