#Requires -Version 5.1
[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$HostName = "147.93.54.101",
    [int]$Port = 65002,
    [string]$UserName = "u237094395",
    [string]$Domain = "skuggle.royalgatewayadmin.com",
    [string]$IdentityFile = (Join-Path $PSScriptRoot "..\skuggleSSH\id_rsa"),
    [switch]$SkipChecks,
    [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$identity = (Resolve-Path $IdentityFile).Path
$backend = Join-Path $repo "backend"
$work = Join-Path $repo ".deploy_tmp"
$release = Join-Path $work "skuggle-release.tar.gz"
$checksum = "$release.sha256"
$remoteHome = "/home/$UserName"
$domainRoot = "$remoteHome/domains/$Domain"

function Invoke-Native {
    param([string]$Description, [scriptblock]$Command)
    Write-Host "==> $Description" -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Description failed with exit code $LASTEXITCODE"
    }
}

$requiredTools = @("npm.cmd", "tar.exe", "ssh.exe", "scp.exe", "ssh-keygen.exe")
if (-not $SkipChecks) { $requiredTools += @("composer", "php") }
foreach ($tool in $requiredTools) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        throw "Required command is missing: $tool"
    }
}
if (-not $SkipChecks) {
    $phpVersion = & php -r "echo PHP_VERSION;"
    if ($LASTEXITCODE -ne 0 -or [version]$phpVersion -lt [version]"8.3.0") {
        throw "Skuggle requires PHP 8.3 or newer; the active PHP is $phpVersion. Put the Hostinger-compatible PHP binary first on PATH or use -SkipChecks only after CI has passed."
    }
}
if (-not (Test-Path (Join-Path $repo "backend\deploy\shared-hosting\remote-release.sh"))) {
    throw "Shared-hosting release assets are missing."
}

