#!/usr/bin/env bash
# Package .NET MVC + console snippet archives for S3 session bootstrap.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
assets_dir="${root}/dotnet/assets"
mvc_archive="${assets_dir}/mvc.tar.gz"
console_archive="${assets_dir}/console-snippet.tar.gz"

if ! command -v dotnet >/dev/null 2>&1; then
  echo "dotnet SDK is required to package dotnet lab assets" >&2
  exit 1
fi

tmpdir="$(mktemp -d)"
trap 'rm -rf "${tmpdir}"' EXIT

mkdir -p "${assets_dir}"

dotnet new mvc -o "${tmpdir}/MyWebApp" -n MyWebApp --no-https -f net8.0 --force
dotnet add "${tmpdir}/MyWebApp" package Microsoft.EntityFrameworkCore.Sqlite --version 8.0.11
dotnet add "${tmpdir}/MyWebApp" package Microsoft.EntityFrameworkCore.Design --version 8.0.11

tar -czf "${mvc_archive}" -C "${tmpdir}" MyWebApp
echo "Wrote ${mvc_archive}"

dotnet new console -o "${tmpdir}/dotnet-snippet" --force
tar -czf "${console_archive}" -C "${tmpdir}/dotnet-snippet" .
echo "Wrote ${console_archive}"
