# Hosting Total Rewards Accelerator

## Recommended production split

| Service | Host | Notes |
|---------|------|--------|
| **API** | Render / Railway / Fly | Python FastAPI (`deploy/Dockerfile.api` or `api/` root) |
| **Web** | Vercel (preferred) or Render | Next.js 14 (`web/`) |

Set `NEXT_PUBLIC_API_URL` on the web service to the **public API origin** (no trailing slash).

Optional password gate:
- Web: `DEMO_PASSWORD` → login page via middleware
- API: `DEMO_PASSWORD` → requires `X-Demo-Password` header
- Web also needs `NEXT_PUBLIC_API_DEMO_PASSWORD` if API password is set

---

## Option A — Local + Cloudflare quick tunnels (temporary)

Requires local API (8000) + Next.js (3000) + `cloudflared`.

```bash
# Terminal 1 — API
cd api && PYTHONPATH=. python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# Terminal 2 — Web
export PATH="$HOME/.local/node/bin:$PATH"   # if using local Node install
cd web
echo 'NEXT_PUBLIC_API_URL=http://127.0.0.1:8000' > .env.local
npm run dev

# Terminal 3/4 — tunnels (share web URL)
cloudflared tunnel --url http://127.0.0.1:8000
cloudflared tunnel --url http://localhost:3000
# Point web NEXT_PUBLIC_API_URL at the API tunnel for remote browsers
```

Tunnels change each restart. Sample data only.

---

## Option B — Render Blueprint

1. Push this folder to a GitHub repo (root = `Total_Rewards_Accelerator`).
2. Render → **New** → **Blueprint** → select `deploy/render.yaml`.
3. After `tra-api` is live, set on `tra-web`:
   - `NEXT_PUBLIC_API_URL=https://tra-api-xxxx.onrender.com`
4. On `tra-api` set `CORS_ORIGINS` to the web URL (or `*` for early demos).
5. Optionally set the same `DEMO_PASSWORD` on both; if API is gated, also set
   `NEXT_PUBLIC_API_DEMO_PASSWORD` on web.

Free tier spins down after idle — first request may be slow.

---

## Option C — Vercel (web) + Render (API)

### API (Render)
- Root directory: `api`
- Build: `pip install -r requirements.txt`
- Start: `PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health: `/health`

### Web (Vercel)
```bash
cd web
npx vercel
# Production env:
#   NEXT_PUBLIC_API_URL=https://your-api.onrender.com
#   DEMO_PASSWORD=...   (optional)
```

Or connect the monorepo in Vercel UI with **Root Directory = `web`**.

---

## Docker (API)

```bash
# from repo root
docker build -f deploy/Dockerfile.api -t tra-api .
docker run -p 8000:8000 -e CORS_ORIGINS=* tra-api
```

---

## Security note

Demo hosting is for **sample data** and design-partner demos.  
Do not upload real unscrubbed employee files to a public demo.
