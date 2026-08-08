# Host Total Rewards Accelerator (optimal demo stack)

**Target architecture**

| Piece | Host | Plan | Why |
|-------|------|------|-----|
| **Web** (Next.js) | [Vercel](https://vercel.com) | Hobby (free) or Pro | CDN, fast first paint, custom domain |
| **API** (FastAPI) | [Render](https://render.com) | **Starter (paid)** | Always-on — no 30–60s cold start |

```
Browser  →  https://your-app.vercel.app  (Next.js)
                │  NEXT_PUBLIC_API_URL
                ▼
         https://tra-api-n0mh.onrender.com  (FastAPI · Starter)
```

Existing free `tra-web` on Render can stay until Vercel is live, then suspend it.

---

## 1. Upgrade API on Render (paid)

You already have **`tra-api`** (`https://tra-api-n0mh.onrender.com`).

1. [Render Dashboard](https://dashboard.render.com) → **tra-api**  
2. **Settings** → **Instance type / Plan** → **Starter** (not Free)  
3. Confirm auto-deploy from `main` is on  
4. Env vars (recommended after Vercel URL is known):

| Key | Value |
|-----|--------|
| `CORS_ORIGINS` | `https://YOUR-APP.vercel.app` (or `*` temporarily) |
| `CORS_ORIGIN_REGEX` | `https://.*\.vercel\.app` |
| `DEMO_PASSWORD` | leave **unset** for open public demo |

5. Smoke-test:

```bash
curl -sS https://tra-api-n0mh.onrender.com/health
```

Blueprint at repo root `render.yaml` describes the paid API-only layout for new environments.

---

## 2. Deploy web on Vercel

1. [vercel.com/new](https://vercel.com/new) → Import **mikelz15/total-rewards-accelerator**  
2. **Root Directory** = **`web`**  
3. Environment variables (Production):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_API_URL` | `https://tra-api-n0mh.onrender.com` |
| `DEMO_PASSWORD` | leave **unset** (open demo) |
| `NEXT_PUBLIC_API_DEMO_PASSWORD` | leave **unset** unless API is gated |

4. Deploy → copy production URL  
5. Optional: add custom domain under Project → Settings → Domains  

CLI alternative:

```bash
cd web
vercel login
vercel link   # root directory web
vercel env add NEXT_PUBLIC_API_URL production
vercel env add DEMO_PASSWORD production
vercel env add NEXT_PUBLIC_API_DEMO_PASSWORD production
vercel --prod
```

`NEXT_PUBLIC_*` is baked in at **build** time — redeploy after changing API URL or API password.

---

## 3. Lock CORS

Render → tra-api → Environment:

```text
CORS_ORIGINS=https://YOUR-APP.vercel.app
CORS_ORIGIN_REGEX=https://.*\.vercel\.app
```

---

## 4. Cutover checklist

- [ ] tra-api plan = **Starter**  
- [ ] Vercel production live with correct env  
- [ ] Login + Cleaner sample works from Vercel URL (private window)  
- [ ] Update `go-to-market/LIVE-DEMO-URLS.md` with Vercel URL  
- [ ] Suspend free **tra-web** on Render (optional cost/cleanup)  
- [ ] LinkedIn blurb uses short Vercel URL (open access)  

---

## Demo guardrails (API)

- Custom upload/paste: max **10 rows**, **5 / IP / week**, PHI **header** scan  
- Tracker / Closer: **sample data only**  
- Optional `DEMO_PASSWORD` gate is **off** for public demo  

---

## Local development

```bash
# API
cd api && PYTHONPATH=. python3 -m uvicorn app.main:app --reload --port 8000

# Web
cd web
echo 'NEXT_PUBLIC_API_URL=http://127.0.0.1:8000' > .env.local
npm run dev
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| CORS errors from Vercel | Set `CORS_ORIGINS` to exact HTTPS origin; redeploy API |
| 401 from API | Align `NEXT_PUBLIC_API_DEMO_PASSWORD` with API `DEMO_PASSWORD`; redeploy web |
| Slow first request | Confirm API plan is **Starter**, not Free |
| Wrong API on site | Redeploy Vercel after changing `NEXT_PUBLIC_API_URL` |
| Vercel 404 monorepo | Root Directory must be `web` |
