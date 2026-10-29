# Handoff: Job Matching

From Jarvis. Rebuilt 2026-10-29 on `feature/job-match-rewards` from production `f583fde`.

The earlier branch `feature/job-match` wired the router by deleting the rest of `main.py` after `/health`. Do not merge that branch.

Job Matching is a Compensation / Total Rewards tool. It lives on the Rewards home. It is not a recruiter door, not an HRBP door, and not an Executive door. The résumé tally remains the recruiter tool.

## What it is

One internal job matched to three external jobs. Matches use the description, the duties, the family, and the level. Title is not the match.

Credit distance reuses the survey-match rules already locked for the résumé tally:

- same family and level: full
- same family, different level: half
- different family: dropped

## Decisions

- Included with Cleaner or Equity, and with the suite. Not its own invoice. The $149 line on the old branch was not a decision and is not in this branch.
- One internal job, three external matches.
- Per-account ledger. Confirm writes it. The stored row keeps the credit and the reason, not the description.
- Sample catalog is TRA-owned and short. Survey books and market rates stay out.
- Public compute-and-drop does not store. Confirm is signed in, and only a Rewards seat that can write.

## Still needs Executive before it is on the live site

1. Apply `api/app/db/migrations/007_job_match.sql` to the database. It is not applied.
2. Deploy this branch. It is not on production.

## Leave alone

Do not import the survey books. Do not put market rates in the product. Do not move this to the recruiter door. Do not merge `origin/feature/job-match`.
