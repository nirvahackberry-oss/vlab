#!/usr/bin/env bash
# Run session bootstrap from LAB_BOOTSTRAP_* env vars before lab_server starts.
set -euo pipefail

if [ -n "${LAB_BOOTSTRAP_URL:-}" ] || [ -n "${ANDROID_STARTER_URL:-}" ] || [ -n "${LAB_BOOTSTRAP_CONSOLE_URL:-}" ]; then
  python3 /app/lab_server.py --session-bootstrap
fi

exec python3 /app/lab_server.py "$@"
