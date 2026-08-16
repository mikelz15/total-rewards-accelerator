# Ship Total Rewards Accelerator to App Store + Play Store

## Status checklist

| Step | Status |
|------|--------|
| Expo / EAS project config (`eas.json`, bundle IDs) | Ready in repo |
| Privacy policy page | `/privacy` on web → https://totalrewardsaccelerator.com/privacy |
| Store listing copy | `store/listing-copy.md` |
| EAS login | **You must complete** |
| Apple Developer Program ($99/yr) | **You must have** |
| Google Play Console (~$25 one-time) | **You must have** |
| Production EAS builds | After login |
| Store submit | After builds + listings |

---

## 1. Expo account (required)

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
cd ~/Desktop/Total_Rewards_Accelerator/mobile
eas login
eas whoami
eas init --id   # or: eas init  (creates project, writes projectId into app.json)
```

Confirm `app.json` → `extra.eas.projectId` is a real UUID (not `replace-with-eas-project-id`).

---

## 2. Accounts you need

### Apple (App Store)
1. Enroll: https://developer.apple.com/programs/  
2. App Store Connect → create app  
   - Name: **Total Rewards Accelerator**  
   - Bundle ID: `com.mikez.totalrewardsaccelerator`  
3. Note: **Apple ID**, **Team ID**, **App Store Connect App ID** (numeric)  
4. Put them in `eas.json` → `submit.production.ios`

### Google (Play Store)
1. Enroll: https://play.google.com/console/  
2. Create app → package `com.mikez.totalrewardsaccelerator`  
3. Create a **service account** with Play Developer API access  
4. Download JSON key → `mobile/secrets/play-store-service-account.json`  
   (folder is gitignored — do not commit)  
5. Complete Play Console **Data safety**, content rating, privacy policy URL

Privacy policy URL for both stores:

**https://totalrewardsaccelerator.com/privacy**

---

## 3. Build production binaries

```bash
cd ~/Desktop/Total_Rewards_Accelerator/mobile

# iOS (App Store IPA)
eas build --profile production --platform ios --non-interactive

# Android (Play AAB)
eas build --profile production --platform android --non-interactive

# Or both
eas build --profile production --platform all --non-interactive
```

First iOS build will prompt EAS to manage certificates/profiles (recommended: let EAS handle it).

---

## 4. Submit

```bash
# After builds finish (check: eas build:list)
eas submit --profile production --platform ios --latest
eas submit --profile production --platform android --latest
```

Or attach a specific build ID:

```bash
eas submit --platform ios --id <BUILD_ID>
eas submit --platform android --id <BUILD_ID>
```

---

## 5. Store listing (paste from `store/listing-copy.md`)

- Short + full description  
- Screenshots (phone + optional tablet)  
- Category: Business / Productivity  
- Privacy policy URL  
- Support URL: https://totalrewardsaccelerator.com  

### Reviewer notes
- No login on public demo  
- Use Cleaner → “Load messy HRIS sample”  
- Sample data only  

---

## 6. Deploy privacy page (if not live yet)

Privacy route is in the web app at `/privacy`. Redeploy web to Vercel so:

https://totalrewardsaccelerator.com/privacy

is public before store review.

```bash
cd ~/Desktop/Total_Rewards_Accelerator
git add -A && git commit -m "Add privacy policy and store build assets" && git push
# Vercel auto-deploys if linked
```

---

## Commands cheat sheet

| Goal | Command |
|------|---------|
| Login | `eas login` |
| Init project | `eas init` |
| iOS production build | `eas build -p ios --profile production` |
| Android production build | `eas build -p android --profile production` |
| Submit iOS | `eas submit -p ios --latest` |
| Submit Android | `eas submit -p android --latest` |
| Build status | `eas build:list` |

---

## What Grok can / cannot do alone

| Can do | Needs you |
|--------|-----------|
| Config, listing copy, privacy page | Expo login in browser |
| Start builds once logged in | Apple Developer membership |
| Wire EAS submit config | Google Play Console + service account |
| Push code to GitHub/Vercel | App screenshots, store forms, review answers |
