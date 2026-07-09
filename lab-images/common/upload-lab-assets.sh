#!/usr/bin/env bash
# Package all lab session assets and upload them to the test-cases S3 bucket.
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"

project_name="${PROJECT_NAME:-vlab}"
environment="${ENVIRONMENT:-dev}"
bucket="${LAB_ASSETS_BUCKET:-}"

cd "${repo_root}"

chmod +x lab-images/common/package-android-assets.sh
chmod +x lab-images/common/package-dotnet-assets.sh
chmod +x lab-images/common/package-datascience-assets.sh

lab-images/common/package-android-assets.sh
lab-images/common/package-dotnet-assets.sh
lab-images/common/package-datascience-assets.sh

if [ -z "${bucket}" ]; then
  bucket="$(aws s3api list-buckets --query "Buckets[?starts_with(Name, '${project_name}-${environment}-test-cases')].Name | [0]" --output text)"
fi

if [ -z "${bucket}" ] || [ "${bucket}" = "None" ]; then
  echo "test-cases bucket not found; packaged archives locally only" >&2
  exit 0
fi

upload() {
  local src="$1"
  local key="$2"
  aws s3 cp "${src}" "s3://${bucket}/${key}" --content-type "application/gzip"
  echo "Uploaded s3://${bucket}/${key}"
}

upload "lab-images/android/android-starter.tar.gz" "lab-assets/android/starter/latest.tar.gz"
upload "lab-images/dotnet/assets/mvc.tar.gz" "lab-assets/dotnet/mvc/latest.tar.gz"
upload "lab-images/dotnet/assets/console-snippet.tar.gz" "lab-assets/dotnet/console-snippet/latest.tar.gz"
upload "lab-images/datascience/datascience-notebook.tar.gz" "lab-assets/datascience/notebook/latest.tar.gz"

# Backward-compatible Android key used by older app integrations.
upload "lab-images/android/android-starter.tar.gz" "lab-assets/android-starter/latest.tar.gz"
