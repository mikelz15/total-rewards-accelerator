# Muse TRA architecture

Propose-only compensation connector for agents (Meta Muse or others). Reuses TRA domain services. Humans post pay.

## Principles

- **Propose only.** No HRIS writeback, no email, no posting ranges or offers.
- **`POST /v1/act`** is hard-blocked (403).
- **`send_to_candidate: true`** is refused.
- PHI header scan rejects sensitive columns (SSN, DOB, address, etc.).
- In-memory job store (max 32 jobs / 500 rows). Not a system of record.

## Auth

Bearer API key (`Authorization: Bearer <key>`).  
Keys from `MUSE_API_KEYS` (comma-separated). Default test key: `tra_test_review`.

## Endpoints

Base: `https://tra-api-starter.onrender.com/v1`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/me` | Workspace + capabilities; confirms writeback/email off |
| POST | `/clean` | `csv_text` or `records` → `job_id` + quality notes |
| POST | `/place` | Placement (YOE + education) from cleaned job |
| POST | `/audit` | Dual-lens equity notes |
| POST | `/fund` | Merit pool from range penetration / expected placement |
| POST | `/closer` | Four-year total wealth + optional PDF (base64) |
| POST | `/brief` | Short narrative for audience (e.g. CHRO) |
| POST | `/act` | Always 403 |

All analysis steps except `/closer` require a prior `job_id` from `/clean`.

## Code

- Router: `api/app/routers/muse.py`
- Mounted in `api/app/main.py`
- Tests: `api/tests/test_muse_clean.py` (blank-file / parse guards)
- Public page: `web/src/app/muse/page.tsx`

## Relation to TRA

Reuses the same services as the public demo and SaaS routes (`cleaner`, `placement`, `auditor`, `remediation`, `closer`). Completely separate from the multi-tenant `/api/v1/*` Supabase paths.

## Next build items

- Expand test coverage (place / audit / fund / closer / brief / PHI rejection).
- Production key rotation and key management.
- Optional durable job store if review workflows grow.
- Stripe entitlements for paid Muse usage (if desired).
- OpenAPI polish and example client snippets.

See also the live `/muse` page and `docs/STRIPE-SETUP.md` for related commercial groundwork.
