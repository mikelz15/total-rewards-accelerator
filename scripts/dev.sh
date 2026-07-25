#!/usr/bin/env bash
# Local demo: API :8000 + Web :3000
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="${HOME}/.local/node/bin:${HOME}/Library/Python/3.9/bin:${PATH}"

if ! command -v node >/dev/null 2>&1; then
  echo "Node not found. Install Node 20+ or extract to ~/.local/node"
  exit 1
fi

echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000" > "$ROOT/web/.env.local"

echo "Starting API on http://127.0.0.1:8000 …"
(cd "$ROOT/api" && PYTHONPATH=. python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload) &
API_PID=$!

echo "Starting Web on http://127.0.0.1:3000 …"
(cd "$ROOT/web" && npm run dev -- --hostname 127.0.0.1 --port 3000) &
WEB_PID=$!

cleanup() {
  kill "$API_PID" "$WEB_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo ""
echo "Demo path:"
echo "  1. Open http://127.0.0.1:3000/cleaner"
echo "  2. Load messy HRIS sample → Export cleaned CSV"
echo "  3. Equity + Merit → Run audit → Fix parity → Export pack"
echo "  4. Closer → Project total wealth / PDF"
echo "  Reset demo anytime from the nav."
echo ""
wait
