#!/bin/sh
set -eu

version="${CODE_SERVER_VERSION:?CODE_SERVER_VERSION is required}"
deb="/tmp/code-server_${version}_amd64.deb"

curl -fSL \
  "https://github.com/coder/code-server/releases/download/v${version}/code-server_${version}_amd64.deb" \
  -o "${deb}"

apt-get update
apt-get install -y --no-install-recommends "${deb}"
rm -f "${deb}"
rm -rf /var/lib/apt/lists/*

# install.sh/npm can omit the browser workbench; the official .deb includes it on disk.
test -f /usr/lib/code-server/lib/vscode/out/vs/code/browser/workbench/workbench.js
test -f /usr/lib/code-server/lib/vscode/out/vs/workbench/workbench.web.main.internal.js

# Official packages do not ship extensions/*/dist/browser/* (emmet 404s are normal).
# Verify code-server actually serves the web workbench over HTTP.
workspace="/tmp/code-server-verify-workspace"
mkdir -p "${workspace}"
commit="$(code-server --version | awk '{print $2}')"
port=18080
code-server --bind-addr "127.0.0.1:${port}" --auth none "${workspace}" >/tmp/code-server-verify.log 2>&1 &
pid=$!
cleanup() {
  kill "${pid}" 2>/dev/null || true
  wait "${pid}" 2>/dev/null || true
}
trap cleanup EXIT

ready=0
i=0
while [ "${i}" -lt 30 ]; do
  if curl -fsS "http://127.0.0.1:${port}/" >/dev/null 2>&1; then
    ready=1
    break
  fi
  i=$((i + 1))
  sleep 1
done
test "${ready}" -eq 1

code="$(curl -s -o /dev/null -w '%{http_code}' \
  "http://127.0.0.1:${port}/stable-${commit}/static/out/vs/code/browser/workbench/workbench.js")"
test "${code}" = "200"

echo "code-server ${version} web install OK"