New-Item -ItemType Directory -Force -Path $work | Out-Null
try {
    Invoke-Native "Validate SSH private key" { ssh-keygen.exe -y -f $identity | Out-Null }

    if (-not $SkipChecks) {
        Push-Location $repo
        try {
            Invoke-Native "Frontend typecheck" { npm.cmd run typecheck }
            Invoke-Native "Frontend tests" { npm.cmd run test }
            Push-Location backend
            try {
                Invoke-Native "Backend style check" { composer exec pint -- --test }
                Invoke-Native "Backend tests" { php artisan test }
            } finally { Pop-Location }
        } finally { Pop-Location }
    }

    if (-not $SkipBuild) {
        Push-Location $repo
        $oldApi = $env:VITE_API_URL
        $oldLive = $env:VITE_LIVE_API
        try {
            $env:VITE_API_URL = "/api/v1"
            $env:VITE_LIVE_API = "true"
            Invoke-Native "Build production frontend" { npm.cmd run build }
        } finally {
            $env:VITE_API_URL = $oldApi
            $env:VITE_LIVE_API = $oldLive
            Pop-Location
        }
    }

    $stage = Join-Path $work "stage"
    if (Test-Path $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
    New-Item -ItemType Directory -Force -Path (Join-Path $stage "application"), (Join-Path $stage "public_html") | Out-Null

    Invoke-Native "Stage backend" {
        tar.exe -C (Join-Path $repo "backend") -cf - --exclude=.env --exclude=.env.* --exclude=vendor --exclude=node_modules --exclude=tests --exclude=load-tests --exclude=storage/logs . |
            tar.exe -C (Join-Path $stage "application") -xf -
    }
    Invoke-Native "Stage frontend" {
        tar.exe -C (Join-Path $repo "dist") -cf - --exclude=server.cjs --exclude=server.cjs.map . |
            tar.exe -C (Join-Path $stage "public_html") -xf -
    }
    Copy-Item (Join-Path $repo "backend\deploy\shared-hosting\public_html\index.php") (Join-Path $stage "public_html\index.php") -Force
    Copy-Item (Join-Path $repo "backend\deploy\shared-hosting\public_html\.htaccess") (Join-Path $stage "public_html\.htaccess") -Force
    Copy-Item (Join-Path $repo "backend\deploy\shared-hosting\remote-release.sh") (Join-Path $stage "application\remote-release.sh") -Force
    Invoke-Native "Create release archive" { tar.exe -C $stage -czf $release application public_html }
    $hash = (Get-FileHash $release -Algorithm SHA256).Hash.ToLowerInvariant()
    [IO.File]::WriteAllText($checksum, "$hash  skuggle-release.tar.gz`n", [Text.UTF8Encoding]::new($false))

    $ssh = @("-i", $identity, "-p", "$Port", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=accept-new", "$UserName@$HostName")
    $scp = @("-i", $identity, "-P", "$Port", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=accept-new")
    Invoke-Native "Test SSH connection" { ssh.exe @ssh "echo SSH_OK" }

    if (-not $PSCmdlet.ShouldProcess("$UserName@$HostName", "Deploy Skuggle to $domainRoot")) { return }
    Invoke-Native "Upload release" { scp.exe @scp $release $checksum "$UserName@$HostName`:$remoteHome/" }

    $remote = @'
set -euo pipefail
DOMAIN_ROOT="__DOMAIN_ROOT__"
APP_DIR="$DOMAIN_ROOT/application"
PUBLIC_DIR="$DOMAIN_ROOT/public_html"
ARCHIVE="$HOME/skuggle-release.tar.gz"
STAMP="$(date +%Y%m%d%H%M%S)"
STAGE="$DOMAIN_ROOT/.release-$STAMP"
BACKUP="$HOME/backups/skuggle-$STAMP"
cleanup() { rm -rf "$STAGE"; rm -f "$ARCHIVE" "$ARCHIVE.sha256"; }
trap cleanup EXIT
cd "$HOME"
sha256sum -c skuggle-release.tar.gz.sha256
mkdir -p "$STAGE" "$BACKUP"
tar -xzf "$ARCHIVE" -C "$STAGE"
test -f "$STAGE/application/artisan"
test -f "$STAGE/public_html/index.html"
if [[ -f "$APP_DIR/.env" ]]; then cp "$APP_DIR/.env" "$STAGE/application/.env"; fi
if [[ ! -f "$STAGE/application/.env" ]]; then echo "Missing production $APP_DIR/.env" >&2; exit 1; fi
if [[ -d "$APP_DIR" ]]; then mv "$APP_DIR" "$BACKUP/application"; fi
if [[ -d "$PUBLIC_DIR" ]]; then mv "$PUBLIC_DIR" "$BACKUP/public_html"; fi
mv "$STAGE/application" "$APP_DIR"
mv "$STAGE/public_html" "$PUBLIC_DIR"
if ! APP_DIR="$APP_DIR" PUBLIC_DIR="$PUBLIC_DIR" PHP_BIN=/opt/alt/php83/usr/bin/php bash "$APP_DIR/remote-release.sh"; then
  rm -rf "$APP_DIR" "$PUBLIC_DIR"
  if [[ -d "$BACKUP/application" ]]; then mv "$BACKUP/application" "$APP_DIR"; fi
  if [[ -d "$BACKUP/public_html" ]]; then mv "$BACKUP/public_html" "$PUBLIC_DIR"; fi
  exit 1
fi
find "$HOME/backups" -mindepth 1 -maxdepth 1 -type d -name 'skuggle-*' -printf '%T@ %p\n' | sort -nr | tail -n +6 | cut -d' ' -f2- | xargs -r rm -rf
'@.Replace("__DOMAIN_ROOT__", $domainRoot).Replace("`r`n", "`n")

    $remotePath = Join-Path $work "remote-deploy.sh"
    [IO.File]::WriteAllText($remotePath, $remote, [Text.UTF8Encoding]::new($false))
    Invoke-Native "Upload deployment command" { scp.exe @scp $remotePath "$UserName@$HostName`:$remoteHome/skuggle-remote-deploy.sh" }
    Invoke-Native "Activate release" { ssh.exe @ssh "bash '$remoteHome/skuggle-remote-deploy.sh'; rc=`$?; rm -f '$remoteHome/skuggle-remote-deploy.sh'; exit `$rc" }

    $health = Invoke-WebRequest -UseBasicParsing -TimeoutSec 20 -Uri "https://$Domain/ready"
    if ($health.StatusCode -ne 200) { throw "Readiness check returned HTTP $($health.StatusCode)" }
    Write-Host "Deployment successful: https://$Domain" -ForegroundColor Green
} finally {
    Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
}
