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

# install.sh can pull the small npm tarball missing web bundles; the .deb ships the browser workbench.
test -f /usr/lib/code-server/lib/vscode/out/vs/code/browser/workbench/workbench.js
