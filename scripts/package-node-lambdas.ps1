# Package Node.js API + JWT authorizer for AWS Lambda
$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Backend = Join-Path $Root "backend"
$OutDir = Join-Path $Root "terraform\dist"
$Build = Join-Path $OutDir "build"
$Zip = Join-Path $OutDir "node-lambdas.zip"

Write-Host "==> Packaging Node Lambdas from $Backend"
if (Test-Path $Build) { Remove-Item -Recurse -Force $Build }
if (Test-Path $Zip) { Remove-Item -Force $Zip }
New-Item -ItemType Directory -Force -Path $Build | Out-Null

robocopy $Backend $Build /E /XD node_modules .git /XF .env | Out-Null
Set-Location $Build
npm ci --omit=dev
if (Test-Path "node_modules\node-pty") { Remove-Item -Recurse -Force "node_modules\node-pty" }
Compress-Archive -Path "$Build\*" -DestinationPath $Zip -Force
Write-Host "==> Created $Zip"
