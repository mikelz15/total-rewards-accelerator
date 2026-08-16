# Production SaaS cutover checklist

## Live URLs

| Surface | URL |
|---------|-----|
| Public demo + marketing | https://totalrewardsaccelerator.com |
| Signup | https://totalrewardsaccelerator.com/signup |
| Login | https://totalrewardsaccelerator.com/login |
| Workspace | https://totalrewardsaccelerator.com/app |
| API health | https://tra-api-starter.onrender.com/health |

## Render API env (required for SaaS)

GitHub auto-deployed API **v0.5.0**. Until these are set, health shows `"saas": { "enabled": false }`.

Dashboard → **tra-api-starter** (or your Starter API service) → **Environment**:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Same Postgres URI as local (password URL-encoded) |
| `SUPABASE_URL` | `https://iqcnuocamgtiniqjlnkh.supabase.co` |
| `SUPABASE_ANON_KEY` | Publishable / anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional; admin only |
| `CORS_ORIGINS` | `https://totalrewardsaccelerator.com,https://www.totalrewardsaccelerator.com` |
| `CORS_ORIGIN_REGEX` | `https://.*\.vercel\.app` |

Then **Manual Deploy** → clear build cache optional → Deploy.

Confirm:

```bash
curl -s https://tra-api-starter.onrender.com/health | python3 -m json.tool
# "version": "0.5.0"
# "saas": { "enabled": true, ... }
```

## Supabase Auth URLs (production)

Authentication → URL Configuration:

- **Site URL:** `https://totalrewardsaccelerator.com`
- **Redirect URLs:**
  - `https://totalrewardsaccelerator.com/auth/callback`
  - `https://totalrewardsaccelerator.com/auth/reset-password`
  - `https://totalrewardsaccelerator.com/**`
  - `http://localhost:3000/auth/callback` (keep for local)
  - `http://localhost:3000/**`

## Vercel web env

Production project **total-rewards-accelerator** needs:

- `NEXT_PUBLIC_API_URL=https://tra-api-starter.onrender.com`
- `NEXT_PUBLIC_SUPABASE_URL=…`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=…`
- `NEXT_PUBLIC_SITE_URL=https://totalrewardsaccelerator.com`

Redeploy after changing `NEXT_PUBLIC_*` (baked at build time).
