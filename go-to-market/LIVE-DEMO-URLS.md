# Live demo URLs — Total Rewards Accelerator

**Stack:** Vercel (web) + Render **Starter** API (always-on)  
**Updated:** 2026-08-07

## Primary (share this)

| Service | Public URL | Status |
|---------|------------|--------|
| **Web app (share this)** | **https://trytra.vercel.app** | **live · streamlined** |
| **API (Starter / paid)** | https://tra-api-starter.onrender.com | **live · always-on** |
| Health | https://tra-api-starter.onrender.com/health | — |
| API docs | https://tra-api-starter.onrender.com/docs | — |

### Also works
| URL | Notes |
|-----|--------|
| https://mikez-tra.vercel.app | Redirects → trytra |
| https://total-rewards-accelerator.vercel.app | Redirects → trytra |
| https://totalrewardsaccelerator.com | Custom domain — **DNS not pointed yet** (see below) |

## Access

| Item | Value |
|------|--------|
| **Demo password** | `TRA-pilot-2026` |
| Share password | **DM only** — do not put in public LinkedIn body |

Web env (Vercel production):

- `DEMO_PASSWORD` / `NEXT_PUBLIC_API_DEMO_PASSWORD`
- `NEXT_PUBLIC_API_URL=https://tra-api-starter.onrender.com`

## Demo path

1. **Cleaner** → Load messy HRIS sample  
2. **Equity + Merit** → Run equity + flight risk → merit  
3. **Candidate Tracker** → sample pipeline → Open in Closer  
4. **Closer** → four-year total wealth / PDF  
5. **Pricing**  

## Custom domain DNS (totalrewardsaccelerator.com)

Domain is attached to the Vercel project but **registrar DNS is not pointed yet**.

At your domain registrar (where you bought the domain), set:

| Type | Name | Value |
|------|------|--------|
| **A** | `@` | `216.198.79.1` |
| **A** | `@` | `64.29.17.1` |
| **CNAME** | `www` | `6fdad7c1761fc03c.vercel-dns-017.com` |

(If the registrar only allows one apex A record, use Vercel’s alternate: `76.76.21.21`.)

After DNS propagates (often 5–60 min), share:

**https://totalrewardsaccelerator.com**

`www` is configured to redirect to the apex.

## Important

- Prefer **https://trytra.vercel.app** until the .com DNS is live.  
- API is **Starter** (~$7/mo) so cold opens stay fast.  
- **Sample data only** — do not upload real employee files.  
- Repo: [mikelz15/total-rewards-accelerator](https://github.com/mikelz15/total-rewards-accelerator)

## LinkedIn / DM blurb

> Try Total Rewards Accelerator (YOE + education placement):  
> https://trytra.vercel.app  
> Sample data demo. DM **PILOT** for password + guided walkthrough + SOW.
