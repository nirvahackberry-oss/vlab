#!/usr/bin/env bash
set -euo pipefail

if [ -n "${LAB_BOOTSTRAP_URL:-}" ] && [ ! -f /workspace/lab.ipynb ]; then
  tmpdir="$(mktemp -d)"
  trap 'rm -rf "${tmpdir}"' EXIT
  curl -fsSL "${LAB_BOOTSTRAP_URL}" -o "${tmpdir}/notebook.tar.gz"
  tar -xzf "${tmpdir}/notebook.tar.gz" -C /workspace
fi

exec jupyter notebook \
  --ip=0.0.0.0 \
  --port=8888 \
  --no-browser \
  --allow-root \
  --NotebookApp.token= \
  --NotebookApp.password= \
  --NotebookApp.allow_origin=* \
  --NotebookApp.disable_check_xsrf=True \
  --NotebookApp.default_url=/notebooks/lab.ipynb
