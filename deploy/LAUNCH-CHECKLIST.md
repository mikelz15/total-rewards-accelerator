# Launch checklist — host demo → commercial loop

Work top-down. Check off as you go.

## A. GitHub (required for Render Blueprint)

```bash
cd ~/Desktop/Total_Rewards_Accelerator
export PATH="$HOME/.local/bin:$HOME/.local/node/bin:$PATH"

# One-time
gh auth login -h github.com -p https -w

# Create private repo + push
gh repo create total-rewards-accelerator --private --source=. --remote=origin --push
```

If the repo already exists on GitHub:

```bash
git remote add origin https://github.com/YOUR_USER/total-rewards-accelerator.git
git push -u origin main
```

---

## B. Hosted API (Render)

1. [render.com](https://render.com) → New → Blueprint → connect the GitHub repo  
2. Select `deploy/render.yaml`  
3. Deploy **tra-api** first  
4. Copy public URL, e.g. `https://tra-api-xxxx.onrender.com`  
5. Confirm: `curl https://tra-api-xxxx.onrender.com/health`  
6. Env on **tra-api** (optional but recommended for pilots):
   - `CORS_ORIGINS=*` (or your Vercel URL once known)
   - `DEMO_PASSWORD=` leave empty until web password is decided

**Free tier note:** service sleeps when idle; first request can take ~30–60s.

Manual API (no Blueprint):
- Root directory: `api`
- Build: `pip install -r requirements.txt`
- Start: `PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health path: `/health`

---

## C. Hosted Web (Vercel)

```bash
cd ~/Desktop/Total_Rewards_Accelerator/web
export PATH="$HOME/.local/node/bin:$PATH"

npx vercel login
npx vercel link   # root directory: web (if monorepo UI asks)
npx vercel --prod \
  --env NEXT_PUBLIC_API_URL=https://tra-api-xxxx.onrender.com
```

Or Vercel Dashboard:
1. Import GitHub repo  
2. **Root Directory = `web`**  
3. Env:
   - `NEXT_PUBLIC_API_URL` = Render API origin (no trailing slash)
   - `DEMO_PASSWORD` = shared pilot password (recommended)
4. Deploy  

Then on **Render API**, set `CORS_ORIGINS` to the Vercel URL (or `*`).

Optional API password (stricter):
- Render: `DEMO_PASSWORD=same-secret`
- Vercel: `NEXT_PUBLIC_API_DEMO_PASSWORD=same-secret` + rebuild

---

## D. Verify public demo path

| Step | Expected |
|------|----------|
| Open web URL | Home loads |
| Login (if DEMO_PASSWORD set) | Cookie unlocks app |
| Cleaner → Load messy HRIS sample | Quality score, placement stats |
| Equity + Merit → Run audit | Heatmap + underpaid + flight risk |
| Fix parity | Allocation table |
| Export pack | CSVs download |
| Closer → Project + PDF | Wealth chart + PDF |

Paste final URLs into `go-to-market/LIVE-DEMO-URLS.md`.

---

## E. Commercial loop (same week)

| # | Action | Artifact |
|---|--------|----------|
| 1 | Record Loom Version A (~90s) | `go-to-market/04-loom-script.md` |
| 2 | Publish LinkedIn primary post | `go-to-market/01-linkedin-post.md` |
| 3 | First comment under post: demo URL + Loom | — |
| 4 | Calendly (or booking) link ready | your calendar tool |
| 5 | Invoice method (Stripe / Wave / QB) | — |
| 6 | Send SOW when someone says PILOT | `go-to-market/TRA-Design-Partner-Pilot-SOW.pdf` |

**Suggested demo password (change if you prefer):** `TRA-pilot-2026`  
Share only via DM, not in the public LinkedIn body.

---

## F. After first DEMO reply

- Calendar: 15–20 min screen share (Tier A free demo)
- Use scrubbed data or sample only
- If fit: quote Tier B pilot ($3k–$6.5k) + attach SOW PDF
