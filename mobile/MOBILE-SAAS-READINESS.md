# Mobile SaaS readiness

## Strategy (recommended)

Keep **two modes** on mobile — same product story as the website:

| Mode | Who | API | Data |
|------|-----|-----|------|
| **Demo** (default) | Store visitors / cold demos | Public `/api/*` | Sample data, row caps |
| **Workspace** | Paying customers | `/api/v1/*` + Supabase session | Org datasets, entitlements |

**Do not** force login on first launch. Store reviewers and prospects still need a working demo.

**Billing, team invites, platform admin** stay on the **web app** for now (deep link from Home). Mobile is optimized for module workflows in the field.

---

## What’s ready in code (v1.1.0 / versionCode 4)

- [x] Supabase auth (`lib/supabase.ts`, `lib/auth-context.tsx`, `/login`)
- [x] SaaS API client (`lib/saas-api.ts`) for `/api/v1`
- [x] Demo vs Workspace mode toggle on Home
- [x] Module entitlement locks (`ModuleLock` on Cleaner / Equity / Tracker / Closer)
- [x] Cleaner workspace upload → clean + save dataset
- [x] Secure session storage (`expo-secure-store`)
- [x] Points at production API + web workspace URL
- [ ] Full Equity/Tracker/Closer workspace data paths (still demo API when not wired)
- [ ] In-app Stripe / team UI (use web)

---

## Before next store build

1. Set **anon key** (never commit service_role):

```bash
# eas.json env or:
export EXPO_PUBLIC_SUPABASE_URL=https://iqcnuocamgtiniqjlnkh.supabase.co
export EXPO_PUBLIC_SUPABASE_ANON_KEY=your_publishable_or_anon_key
export EXPO_PUBLIC_API_URL=https://tra-api-starter.onrender.com
```

Or put anon key in `app.json` → `extra.supabaseAnonKey` for a private EAS secret profile only.

2. Bump version if needed (`1.1.0` / `versionCode` 4 already set for next ship).

3. Rebuild AAB:

```bash
cd mobile
eas build --platform android --profile production
```

4. Play Console: update listing notes for “Sign in for workspace · demo without account”.

---

## Thoughts on deploy timing

| Approach | When |
|----------|------|
| **Ship demo-first (current AAB path)** | Now — don’t wait for full SaaS mobile parity |
| **Ship 1.1 with auth + locks** | After anon key is in EAS secrets and QA on a device |
| **Full mobile SaaS parity** | After web billing/team stabilize; then wire Equity/Closer to `/api/v1` datasets |

**Opinion:** Keep Play listing as **free demo + optional account**. Force-login hurts conversion and review. Use Home mode switch so customers who bought licenses can flip to Workspace and use entitlements immediately.

iOS remains on hold until Android path is proven.
