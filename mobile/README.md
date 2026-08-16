# Total Rewards Accelerator — Mobile

Expo (React Native) client for the Comp Engineering toolkit.

**Tagline:** Stop crunching rows. Start designing strategy.

## Modules

| Tab | Screen | API |
|-----|--------|-----|
| Home | Hero, module grid, API health | `GET /health` |
| Cleaner | Load messy HRIS sample, stats | `GET /api/cleaner/sample` |
| Equity | Equity audit + merit remediation | `POST /api/auditor/run`, `/api/remediation/run` |
| Tracker | Sample candidate pipeline | `GET /api/candidates` |
| Closer | 4-year total wealth projection | `POST /api/closer/project` |

## Stack

- Expo SDK 57 + Expo Router (tabs)
- TypeScript
- Same FastAPI backend as the web app

## Setup

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
cd ~/Desktop/Total_Rewards_Accelerator/mobile
npm install
```

### API URL

Default production API:

`https://tra-api-starter.onrender.com`

Override for local API:

```bash
# iOS simulator can use localhost
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000 npx expo start

# Android emulator often needs 10.0.2.2
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000 npx expo start

# Physical device: use your machine LAN IP
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000 npx expo start
```

## Run

```bash
npx expo start
```

Then:

- Press `i` for iOS simulator  
- Press `a` for Android emulator  
- Scan QR with Expo Go on a phone  
- Press `w` for web  

From monorepo root (if wired):

```bash
npm run dev:mobile
```

## Demo path (mobile)

1. **Cleaner** → Load messy HRIS sample  
2. **Equity** → Run equity + flight risk → Fund merit  
3. **Tracker** → Open a candidate in Closer  
4. **Closer** → Project total wealth  

## Ladder features (v1+)

| Feature | Where |
|---------|--------|
| **CSV / TSV upload** | Cleaner → Upload CSV / TSV (document picker) |
| **Charts** | Equity (equity mix + flight risk) · Closer (year totals + cumulative) |
| **Pilot notifications** | Home → Enable push + Test local reminder (5s) |
| **Store builds** | `eas.json` + [STORE-BUILD.md](./STORE-BUILD.md) |

```bash
# Store builds (after eas login + projectId)
npm i -g eas-cli
eas build --profile preview --platform all
```

## Notes

- Cleaned data is stored on-device via AsyncStorage for Equity handoff.  
- Public API demo guardrails still apply (sample-first, row caps, etc.).  
- Brand colors match the web app (slate + teal).  
- Remote Expo push needs a real EAS `projectId` in `app.json`.
