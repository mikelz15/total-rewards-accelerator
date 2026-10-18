# Handoff: resume credit tally

From Jarvis to Shiva. 2026-10-18. Michael’s iMac.

Mike asked for this so the work can move if this session caps. Read this, then `docs/VIEWPOINTS.md`. Do not start a new design.

Nothing in this note has been committed. Nothing has been deployed. The live site does not have it.

## What it is

A worksheet in front of Years of experience. It breaks one resume into jobs, credits each job the way a survey match is credited, and drops that total into the Placement Engine that already exists.

It is not a new module, not a new price, and not a new placement formula. `expected_placement_from_credits` stays as it is. Five years of credit to midpoint. Ten more to maximum.

## Decisions already made

Do not reopen these unless Mike says so.

- Four viewpoints, one system. Rewards (today’s home), Recruiter, HRBP, Executive. A viewpoint is the home screen. It is not a new role yet.
- Build the recruiter doors first. Two doors, side by side, not a funnel: tally a resume, or open the four-year page when the years are already known.
- HRBP and Executive are described in `docs/VIEWPOINTS.md`. No `hrbp` role. No `executive` role. No persona wizard.
- `ta` already means Tracker + Closer only. Their home should open on the two doors. Owner and `member` still open on Rewards.
- Full credit: same benchmark as the target job. Half: same family, or a match the analyst marked a grade off or not confident. None: a different function.
- Overlap: one calendar month counts once, at the highest credit. A tie goes to the earlier job.
- The discount happens in the tally. Confirm writes credited years into `years_experience` with `related_fraction` left at 1.0. Do not pass the raw calendar years at 0.5. That cuts the career twice.
- Education stays on the existing ladder. Partial programs do not get credit.
- The raw resume is not stored. The public route computes and drops the paste. Muse `POST /v1/closer` stays numbers in.
- The 2020 benchmark workbooks stay in iCloud. Market rates, the company job catalog, and CompAnalyst descriptions do not go into the repo.

## Benchmark files Mike named

These are the maps. They are not named "mapping."

| File | What it is |
|---|---|
| `Compensation History /Benchmarking/Benchmark Base 4.3.20- MLL.xlsx` | Company job to benchmark job and benchmark code. |
| `Compensation History /Benchmarking/Z Benchmark Review 6.2.20- MLL.xlsx` | Same match, plus family, function, focus, and a second title when the first match is soft. |
| `Benchmarking Excercise 2020 Data.xlsx` | Same workbook shape as the two above. Spelled Excercise. |
| `Compensation History /Benchmarking/Final Z Benchmark Grades 6.9.20.xlsx` | Grades, skills, certs, and a Years of Experience column on the job. |
| `Compensation History /Markets/2020 Markets/CompAnalyst Report out 10.5.19.xlsx` | Benchmark catalog: job code, title, family, description. |
| `Salary Survey/2019/CompAnalyst Report out 10.5.19.xlsx` | Same export as the Markets copy. Same byte size. |

Root for all of them:

`~/Library/Mobile Documents/com~apple~CloudDocs/MIkez Enterprise/MIkez LL HR & Lean Consulting Solutions/`

How a row becomes credit:

- Same benchmark code as the target req: full.
- Same family, or a note that the match is a grade off or not confident: half.
- Different family: none.

The Years of Experience column on the grade file is how a matched job sits in range. It is not the sum of someone’s past jobs. Dates on the resume still produce the years. The match only sets the fraction.

Do not copy descriptions, rates, or company job codes into TRA. The sample uses a short family list written in `api/app/services/resume_credit.py` (`FAMILIES`). That list is a stand-in until a TRA-owned family list exists. It is not the CompAnalyst catalog.

## What is already in the tree

| Path | State |
|---|---|
| `api/app/services/resume_credit.py` | Ledger, paste parser, family and level guess, PDF and DOCX text extract. |
| `api/app/data/sample_resume.txt` | Alex Rivera. Four jobs. |
| `api/tests/test_resume_credit.py` | Eight tests. Passed on this Mac, 2026-10-18. |
| `api/app/routers/resume_credit.py` | Public and signed-in routes. Wired in `api/app/main.py`. |
| `web/src/components/ResumeCredit.tsx` | Paste, sample, ledger, Confirm. |
| `web/src/app/closer/page.tsx` | Tally on the public Closer. Confirm fills Years of experience and Education. `?years=` and `?education=` are read. |
| `web/src/app/app/closer/page.tsx` | Same tally on the signed-in Closer. |
| `web/src/app/app/candidates/page.tsx` | Tally above the pipeline. Confirm opens Closer with the credited years. |
| `web/src/app/app/page.tsx` | A `ta` home shows the two doors, then Candidates and Closer only. |
| `web/src/lib/api.ts` and `web/src/lib/saas-api.ts` | `resumeCreditSample` and `resumeCreditTally`. |
| `docs/VIEWPOINTS.md` | The four homes, and the benchmark method. |

