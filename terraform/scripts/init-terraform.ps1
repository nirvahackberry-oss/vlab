# Retry terraform init with cache clear (fixes intermittent TLS download errors on Windows)
$ErrorActionPreference = "Stop"
$TerraformDir = Split-Path -Parent $PSScriptRoot
Set-Location $TerraformDir

Write-Host "==> Terraform dir: $TerraformDir"

# Optional: use HashiCorp network mirror (copy terraform.rc.example to %APPDATA%\terraform.rc)
$RcPath = Join-Path $env:APPDATA "terraform.rc"
if (Test-Path $RcPath) {
  Write-Host "==> Using $RcPath"
} else {
  Write-Host "==> Tip: copy terraform.rc.example to $RcPath if downloads keep failing"
}

if (Test-Path ".terraform") {
  Remove-Item -Recurse -Force ".terraform"
  Write-Host "==> Removed .terraform/"
}

$maxAttempts = 5
for ($i = 1; $i -le $maxAttempts; $i++) {
  Write-Host "`n==> terraform init attempt $i / $maxAttempts"
  terraform init
  if ($LASTEXITCODE -eq 0) {
    Write-Host "`n==> Success"
    exit 0
  }
  Write-Host "==> Failed, waiting 5s..."
  Start-Sleep -Seconds 5
  if (Test-Path ".terraform") {
    Remove-Item -Recurse -Force ".terraform" -ErrorAction SilentlyContinue
  }
}

Write-Host "`n==> Still failing. Try:"
Write-Host "  1. Disable VPN / corporate proxy temporarily"
Write-Host "  2. Pause antivirus HTTPS scanning"
Write-Host "  3. Copy terraform.rc.example to $RcPath"
Write-Host "  4. Run: .\scripts\install-providers-manual.ps1"
exit 1
