# Licensing, permissions & system admin console

## What is the system admin console?

**System admin console** = **Mikéz / platform operator** tools at **`/app/admin`**.

It is **not** the customer’s Team page.

| | **Customer admin** (`/app/team`, `/app/billing`) | **System admin** (`/app/admin`) |
|--|--|--|
| Who | Comp/HR leader at the buying company | You (platform owner) |
| Scope | Their organization only | All organizations |
| Controls | Invites, roles, their Stripe billing | Grant pilot/suite, suspend orgs, row limits |
| Access | Org role `owner` / `admin` | Email listed in `SYSTEM_ADMIN_EMAILS` |

Default system admin email: `mikez.lopez15@gmail.com`  
Override on API: `SYSTEM_ADMIN_EMAILS=you@x.com,ops@x.com`

---

## Build order (implemented)

1. **Entitlements** — plan + optional `entitlements_json`; module gates on API + UI  
2. **Stripe** — checkout / portal / webhook (needs Stripe env keys)  
3. **Team** — invite, role change, remove  
4. **Role × module matrix** — owner/admin/member/ta/viewer  
5. **Platform admin** — list orgs, set plan, suspend, grant suite  

### SQL

Run if not already applied:

- `api/app/db/migrations/002_entitlements_team.sql` (applied to current Supabase DB from local)

### Stripe env (optional until you go live with cards)

```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_CLEANER=
STRIPE_PRICE_EQUITY=
STRIPE_PRICE_TRACKER=
STRIPE_PRICE_CLOSER=
STRIPE_PRICE_SUITE=
PUBLIC_WEB_URL=https://totalrewardsaccelerator.com
SYSTEM_ADMIN_EMAILS=mikez.lopez15@gmail.com
```

Without Stripe, **trial/pilot** plans still unlock all modules; system admin can **Grant suite** or set plan to a module SKU (`cleaner`, `equity`, …).

### Plans (commercial)

| Plan | Modules |
|------|---------|
| `trial` / `pilot` / `starter` / `suite` | All modules, including Cycle Lock (gated with equity) |
| `cleaner` / `equity` / `tracker` / `closer` | That module only. `equity` includes Cycle Lock. |
| `ta_pack` | Tracker + Closer |
| `none` | None |

### Roles (customer-controlled)

| Role | Modules (within plan) | Write | Team | Billing |
|------|----------------------|-------|------|---------|
| owner | all entitled | yes | yes | yes |
| admin | all entitled | yes | yes | no |
| member | all entitled | yes | no | no |
| ta | tracker + closer | yes | no | no |
| viewer | all entitled | **no** | no | no |

---

## Customer paths

- **Team:** `/app/team`  
- **Billing:** `/app/billing`  
- **Admin (you):** `/app/admin`  

Nav shows 🔒 on locked modules.

## Row-level security

Migration `api/app/db/migrations/003_rls.sql` enables and forces RLS on every client table.

Tenant API sessions call `bind_rls` and `SET LOCAL ROLE tra_app`. That role cannot bypass RLS. A row is visible only when `org_id` matches the signed-in org, or the caller is that row's user (membership lookup).

- System admin routes set `platform_admin` only after the email allow-list check.
- The Stripe webhook sets `platform_admin` only after the Stripe signature checks out.
- Until `003_rls.sql` is applied in Supabase, `bind_rls` does nothing and behavior stays as it is today.

Apply the file in the Supabase SQL editor. Do not skip it once this API revision is deployed if you want the lock to be real.
