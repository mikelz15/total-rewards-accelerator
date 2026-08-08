# Minimum features to charge with confidence

**Principle:** You can charge for **pilots + your expertise** before full SaaS.  
You should **not** charge pure self-serve software until the “chargeable core” below is solid.

---

## Two bars of “ready”

| Bar | What you sell | How ready you are **today** |
|-----|----------------|------------------------------|
| **Bar A — Paid pilot / workshop** | Access + you | **Ready now** (with hosted demo discipline) |
| **Bar B — Pure SaaS subscription** | Login and go | **Not yet** — need hosting, accounts, data isolation |

Most of your near-term revenue should be **Bar A**.

---

## Bar A — Charge for pilots NOW (checklist)

### Product (must work every demo)
- [x] Cleaner handles messy sample + common HRIS headers  
- [x] Equity audit: compa, underpaid, heatmap, top targets  
- [x] Flight risk scores with readable drivers  
- [x] Merit pool remediation with allocation table  
- [x] Candidate tracker (basic)  
- [x] Candidate closer + PDF  
- [x] **Hosted demo URL** (not “my laptop localhost”) — https://totalrewardsaccelerator.com  
- [x] **One-click demo dataset** always works  
- [x] **Reset demo** button / fresh sample path  

### Operating (must be true before you invoice)
- [ ] Calendly (or booking) link  
- [ ] Invoice method (Stripe / QuickBooks / Wave)  
- [ ] Pilot SOW PDF (even 2 pages)  
- [ ] Data rules: scrubbed files only by default  
- [ ] Secure file intake (not personal email as permanent store)  
  - Examples: Google shared drive folder, Dropbox request, SharePoint  
- [ ] Loom backup if live demo fails  

### Credibility
- [ ] 45–90s product Loom  
- [ ] LinkedIn post live  
- [ ] One-pager PDF: problem → modules → pilot → price  
- [ ] 2–3 “proof points” from your career (already in portfolio):  
  - Merit 40h → 8h  
  - Equity / architecture scale  
  - Healthcare domain  

**If Bar A is green → charge $3k–$6.5k pilots with integrity.**

---

## Bar B — Charge pure SaaS later (minimum)

Do **not** sell unlimited monthly software until most of this exists:

### Security & tenancy
- [ ] User accounts (auth)  
- [ ] Org / tenant isolation (Customer A never sees Customer B)  
- [ ] HTTPS production host  
- [ ] Encryption in transit; access logs  
- [ ] Written privacy / data processing summary  
- [ ] Admin ability to delete customer data  

### Product reliability
- [ ] Upload size limits + clear errors  
- [ ] Job runs don’t die silently  
- [ ] Export: cleaned CSV + allocation CSV + PDF  
- [ ] Audit trail: “who ran what when” (light version OK)  
- [ ] Version label in UI (v0.3…)  

### Commercial
- [ ] Pricing page or quote template  
- [ ] Stripe (or similar) subscription  
- [ ] Terms of service + acceptable use  
- [ ] Support channel (email SLA, even if “48 business hours”)  

### Nice-to-have before enterprise
- [ ] SSO  
- [ ] SOC 2 story / security questionnaire packet  
- [ ] VPC / private deploy  
- [ ] Role-based access (Comp vs TA vs HRBP)

---

## Feature priority to maximize willingness-to-pay

### P0 — Already strong / keep polished
1. Cleaner reliability on real exports  
2. Equity gap $ + top underpaid  
3. Merit pool allocation people can defend to leadership  
4. PDF total wealth for offers  

### P1 — Build next (highest monetization lift)
| Feature | Why it unlocks money |
|---------|----------------------|
| **Hosted multi-user demo + simple login** | You can leave access after a call |
| **Export pack** (cleaned CSV, audit CSV, merit allocations — PDF on Closer) | Clients keep artifacts → perceived value |
| **Scenario compare** (Pool $200k vs $350k) | Finance conversations = budget |
| **Saved client workspace** | Sticky; retainer-friendly |
| **Column mapping UI** (confirm/edit aliases) | “Works on *our* file” objection dies |
| **Anonymize on upload** toggle | Speeds security comfort |

### P2 — After 2–3 paid pilots
| Feature | Why |
|---------|-----|
| Role-based modules (TA only sees Closer/Tracker) | Expand seats |
| Survey match / market pricing module | Higher ACV |
| True ML flight risk (with model card) | Differentiation — only with data |
| Slack/Teams alert: “12 critical flight risks” | Daily utility |
| HRIS connector (Workday report) | Enterprise wedge |

### P3 — Don’t build yet
- Mobile app  
- Full payroll write-back  
- Global multi-currency everywhere  
- Community marketplace  

---

## “Can I charge?” decision tree

```
Do they need YOU in the loop?
├─ Yes → Sell Pilot / Workshop / Retainer (Bar A) ✅
└─ No → Do they only want self-serve login?
         ├─ Yes → Finish Bar B first ⛔
         └─ They want results this cycle
                  → Sell Pilot with you running the tool ✅
```

---

## Demo script quality bar (15 minutes)

If you can do this cold, every time, you’re commercially ready for Bar A:

| Min | Step | Prove |
|-----|------|--------|
| 0–2 | Pain mirror | “90% cleaning, 10% advising” |
| 2–5 | Cleaner | Messy sample → mapped columns → quality score |
| 5–8 | Auditor | Heatmap + $ gap to parity |
| 8–11 | Flight risk | Top 3 names + drivers |
| 11–13 | Merit pool | Set $250k → allocate → who gets funded |
| 13–15 | Closer | PDF download | CTA: pilot |

---

## Definition of done for first invoice

You may send the first pilot invoice when:

1. Hosted demo works without your laptop in “dev mode” theater  
2. SOW + price agreed in writing  
3. Data handling rules accepted  
4. Kickoff on calendar  
5. 50% deposit received (recommended)

---

## Suggested build order (next product sprints)

### Sprint 1 (before first paid pilot) — ~1 week focus
1. Deploy web + API to a host (Railway / Render / Fly / Vercel+API)  
2. Password-protected demo or basic auth  
3. Export buttons (CSV + PDF bundle)  
4. One-pager + SOW PDF  

### Sprint 2 (during first pilots)
1. Column mapping confirmation UI  
2. Merit scenario A/B compare  
3. Client workspace save  
4. Anonymize toggle  

### Sprint 3 (toward SaaS)
1. Real auth + tenants  
2. Billing  
3. Usage limits  

---

## Honest status vs this checklist (as of v0.2.0)

| Area | Status |
|------|--------|
| Core modules | Strong MVP |
| Real HRIS cleaner | Good foundation |
| Flight risk | Rules OK for pilots; label as such |
| Merit remediation | Demo-ready |
| Tracker / Closer | Demo-ready |
| Hosting / auth / tenancy | **Gap for SaaS; fine for guided pilots if hosted** |
| Legal/commercial pack | Use GTM docs in this folder |

**Bottom line:**  
Charge **design-partner pilots now**.  
Charge **self-serve SaaS after Sprint 1–3.**  
Don’t wait for perfect ML or Workday API to earn your first dollar.