Public routes, nothing stored:

- `GET /api/resume-credit/sample`
- `POST /api/resume-credit/tally` with `{ "text", "target_title" }`
- `POST /api/resume-credit/upload` for one PDF, DOCX, or text file

Signed-in routes require the Closer module and a write role (`ta` has both):

- `GET /api/v1/resume-credit/sample`
- `POST /api/v1/resume-credit/tally`

`pypdf` and `python-docx` are not in `api/requirements.txt` yet. Paste and the sample do not need them. Upload returns a clear error until those packages are added.

## Sample fixture

Target title: Compensation Partner.

| Job | Credit | Why |
|---|---|---|
| Compensation Partner, Jan 2018–Dec 2021 | Full | Same family, same level. |
| Compensation Analyst, Jan 2016–Dec 2017 | Half | Same family, analyst level. |
| Nurse Recruiter, Jan 2014–Dec 2015 | None | Talent, not compensation. |
| Senior Compensation Partner, Jul 2021–Dec 2022 | Full | Same benchmark. Six months of overlap dropped. |

Footer: 6.0 credit years. 9.0 calendar years. Education: Masters. `can_confirm` is true.

A half-credited span of Jan 2010–Dec 2022 is 13.0 calendar years and 6.5 credit years. `place_person(6.5, related_fraction=1.0)` matches typing 6.5. `place_person(6.5, related_fraction=0.5)` is 3.25 and is the bug to avoid.

## Run the tests

```bash
cd ~/Desktop/Projects/Total_Rewards_Accelerator/api
PYTHONPATH=. python3 -m unittest tests.test_resume_credit -v
```

Eight tests, no network. If you change the overlap rule or the sample resume, this file moves first.

## Not done

Do these in order. Stop after each one and look.

1. Browser check. Not done. Public Closer at `/closer`: Sample resume, then Tally, then Confirm. Years of experience should become 6 and Education Masters. Project total wealth should match typing 6 and Masters by hand. Signed-in `/app/closer` does the same. A `ta` account should land on the two doors at `/app`. Owner and member should still see Cleaner first.
2. `?door=tally` on the recruiter home does nothing yet. Both doors open Closer. The tally is already on that page. Either scroll to it, or leave the query as a label. Do not build a second page.
3. The candidate-page tally uses the Role field from Add candidate as the target title. Empty role becomes the word "Role", which matches no family, so every job stays unset and Confirm stays off. Point that target at the selected candidate’s role, or only show the tally once a row is chosen.
4. Confirm does not save the ledger on the candidate row. There is no `credit_json` column. The handoff is the query string into Closer. A migration can wait until Mike wants the lines to survive a refresh. Do not stuff the resume into `notes`.
5. The model that proposes full / half / none is not wired. SpaceXAI, when it is. If the call fails, the row stays unset. The person picks. Do not let the model return years.
6. A real benchmark match against Mike’s files is not built, on purpose. Next step is a TRA-owned family list and a benchmark code on the req, using the column pattern above. Not an import of the xlsx files.
7. HRBP home and Executive home are the note in `docs/VIEWPOINTS.md` only.
8. No commit. No deploy. Mike has not asked for either.

## Leave alone

- Shiva’s seven-scenario walk is a different job. Equity at a $250k pool and a 15% cap, and Closer year-1 cash on the $185,000 offer. The engine stays. The script is what was wrong. Do not "fix" placement while doing this tally.
- Do not import the survey books. Do not paste a rate, a company job code, or a CompAnalyst description into chat, the repo, or a test.
- Do not add a Stripe price. Do not add a resume to Muse. Do not email a prospect. Do not store the raw resume.

## Rio

Shiva’s correction, relayed 2026-10-18: nothing is pending on the recordings email. It went out at 10:25 AM with all six videos attached, and Mike was CC’d. Three packets are with Rio for Jarvis: scenario evidence, the lead queue, and the recordings plus Earworm ideas.

This iMac still cannot open Rio. Those three notes are not in the repo. Filed at `~/.grok/studio/hq/tra/SHIVA-2026-10-18.md`. Do not send the recordings email again. Prospect notes in Sales Tails stay unsent.
