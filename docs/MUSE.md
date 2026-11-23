# Muse TRA architecture

Propose-only compensation connector for agents (Meta Muse or others). Reuses TRA domain services. Humans post pay.

## Principles

- **Propose only.** No HRIS writeback, no email, no posting ranges or offers.
- **`POST /v1/act`** is hard-blocked (403). This route does **not** call `require_key`, so a missing or invalid key also returns 403 (not 401). There are no side effects either way.
- **`send_to_candidate: true`** is refused.
- PHI header scan rejects sensitive columns (SSN, DOB, address, etc.). Cell values are not echoed in the 422 body; flagged header names currently are.
- In-memory job store (max 32 jobs / 500 rows). Not a system of record.

## Auth & key management

Bearer API key (`Authorization: Bearer <key>`).

Keys from env `MUSE_API_KEYS` (comma-separated). Default test key if unset: `tra_test_review`.

How the code actually works today:

- There is no issuance, rotation, or revoke API, and there are no key scopes.
- Keys are **not hashed**. They live as plaintext values in the process environment and are compared with `secrets.compare_digest` on each request (`_keys()` re-reads `MUSE_API_KEYS`).
- "Revoke" means remove the key from `MUSE_API_KEYS`. "Rotate" means add the new key, point clients at it, then remove the old one.
- `/act` is the exception: it does not authenticate (see above).

**Production:**

1. Generate strong keys (e.g. `openssl rand -hex 24`).
2. Set `MUSE_API_KEYS=key1,key2` on the Render service. Never commit live keys.
3. Rotate by adding a new key, deploying if the env change needs a restart, then removing the old key after clients update.
4. Prefer short-lived review keys over long-lived ones. The health endpoint does not expose keys.


## Endpoints

Base: `https://tra-api-starter.onrender.com/v1`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/me` | Workspace + capabilities; confirms writeback/email off |
| POST | `/clean` | `csv_text` or `records` → `job_id` + quality notes. PHI headers → 422. Over 500 rows → `truncated: true` |
| POST | `/place` | Placement (YOE + education) from cleaned job |
| POST | `/audit` | Dual-lens equity notes |
| POST | `/fund` | Merit pool from range penetration / expected placement |
| POST | `/closer` | Four-year total wealth + optional PDF (base64). `want_pdf: false` skips the PDF |
| POST | `/brief` | Short narrative for audience (e.g. CHRO) |
| POST | `/act` | Always 403; no `require_key` |

All analysis steps except `/closer` and `/me` require a prior `job_id` from `/clean`. There is no standalone `/phi` route; PHI handling is inside `/clean`.

## Client snippets

Use a key from `MUSE_API_KEYS`. Do not hard-code production secrets.

```bash
# Confirm the workspace (writeback and email should be false)
curl -sS -H "Authorization: Bearer $MUSE_API_KEY" \
  https://tra-api-starter.onrender.com/v1/me

# Clean from CSV text, then place
JOB=$(curl -sS -H "Authorization: Bearer $MUSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"csv_text":"EE#,Employee Name,Annual Salary\n1,Alex Rivera,120000\n"}' \
  https://tra-api-starter.onrender.com/v1/clean | python3 -c "import sys,json; print(json.load(sys.stdin)['job_id'])")

curl -sS -H "Authorization: Bearer $MUSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"job_id\":\"$JOB\"}" \
  https://tra-api-starter.onrender.com/v1/place

# Clean from a records body instead of csv_text
curl -sS -H "Authorization: Bearer $MUSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"records":[{"EE#":"1","Employee Name":"Alex Rivera","Annual Salary":120000}]}' \
  https://tra-api-starter.onrender.com/v1/clean
```

```python
import os
import httpx

base = "https://tra-api-starter.onrender.com/v1"
headers = {"Authorization": f"Bearer {os.environ['MUSE_API_KEY']}"}

me = httpx.get(f"{base}/me", headers=headers, timeout=30.0)
me.raise_for_status()

clean = httpx.post(
    f"{base}/clean",
    headers=headers,
    json={"records": [{"EE#": "1", "Employee Name": "Alex Rivera", "Annual Salary": 120000}]},
    timeout=30.0,
)
clean.raise_for_status()
job_id = clean.json()["job_id"]

closer = httpx.post(
    f"{base}/closer",
    headers=headers,
    json={"base": 120000, "bonus_pct": 15, "lti": 20000, "want_pdf": True},
    timeout=30.0,
)
closer.raise_for_status()  # includes pdf_base64 when want_pdf is true
```

## OpenAPI

FastAPI auto-generates OpenAPI at `https://tra-api-starter.onrender.com/openapi.json` (also `/docs`).

Muse paths appear under the `muse` tag. The router registers an HTTP Bearer `MuseAPIKey` security scheme, route summaries and descriptions (including a PHI warning on `/clean`), request examples, and documented 401/403/404/422 responses. (`POST /v1/act` documents 403, not 401, because it does not call `require_key`.)

There is no Muse rate limit today, so 429 is not documented on these routes.

## Code

- Router: `api/app/routers/muse.py`
- Mounted in `api/app/main.py`
- Tests: `api/tests/test_muse_clean.py` (blank/parse) and `api/tests/test_muse_endpoints.py` (full flow, records body, truncation, closer PDF, PHI, act, auth on all verbs, OpenAPI contract)
- Public page: `web/src/app/muse/page.tsx`
- Env template: `api/.env.example` (`MUSE_API_KEYS`)

## Relation to TRA

Reuses the same services as the public demo and SaaS routes (`cleaner`, `placement`, `auditor`, `remediation`, `closer`). Completely separate from the multi-tenant `/api/v1/*` Supabase paths.

## Next build items

- Optional durable job store if review workflows grow.
- Stripe entitlements for paid Muse usage (if desired).
- Hashed keys, scopes, and a revoke list if review keys need to become long-lived production credentials.
- Optional `require_key` on `/act` so a missing key returns 401 before the 403 (behavior change; not done here).

See also the live `/muse` page and `docs/STRIPE-SETUP.md` for related commercial groundwork.
