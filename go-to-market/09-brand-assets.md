# Brand assets — Total Rewards Accelerator

## Logo

| File | Use |
|------|-----|
| `web/public/brand/tra-logo.png` | Full lockup (primary) |
| `web/public/brand/tra-logo-800.png` | Web / medium |
| `web/public/brand/tra-logo-256.png` | Thumbnails |
| `web/public/brand/tra-logo-sow.png` | SOW / print header |
| `web/public/brand/tra-logo.svg` | SVG wrapper (embedded PNG) — swap for true vector when available |
| `web/src/app/icon.png` | Favicon |

## LinkedIn

| File | Spec |
|------|------|
| `go-to-market/linkedin-banner-tra.png` | **1584 × 396** company/profile banner |
| Upload | LinkedIn → Me → View profile → Edit public profile & URL / background photo, or Company page banner |

**Suggested LinkedIn profile headline:**  
`Building Total Rewards Accelerator | Comp Engineering | Design partners open | Denver`

## Product

- Nav, login, home: `BrandLogo` component  
- Demo: https://tra-web.onrender.com  

## SOW

- Header logo via `create-sow.js` → `TRA-Design-Partner-Pilot-SOW.docx`  
- Regenerate: `cd go-to-market && node create-sow.js`

## Colors (from logo)

| Token | Hex | Role |
|-------|-----|------|
| Teal | `#0F6B6D` | Primary brand |
| Deep teal | `#0A4F52` | Text accent |
| Gold | `#D4A017` | Highlight / CTA spark |
| Slate | `#0F172A` | Body text |

## Optional next (when you re-export from design tool)

1. True **SVG vector** (not PNG-in-SVG)  
2. **Icon-only mark** for 32×32 favicon  
3. **White lockup** for dark slides  
4. Fix wordmark **REWARDS** (plural)  
