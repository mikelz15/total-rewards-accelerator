# Cycle Lock — public teardown board

Shipped 2026-09-30.

- Demo: `/cycle`
- Workspace: `/app/cycle` (gated on equity module)
- API: `GET /api/cycle-lock/sample`, `POST /api/cycle-lock/run`

Philosophy: range penetration spends the pool. Ratings do not. Exceptions require a confirm-chip.

## Packaging
Cycle Lock is module 03 on the site and is included with Equity + Merit and the full suite. It is not a separate Stripe price.
