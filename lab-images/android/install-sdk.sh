#!/usr/bin/env bash
# Install Android SDK packages. Variant "build" = compile-only; "emulator" adds AVD images.
set -euo pipefail

variant="${1:-build}"
android_home="${ANDROID_HOME:-/opt/android-sdk}"

mkdir -p "${android_home}/cmdline-tools"

wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/sdk.zip
unzip -q /tmp/sdk.zip -d "${android_home}/cmdline-tools"
mv "${android_home}/cmdline-tools/cmdline-tools" "${android_home}/cmdline-tools/latest"
rm -f /tmp/sdk.zip

yes | sdkmanager --licenses

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

sdkmanager "${packages[@]}"
