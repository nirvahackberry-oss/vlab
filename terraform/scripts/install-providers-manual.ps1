# Manual provider install when "tls: bad record MAC" blocks terraform init downloads
# Run from: vlab\terraform\scripts\install-providers-manual.ps1
$ErrorActionPreference = "Stop"
$TerraformDir = Split-Path -Parent $PSScriptRoot
Set-Location $TerraformDir

$Platform = "windows_amd64"
$Providers = @(
  @{ Name = "aws";     Version = "5.100.0" },
  @{ Name = "random";  Version = "3.9.0" },
  @{ Name = "null";    Version = "3.3.0" },
  @{ Name = "archive"; Version = "2.8.0" }
)

$BaseDir = Join-Path $TerraformDir ".terraform\providers\registry.terraform.io\hashicorp"
New-Item -ItemType Directory -Force -Path $BaseDir | Out-Null

function Install-Provider($Name, $Version) {
  $destDir = Join-Path $BaseDir "$Name\$Version\$Platform"
  $zipName = "terraform-provider-${Name}_${Version}_${Platform}.zip"
  $url = "https://releases.hashicorp.com/terraform-provider-${Name}/$Version/$zipName"
  $zipPath = Join-Path $env:TEMP $zipName

  if (Test-Path (Join-Path $destDir "terraform-provider-${Name}_v${Version}_x5.exe")) {
    Write-Host "[skip] $Name $Version already present"
    return
  }

  Write-Host "[download] $url"
  $attempts = 0
  while ($attempts -lt 5) {
    $attempts++
    try {
      [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
      Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
      break
    } catch {
      Write-Host "  attempt $attempts failed: $($_.Exception.Message)"
      if ($attempts -ge 5) { throw }
      Start-Sleep -Seconds 3
    }
  }

  New-Item -ItemType Directory -Force -Path $destDir | Out-Null
  Expand-Archive -Path $zipPath -DestinationPath $destDir -Force
  Remove-Item $zipPath -Force
  Write-Host "[ok] $Name $Version -> $destDir"
}

foreach ($p in $Providers) {
  Install-Provider $p.Name $p.Version
}

Write-Host "`n==> Run: terraform init"
terraform init
