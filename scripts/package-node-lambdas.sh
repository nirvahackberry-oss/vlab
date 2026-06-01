#!/usr/bin/env bash
# Package Node.js API + JWT authorizer for AWS Lambda (linux x64).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="${ROOT}/backend"
OUT_DIR="${ROOT}/terraform/dist"
ZIP="${OUT_DIR}/node-lambdas.zip"

echo "==> Packaging Node Lambdas from ${BACKEND}"
rm -rf "${OUT_DIR}/build" "${ZIP}"
mkdir -p "${OUT_DIR}/build" "${OUT_DIR}"

rsync -a \
  --exclude node_modules \
  --exclude .env \
  "${BACKEND}/" "${OUT_DIR}/build/"

cd "${OUT_DIR}/build"
npm ci --omit=dev

# Lambda runs on Amazon Linux 2023 — rebuild native modules when packaging on macOS/Windows
if [[ "$(uname -s)" != "Linux" ]]; then
  echo "==> Note: package on Linux (CI) for native addons (node-pty is excluded from Lambda bundle)"
fi

# Lambda bundle: API + authorizer only (exclude dev terminal deps)
rm -rf node_modules/node-pty 2>/dev/null || true

zip -rq "${ZIP}" . \
  -x "*.git*" \
  -x "routes/*" \
  -x "middleware/*" \
  -x "utils/*" \
  -x "terminalHandler.js" \
  -x "index.js"

echo "==> Created ${ZIP} ($(du -h "${ZIP}" | cut -f1))"
