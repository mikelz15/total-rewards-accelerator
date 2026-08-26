# Stripe setup for TRA

## What the app already does

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/billing/catalog` | Products + whether checkout is ready |
| `GET /api/v1/billing/status` | Org plan + subscription |
| `POST /api/v1/billing/checkout` | Stripe Checkout (subscription) |
| `POST /api/v1/billing/portal` | Customer billing portal |
| `POST /api/v1/billing/webhook` | Activate/cancel plans after payment |

UI: https://totalrewardsaccelerator.com/app/billing (org **owner** only)

---

## One-time setup (you)

### 1. Stripe account
1. [dashboard.stripe.com](https://dashboard.stripe.com)  
2. Start in **Test mode** (toggle) until a test purchase works  
3. Developers → **API keys** → copy **Secret key** `sk_test_…`

### 2. Create products + prices
```bash
cd ~/Desktop/Total_Rewards_Accelerator
python3 -m pip install stripe
export STRIPE_SECRET_KEY='sk_test_...'   # paste your key
python3 scripts/setup-stripe-products.py
```

Creates monthly prices (USD):

| Product | Default price |
|---------|----------------|
| Cleaner | $129/mo |
| Equity + Merit | $249/mo |
| Tracker | $129/mo |
| Closer | $199/mo |
| Full suite | $499/mo |

Writes:
- `api/.env.stripe` (gitignored)
- `Desktop/TRA_Stripe_Setup/stripe-env-for-render.txt`

### 3. Webhook
1. Stripe → Developers → **Webhooks** → Add endpoint  
2. URL:
   ```text
   https://tra-api-starter.onrender.com/api/v1/billing/webhook
   ```
3. Events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.paused`
4. Copy **Signing secret** `whsec_…` → set `STRIPE_WEBHOOK_SECRET`

### 4. Render env (`tra-api-starter`)
Add (from the generated file):

```text
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_CLEANER=price_...
STRIPE_PRICE_EQUITY=price_...
STRIPE_PRICE_TRACKER=price_...
STRIPE_PRICE_CLOSER=price_...
STRIPE_PRICE_SUITE=price_...
PUBLIC_WEB_URL=https://totalrewardsaccelerator.com
```

**Manual Deploy** after save.

### 5. Verify
```bash
curl -s https://tra-api-starter.onrender.com/health | python3 -m json.tool
# stripe.configured: true
# stripe.prices.*: true
```

Then: sign in as **org owner** → `/app/billing` → **Start free trial** (test card `4242 4242 4242 4242` in Test mode).

### Launch promo — first 30 days free
Checkout passes `trial_period_days` from env (default **30**):

```text
STRIPE_TRIAL_DAYS=30
```

- Card is collected at Checkout; **$0** until the trial ends, then the plan price bills monthly.  
- Set `STRIPE_TRIAL_DAYS=0` to turn the promo off.  
- Catalog/billing UI show “First N days free” when enabled.

### 6. Go live
1. Stripe toggle **Live mode**  
2. Re-run script with `sk_live_…`  
3. New live webhook + live price IDs on Render  
4. Activate payments / business details in Stripe  


---

## Customer portal
After first successful checkout, **Manage payment method** uses Stripe Customer Portal.  
Enable in Stripe → Settings → **Billing** → Customer portal (allow cancel / update payment method).
