# Android + Play Store shipping (iOS on hold)

## Production AAB (ready)

| Field | Value |
|--------|--------|
| **Version** | 1.0.0 |
| **versionCode** | **3** (use this one) |
| **Build page** | https://expo.dev/accounts/mikelz15/projects/total-rewards-accelerator/builds/88346866-0055-4561-85d8-690df90e02ba |
| **Download AAB** | https://expo.dev/artifacts/eas/cs3wg4AHyRnmeuIKC43iv2hprhU7A9ZWRt1ruGywAlg.aab |
| **Package** | `com.mikez.totalrewardsaccelerator` |
| **API** | `https://tra-api-starter.onrender.com` |

Older build (versionCode 2) also finished if needed.

---

## Play Console — create the listing (you, once)

1. Open [Google Play Console](https://play.google.com/console/)  
2. **Create app**  
   - App name: **Total Rewards Accelerator**  
   - Default language: English (US)  
   - App or game: App  
   - Free / Paid: Free (or as you prefer)  
3. Accept declarations  

### Required checklist in Console

| Section | What to enter |
|---------|----------------|
| **App content → Privacy policy** | https://totalrewardsaccelerator.com/privacy |
| **Store listing** | Copy from `store/listing-copy.md` |
| **Graphics** | Icon (512×512), feature graphic (1024×500), phone screenshots |
| **Category** | Business |
| **Data safety** | Declare data collected (files user uploads, optional push token); demo is sample-first |
| **Content rating** | Complete questionnaire (Business app) |
| **Target audience** | 18+ / business users |
| **Countries** | Start with US (or worldwide) |

### Upload the AAB

**Path A — Manual (fastest if no service account yet)**  
1. Play Console → **Release** → **Production** (or **Internal testing** first — recommended)  
2. **Create new release**  
3. Upload the AAB from the download link above  
4. Release name: `1.0.0 (3)`  
5. Release notes: e.g. “Initial public demo of Total Rewards Accelerator mobile.”  
6. **Review release** → **Start rollout to Internal testing** first, then Production when happy  

**Path B — EAS submit (after service account)**  
1. Play Console → Setup → API access → link Cloud project → create service account with **Release apps** permission  
2. Download JSON → save as:
   ```
   mobile/secrets/play-store-service-account.json
   ```
3. Run:
   ```bash
   cd ~/Desktop/Total_Rewards_Accelerator/mobile
   eas submit --profile production --platform android --latest --non-interactive
   ```

---

## Rebuild Android later

```bash
cd ~/Desktop/Total_Rewards_Accelerator/mobile
eas build --profile production --platform android --non-interactive
```

---

## iOS

**On hold** — do not run iOS build/submit until you’re ready.
