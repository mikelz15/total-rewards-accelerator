# COS Handoff — TRA Governance Overlay
**Owner:** Chief of Staff  
**Sponsor:** Comp Engineer (principal)  
**Support:** Jarvis (schema + feeds), Research staff (draft cards), Legal is never staff  
**Status:** Thought → seed pack. No new TRA tab.  
**Date:** 2026-09-17

## What this is
A quiet overlay. TRA already has place, job, person, and a pay event. Governance watches those four fields and speaks only when a rule is in force or effective within 90 days.

If nothing material is true, the screen stays clean.

## What COS owns
1. Weekly 20-minute gate (Monday, 08:00 America/Denver).
2. Accept / reject / watch every drafted rule card before it can chip.
3. Keep `last_verified` honest. Stale is allowed; silent-wrong is not.
4. Escalate to principal only when a chip would change a posting, a range, or a Closer number for an active file.
5. Protect the three-click rule. No new workflow lands without COS sign-off.

## What COS does not own
- Legal advice
- Scraping legislatures
- Building UI
- Opening a Governance module

## Staff map
| Seat | Job | Cadence | Done looks like |
|---|---|---|---|
| **COS** | Gate. Accept/reject cards. Brief principal only on impact. | Weekly 20 min | Queue empty or parked as `watch` |
| **Research / policy staff** | Draft one-line cards from the watchlist terms. Citation + effective date + TRA event. | Weekly, before COS gate | Cards in queue, never auto-published |
| **Jarvis** | Hold schema. Diff hashes. Flag effective-date crossings inside 90 days. | Nightly hash, weekly digest to COS | Digest is empty most weeks |
| **Comp Engineer (principal)** | Sees chips on Auditor / Closer only. Decides product, not statute text. | As needed | No Monday meeting unless COS flags impact |
| **Counsel (external)** | Conflict of laws, multi-state remote, enforcement risk | Exception only | COS writes the question first |

## Accept test for a card
A card becomes a TRA rule only if all five are true:
1. Named jurisdiction
2. Named TRA event (`post_job`, `set_range`, `grant`, `vest`, `exercise`, `pay_bonus`, `classify`)
3. Effective date
4. Official source URL
5. ≤ 240 character plain-language summary

Fail any one → reject or return to Research.

## Quiet rule (non-negotiable)
Chip if:
- `status = in_force` and the row’s geo matches, or
- `status = passed` and `effective_on` is within 90 days

Do not chip `watch` items (example: Delaware 2027).

## This week’s seed
File: `api/app/data/governance_rules.json`  
Jurisdictions in pack: CO, CA, NY, WA, IL, VA, ME, CT (1 Oct 2026 — upcoming chip), DE (watch only), NJ QSBS, federal QSBS, FLSA.

Near-term COS watch: **Connecticut HB 5003 on 2026-10-01.** That is the only seeded item inside the next 90 days that is not already in force.

## Escalation line to principal
Use this format, nothing longer:

> [STATE] · [instrument] · effective [date] · affects [posting / range / Closer tax line] · source [url] · recommend [chip / ignore / ask counsel]

If you cannot fit it in five clauses, the card is not ready.

## Do not do
- Daily digests
- Auto-publish from LegiScan / Open States
- City packs until a live customer geo needs them
- A Governance tab
