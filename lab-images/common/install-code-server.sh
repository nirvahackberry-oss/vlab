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

# Core web workbench — install.sh can omit browser bundles; the .deb should ship them.
test -f /usr/lib/code-server/lib/vscode/out/vs/code/browser/workbench/workbench.js
# Extension browser bundles — missing in broken images that still pass workbench.js alone.
test -f /usr/lib/code-server/lib/vscode/extensions/emmet/dist/browser/emmetBrowserMain.js
echo "code-server ${version} web install OK"
