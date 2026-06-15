#!/usr/bin/env bash
set -euo pipefail

chmod +x /workspace/build.sh /workspace/gradlew 2>/dev/null || true

exec python3 /app/lab_server.py
