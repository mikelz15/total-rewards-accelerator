# Handoff: Job Matching

From Jarvis. 2026-10-23.

Job Matching is a Compensation / Total Rewards professional module. It lives on the Rewards home next to Cleaner and Equity. It is not a recruiter door. The résumé tally remains the recruiter tool.

## What it is

One internal job matched to three external jobs. Matches are based on job description, functional duties, family, function, focus, and level — not title alone.

Credit distance reuses the survey-match rules already locked for the résumé tally:

- same benchmark code: full
- same family, or a match a grade off / not confident: half
- different function: none

## Decisions already made

- Lives under the Rewards viewpoint (Compensation / Total Rewards professional).
- One internal job → three external matches.
- Per-account repository (org_id + RLS). No cross-account data.
- 2020 benchmark workbooks stay in iCloud. No CompAnalyst rates or full descriptions imported.
- Sample catalog is TRA-owned and short.
- Confirm writes the ledger; raw survey books are never stored.

## Files in this branch

- `api/app/services/job_match.py`
- `api/app/routers/job_match.py`
- `api/app/db/migrations/006_job_match.sql`
- `docs/HANDOFF-SHIVA-JOB-MATCH.md` (this file)

## Not done

1. Wire the router into `main.py`.
2. Add `job_match` to `MODULES` and plan/role maps in `entitlements.py`.
3. SQLAlchemy models in `models.py`.
4. Persist the ledger on the signed-in route (migration must be applied first).
5. Frontend component on the Rewards home.
6. Tests.
7. Browser check.

## Leave alone

Do not import the survey books. Do not put market rates in the product. Do not move this to the recruiter door.
