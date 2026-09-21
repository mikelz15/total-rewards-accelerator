# LinkedIn pack — TRA governance chip (quiet overlay)

**Date:** 2026-09-21 (COS Monday 08:00 Denver gate)  
**Voice:** Operator first, product second. Quiet overlay. Three-click rule.  
**Source of truth:** [`docs/COS-GOVERNANCE-HANDOFF.md`](../docs/COS-GOVERNANCE-HANDOFF.md) + [`api/app/data/governance_rules.json`](../api/app/data/governance_rules.json)

Use the **hybrid post** this morning. Keep the short version as a first-comment alternate if the long post feels heavy. Pin the escalation line — nothing longer.

Tone guardrails (same as `01-linkedin-post.md`):
- Operator first, product second
- Specific outcomes (posting, range, Closer number)
- Humble confidence — “I built what I needed”
- Clear CTA: DEMO / PILOT
- Not legal advice. Source-linked operator awareness only.

---

## Escalation line (exact COS format — pin this)

> CT · posting (HB 5003) · effective 2026-10-01 · affects posting + range (and supervisor-nexus remote roles) · source https://portal.ct.gov/dol · recommend chip

Use this and nothing longer when briefing the principal.

---

## Hybrid LinkedIn post (publish first)

Most pay-transparency “tools” are another tab, another workflow, another Monday meeting.

That is how operators lose three clicks.

I built the opposite into **Total Rewards Accelerator**.

Governance is not a module.  
It is a **quiet chip**.

TRA already has four fields on every file: **place · job · person · pay event**.  
The overlay watches those four. It speaks only when a rule is **in force**, or **passed and effective within 90 days**.  
If nothing material is true, the screen stays clean.

That is the COS gate I run every Monday at 08:00 Denver:

1. Research drafts a card — jurisdiction, TRA event, effective date, official URL, ≤240 characters.  
2. COS accepts, rejects, or parks it as **watch**.  
3. Principal only gets interrupted if the chip would change a **posting**, a **range**, or a **Closer** number on an active file.

No daily digest. No legislature scrape. No Governance tab.

This week’s only upcoming chip inside the 90-day window:

> CT · posting (HB 5003) · effective 2026-10-01 · affects posting + range (and supervisor-nexus remote roles) · source https://portal.ct.gov/dol · recommend chip

On 1 Oct, Connecticut requires wage or wage range **plus a general description of benefits** in internal and public ads — including roles that report to a CT supervisor. Virginia and Maine already flipped this summer. Delaware stays **watch** until 2027.

Seed pack in the repo today: CO, CA, NY, WA, IL, VA, ME, CT, NJ QSBS, federal QSBS / FLSA. Delaware is parked on purpose.

Philosophy stays the same: **no analysis or remediation should take more than three clicks.** Governance should not break that.

If you want to see how a chip lands on Cleaner → Auditor → Closer without a new workflow:  
→ Comment **DEMO**  
→ Or DM **PILOT**

Not legal advice. Source-linked operator awareness only.

#TotalRewards #Compensation #PayTransparency #PayEquity #PeopleAnalytics #HRTech

---

## First comment (post immediately)

Quick context: I’m a Compensation Partner / Comp Engineer (healthcare + enterprise). This overlay is a seed pack, not a product tab — COS gates every card before it can chip.

Try the sample demo: https://totalrewardsaccelerator.com

Near-term operator note: CT HB 5003 chips on 1 Oct 2026. If you post roles that work in CT or report to a CT supervisor, ranges + benefits description belong in the ad — not in a later offer conversation.

Design-partner seats are limited so I can stay on the file with you.

---

## Short version (if the long post feels heavy)

Governance that needs its own tab is already too loud.

TRA watches place, job, person, and pay event.  
A rule chips only when it is in force — or effective inside 90 days.

Monday 08:00 Denver, COS gates the queue. Principal only hears about it if a posting, a range, or a Closer number moves.

This week’s line:

CT · posting (HB 5003) · effective 2026-10-01 · affects posting + range · recommend chip

Comment **DEMO** or DM **PILOT**.

---

## Visual captions

1. **COS Gate** — “Monday 08:00 Denver. Twenty minutes. Accept / reject / watch. Then silence.”
2. **Seed pack** — “Chip if in force. Chip if passed + ≤90 days. Watch everything else.”
3. **Quiet overlay** — “No new tab. Chips land on Cleaner, Auditor, and Closer only.”

---

## Operator mechanics (do not post — COS / staff only)

**Chip if:** `status = in_force` and geo matches, **or** `status = passed` and `effective_on` is within 90 days.  
**Do not chip:** `watch` items (example: Delaware 2027).

**Accept test for a card** — all five must be true:
1. Named jurisdiction
2. Named TRA event (`post_job`, `set_range`, `grant`, `vest`, `exercise`, `pay_bonus`, `classify`)
3. Effective date
4. Official source URL
5. ≤ 240 character plain-language summary

**This week’s seed:** CT HB 5003 is the only seeded item inside the next 90 days that is not already in force. VA (2026-07-01) and ME (2026-07-29) are already `in_force`.

**Do not do:** daily digests, auto-publish from LegiScan / Open States, city packs until a live customer geo needs them, a Governance tab.
