#!/usr/bin/env bash
# Extract the Android starter project tarball into /workspace and prepare Gradle.
set -euo pipefail

archive_url="${1:?starter archive URL required}"
android_home="${ANDROID_HOME:-/opt/android-sdk}"
workspace="${LAB_WORKSPACE:-/workspace}"
gradle_version="${GRADLE_VERSION:-8.2}"

if [ -f "${workspace}/build.gradle" ]; then
  echo "Android starter already present in ${workspace}; skipping bootstrap"
  exit 0
fi

tmpdir="$(mktemp -d)"
trap 'rm -rf "${tmpdir}"' EXIT

curl -fsSL "${archive_url}" -o "${tmpdir}/starter.tar.gz"
tar -xzf "${tmpdir}/starter.tar.gz" -C "${workspace}"

printf 'sdk.dir=%s\n' "${android_home}" > "${workspace}/local.properties"

cd "${workspace}"
if [ ! -x ./gradlew ]; then
  gradle wrapper --gradle-version "${gradle_version}"
fi
chmod +x ./gradlew ./build.sh 2>/dev/null || true

echo "Android starter bootstrapped in ${workspace}"
