# System change protocol

Use this whenever a TRA change alters what the product *is*: a module, a route, a price, a gate, a promo, or a public sentence about how many modules exist.

A code fix that does not change the product story does not need this checklist.

## Rule

One change, every surface, one commit series. Do not ship the feature and leave the old count on the homepage, pricing page, mobile home, or README.

## Canonical story (update this section first)

| # | Module | Public route | Workspace route | Stripe / plan |
|---|--------|--------------|-----------------|---------------|
| 01 | Market Data Cleaner | `/cleaner` | `/app/cleaner` | `cleaner` |
| 02 | Equity + Merit | `/auditor` | `/app/equity` | `equity` |
| 03 | Cycle Lock | `/cycle` | `/app/cycle` | Included with `equity` and `suite`. Not its own price. |
| 04 | Candidate Tracker | `/candidates` | `/app/candidates` | `tracker` |
| 05 | Candidate Closer | `/closer` | `/app/closer` | `closer` |

Suite (`suite`, trial, pilot, starter) unlocks every module. Cycle Lock uses the equity gate.

## Checklist

Walk this list in order. Skip a row only if you write why in the commit message.

1. **This file** — canonical table matches the decision.
2. **README.md** — module table matches.
3. **Marketing home** — `web/src/app/page.tsx` hero, workflow rail, and module cards. No "four modules" if five surfaces render. No `02b`.
4. **Pricing** — `web/src/app/pricing/page.tsx`. Say what is included. Do not invent a new price unless Stripe changes too.
5. **Module eyebrows** — `web/src/app/{cleaner,auditor,cycle,candidates,closer}/page.tsx` and `web/src/app/app/cycle/page.tsx`.
6. **Nav** — `web/src/components/Nav.tsx` and `web/src/components/AppNav.tsx`.
7. **Workspace home** — `web/src/app/app/page.tsx` numbering and suggested path.
8. **Entitlements copy** — `docs/ADMIN-AND-LICENSING.md`. Code gates stay in the API; do not add a Stripe SKU for an included surface.
9. **Stripe descriptions** — `scripts/setup-stripe-products.py`. Existing live Prices are not recreated by a copy edit. Update Dashboard descriptions only if the live product text is customer-visible and wrong.
10. **Mobile** — `mobile/app/(tabs)/index.tsx` and the module eyebrows. Do not link a route that does not exist. If mobile has no Cycle Lock screen, say it is included with Equity.
11. **GTM** — `go-to-market/11-cycle-lock.md` or the note for the feature you just shipped. Do not rewrite old Loom scripts unless they are about to be recorded again.
12. **Legal** — touch `/terms` or `/privacy` only if the promise to the customer changed (trial, data use, what the connector can write).

## Pricing decisions

- Included surface: name it on the parent module and the suite. Do not add a card with a new dollar amount.
- New paid module: add the Stripe product, the plan key, the gate, and the price on `/pricing` in the same change.
- Design-partner pilot prices live in `go-to-market/02-pilot-pricing-and-agreement.md`. They are not the SaaS list price.

## Done when

- A search of the repo for the old module count and for `02b` returns no customer-facing copy.
- Homepage, pricing, workspace, and README tell the same commercial story.
- The commit message names the decision (included vs new SKU), not only the files.
