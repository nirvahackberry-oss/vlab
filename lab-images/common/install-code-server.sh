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

# Sanity-check the binary and that built-in extensions were unpacked (not an empty npm stub).
test -n "$(code-server --version | awk 'NR==1 {print $2}')"
test -f /usr/lib/code-server/lib/vscode/extensions/emmet/dist/node/emmetNodeMain.js

echo "code-server ${version} web install OK"
