#!/usr/bin/env bash
set -euo pipefail

if [ -n "${ANDROID_STARTER_URL:-}" ] && [ ! -f /workspace/build.gradle ]; then
  /usr/local/bin/bootstrap-android-starter.sh "${ANDROID_STARTER_URL}"
fi

chmod +x /workspace/build.sh /workspace/gradlew 2>/dev/null || true

exec python3 /app/lab_server.py
