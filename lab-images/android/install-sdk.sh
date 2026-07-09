#!/usr/bin/env bash
# Install Android SDK packages. Variant "build" = compile-only; "emulator" adds AVD images.
set -euo pipefail

variant="${1:-build}"
android_home="${ANDROID_HOME:-/opt/android-sdk}"

export ANDROID_HOME="${android_home}"
export ANDROID_SDK_ROOT="${android_home}"
export PATH="${android_home}/cmdline-tools/latest/bin:${PATH}"

mkdir -p "${android_home}/cmdline-tools"

wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/sdk.zip
unzip -q /tmp/sdk.zip -d "${android_home}/cmdline-tools"
mv "${android_home}/cmdline-tools/cmdline-tools" "${android_home}/cmdline-tools/latest"
rm -f /tmp/sdk.zip

# `yes` gets SIGPIPE (exit 141) once sdkmanager stops reading â€” that's expected.
# Make this non-fatal even under strict shell settings.
set +o pipefail
yes | sdkmanager --licenses >/dev/null 2>&1 || true
set -o pipefail

packages=(
  "platform-tools"
  "platforms;android-33"
  "build-tools;33.0.2"
)

if [ "${variant}" = "emulator" ]; then
  packages+=(
    "emulator"
    "system-images;android-33;google_apis;x86_64"
  )
fi

sdkmanager --install "${packages[@]}"
