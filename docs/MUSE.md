# Muse TRA architecture

Propose-only compensation connector for agents (Meta Muse or others). Reuses TRA domain services. Humans post pay.

## Principles

- **Propose only.** No HRIS writeback, no email, no posting ranges or offers.
- **`POST /v1/act`** is hard-blocked (403).
- **`send_to_candidate: true`** is refused.
- PHI header scan rejects sensitive columns (SSN, DOB, address, etc.).
- In-memory job store (max 32 jobs / 500 rows). Not a system of record.

## Auth & key management

Bearer API key (`Authorization: Bearer <key>`).

Keys from env `MUSE_API_KEYS` (comma-separated). Default test key if unset: `tra_test_review`.

**Production:**
1. Generate strong keys (e.g. `openssl rand -hex 24`).
2. Set `MUSE_API_KEYS=key1,key2` on the Render service.
3. Rotate by adding a new key, deploying, then removing the old key after clients update.
4. Never commit live keys. Document rotation in the runbook; prefer short-lived review keys over long-lived ones.
5. Health endpoint does not expose keys.

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

## OpenAPI

FastAPI auto-generates OpenAPI at `https://tra-api-starter.onrender.com/openapi.json`.

Muse paths appear under the `muse` tag. Request/response models are the Pydantic classes in the router. For polish:
- Add response examples via `responses=` or schema examples on models.
- Ensure tags and descriptions stay accurate.
- Client snippets can be generated from the live OpenAPI.

## Code

- Router: `api/app/routers/muse.py`
- Mounted in `api/app/main.py`
- Tests: `api/tests/test_muse_clean.py` (blank/parse) and `api/tests/test_muse_endpoints.py` (full flow, PHI, act, auth)
- Public page: `web/src/app/muse/page.tsx`

## Relation to TRA

Reuses the same services as the public demo and SaaS routes (`cleaner`, `placement`, `auditor`, `remediation`, `closer`). Completely separate from the multi-tenant `/api/v1/*` Supabase paths.

## Next build items

- Optional durable job store if review workflows grow.
- Stripe entitlements for paid Muse usage (if desired).
- Example client snippets in this doc.

See also the live `/muse` page and `docs/STRIPE-SETUP.md` for related commercial groundwork.
