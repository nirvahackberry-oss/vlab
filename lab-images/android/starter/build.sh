#!/usr/bin/env bash
# Default Run target for mobile-app-lab (lab_server android labType).
set -euo pipefail
cd /workspace
chmod +x ./gradlew 2>/dev/null || true
./gradlew assembleDebug --no-daemon --stacktrace
echo ""
echo "=== Build OK ==="
echo "APK: app/build/outputs/apk/debug/app-debug.apk"
