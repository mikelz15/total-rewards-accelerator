# Live demo URLs — Total Rewards Accelerator

**Target stack:** Vercel (web) + Render **Starter** API (always-on)  
**Legacy (free tier, cold starts):** still listed until cutover is complete

## Primary (after cutover — fill in)

| Service | Public URL | Status |
|---------|------------|--------|
| **Web app (share this)** | _Set after Vercel deploy_ | pending |
| **API** | https://tra-api-n0mh.onrender.com | upgrade plan → **Starter** |
| Health | https://tra-api-n0mh.onrender.com/health | — |
| API docs | https://tra-api-n0mh.onrender.com/docs | — |

## Legacy free-tier hosts (temporary)

| Service | Public URL |
|---------|------------|
| Web (Render free) | https://tra-web.onrender.com |
| API | https://tra-api-n0mh.onrender.com |

Free services **spin down when idle** — first load can take 30–60s. Prefer paid API + Vercel web.

## Access

| Item | Value |
|------|--------|
| **Demo password** | `TRA-pilot-2026` |
| Share password | **DM only** — do not put in public LinkedIn body |

Set the same password on Vercel as:

- `DEMO_PASSWORD`
- `NEXT_PUBLIC_API_DEMO_PASSWORD` (must match API `DEMO_PASSWORD`)

## Demo path

1. **Cleaner** → Load messy HRIS sample (≤10 rows; PHI scan; sample preferred)  
2. **Equity + Merit** → Run equity + flight risk → merit toward expected placement  
3. **Candidate Tracker** → sample pipeline only → Open in Closer  
4. **Closer** → Project four-year total wealth / PDF  
5. **Pricing** → SaaS + one-time bands  

## Important

- **Share the web URL only** (Vercel after cutover).  
- Render API should be **Starter (paid)** so cold opens stay fast.  
- **Sample data only** — do not upload real unscrubbed employee files.  
- Deploy runbook: `../deploy/README.md`  
- Repo: [mikelz15/total-rewards-accelerator](https://github.com/mikelz15/total-rewards-accelerator)

## LinkedIn / DM blurb

> Try Total Rewards Accelerator (YOE + education placement):  
> https://YOUR-PROJECT.vercel.app  
> Sample data demo. DM **PILOT** for password + guided walkthrough + SOW.
