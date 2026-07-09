#!/usr/bin/env bash
# Package Android starter sources for S3 session bootstrap.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
starter_dir="${root}/android/starter"
output="${root}/android/android-starter.tar.gz"

if [ ! -d "${starter_dir}" ]; then
  echo "starter directory not found: ${starter_dir}" >&2
  exit 1
fi

tar -czf "${output}" \
  --exclude='.gradle' \
  --exclude='local.properties' \
  --exclude='build' \
  --exclude='app/build' \
  --exclude='*.tar.gz' \
  -C "${starter_dir}" .

echo "Wrote ${output}"
