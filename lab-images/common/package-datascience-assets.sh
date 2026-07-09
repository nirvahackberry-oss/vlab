#!/usr/bin/env bash
# Package datascience notebook for S3 session bootstrap.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
notebook="${root}/datascience/lab.ipynb"
output="${root}/datascience/datascience-notebook.tar.gz"

if [ ! -f "${notebook}" ]; then
  echo "notebook not found: ${notebook}" >&2
  exit 1
fi

tar -czf "${output}" -C "${root}/datascience" lab.ipynb
echo "Wrote ${output}"
