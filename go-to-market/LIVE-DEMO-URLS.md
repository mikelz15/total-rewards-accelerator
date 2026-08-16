# Live demo URLs — Total Rewards Accelerator

**Stack:** Vercel (web) + Render **Starter** API (always-on)  
**Updated:** 2026-08-08

## Primary (share this)

| Service | Public URL | Status |
|---------|------------|--------|
| **Web app (share this)** | **https://totalrewardsaccelerator.com** | **live · custom domain** |
| **Privacy** | https://totalrewardsaccelerator.com/privacy | **live** (stores) |
| **API (Starter / paid)** | https://tra-api-starter.onrender.com | **live · always-on** |
| Health | https://tra-api-starter.onrender.com/health | — |
| API docs | https://tra-api-starter.onrender.com/docs | — |
| **Android (Play)** | Production AAB ready — see `mobile/ANDROID-SHIP.md` | upload to Play Console |
| **iOS** | On hold | — |

### Also works (redirect → apex)

| URL | Notes |
|-----|--------|
| https://www.totalrewardsaccelerator.com | → apex |
| https://trytra.vercel.app | → apex |
| https://mikez-tra.vercel.app | → apex |
| https://total-rewards-accelerator.vercel.app | → apex |

## Access

**Open public demo — no password.**  
Sample data only; Cleaner uploads capped (10 rows, PHI header scan, rate limit). Tracker/Closer are sample-only.

Web env (Vercel production):

- `NEXT_PUBLIC_API_URL=https://tra-api-starter.onrender.com`
- `DEMO_PASSWORD` **unset** (open access)

API env (Render `tra-api-starter`):

- `CORS_ORIGINS` includes `https://totalrewardsaccelerator.com` and `https://www.totalrewardsaccelerator.com`
- `CORS_ORIGIN_REGEX=https://.*\.vercel\.app`

## Demo path

1. **Cleaner** → Load messy HRIS sample  
2. **Equity + Merit** → Run equity + flight risk → merit  
3. **Candidate Tracker** → sample pipeline → Open in Closer  
4. **Closer** → four-year total wealth / PDF  
5. **Pricing**  

## Important

- Share **https://totalrewardsaccelerator.com** only.  
- API is **Starter** (~$7/mo) so cold opens stay fast.  
- **Sample data only** — do not upload real employee files.  
- Domain registered via Vercel (`ns1/ns2.vercel-dns.com`).  
- Repo: [mikelz15/total-rewards-accelerator](https://github.com/mikelz15/total-rewards-accelerator)

## LinkedIn / DM blurb

> Try Total Rewards Accelerator (YOE + education placement):  
> https://totalrewardsaccelerator.com  
> Sample data demo — no login. DM **PILOT** for a guided walkthrough + SOW.
