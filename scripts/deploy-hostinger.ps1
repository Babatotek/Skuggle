#Requires -Version 5.1
[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$HostName = "147.93.54.101",
    [int]$Port = 65002,
    [string]$UserName = "u237094395",
    [string]$Domain = "skuggle.royalgatewayadmin.com",
    [string]$IdentityFile = (Join-Path $PSScriptRoot "..\skuggleSSH\id_rsa"),
    [switch]$SkipChecks,
    [switch]$SkipBuild,
    [switch]$AllowDirtyWorkingTree,
    [switch]$AllowNonMainBranch,
    [switch]$AllowDestructiveMigrations
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$identity = (Resolve-Path $IdentityFile).Path
$backend = Join-Path $repo "backend"
$work = Join-Path $repo ".deploy_tmp"
$deployRoot = "backend\deploy\shared-hosting"

function Invoke-Native {
    param([string]$Description, [scriptblock]$Command)
    Write-Host "==> $Description" -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Description failed with exit code $LASTEXITCODE"
    }
}

$requiredTools = @("git", "node", "npm.cmd", "tar.exe", "ssh.exe", "scp.exe", "ssh-keygen.exe")
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
foreach ($asset in @("remote-release.sh", "remote-deploy.sh")) {
    if (-not (Test-Path (Join-Path $repo "$deployRoot\$asset"))) {
        throw "Shared-hosting release assets are missing: $asset"
    }
}

Push-Location $repo
try {
    $inside = (git rev-parse --is-inside-work-tree 2>$null)
    if ($LASTEXITCODE -ne 0 -or "$inside".Trim() -ne "true") {
        throw "Production deploy must run from the Skuggle git repository."
    }
    $branch = (git branch --show-current).Trim()
    $commit = (git rev-parse --short=12 HEAD).Trim()
    $fullSha = (git rev-parse HEAD).Trim()
    $dirty = git status --porcelain
    if ($dirty -and -not $AllowDirtyWorkingTree) {
        throw "Working tree is dirty. Commit or stash changes, or pass -AllowDirtyWorkingTree."
    }
    if ($branch -notin @("main", "master") -and -not $AllowNonMainBranch) {
        throw "Production deploy expects main/master (current: '$branch'). Pass -AllowNonMainBranch to override."
    }
} finally { Pop-Location }

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$releaseId = "$timestamp-$commit"
Write-Host "==> Release $releaseId (branch $branch)" -ForegroundColor Cyan

New-Item -ItemType Directory -Force -Path $work | Out-Null
$releaseName = "skuggle-$releaseId.tar.gz"
$release = Join-Path $work $releaseName
$checksum = Join-Path $work "release.tar.gz.sha256"
$remoteHome = "/home/$UserName"
$domainRoot = "$remoteHome/domains/$Domain"
$artifactDir = "$remoteHome/deployments/skuggle/artifacts/$releaseId"

try {
    Invoke-Native "Validate SSH private key" { ssh-keygen.exe -y -f $identity | Out-Null }

    if (-not $SkipChecks) {
        Push-Location $repo
        try {
            Invoke-Native "Frontend typecheck" { npm.cmd run lint }
            Push-Location $backend
            try {
                Invoke-Native "Composer lock validation" { composer validate --no-check-publish --no-interaction }
                Invoke-Native "Backend style check" { composer exec pint -- --test }
                Invoke-Native "Backend tests" { php artisan test }
            } finally { Pop-Location }
        } finally { Pop-Location }
    }

    if (-not $SkipBuild) {
        Push-Location $repo
        $oldApi = $env:VITE_API_URL
        $oldLive = $env:VITE_LIVE_API
        $oldBuild = $env:VITE_BUILD_ID
        $oldSha = $env:VITE_GIT_SHA
        try {
            Invoke-Native "Install frontend dependencies" { npm.cmd ci }
            $env:VITE_API_URL = "/api/v1"
            $env:VITE_LIVE_API = "true"
            $env:VITE_BUILD_ID = $releaseId
            $env:VITE_GIT_SHA = $commit
            Invoke-Native "Build production frontend" { npm.cmd run build }
        } finally {
            $env:VITE_API_URL = $oldApi
            $env:VITE_LIVE_API = $oldLive
            $env:VITE_BUILD_ID = $oldBuild
            $env:VITE_GIT_SHA = $oldSha
            Pop-Location
        }
    }

    $indexHtml = Join-Path $repo "dist\index.html"
    $assetsDir = Join-Path $repo "dist\assets"
    if (-not (Test-Path $indexHtml) -or -not (Test-Path $assetsDir)) {
        throw "Production frontend output is missing dist/index.html or dist/assets."
    }
    $jsAssets = Get-ChildItem -Path $assetsDir -Recurse -Filter *.js -ErrorAction SilentlyContinue
    if (-not $jsAssets) {
        throw "Production frontend output has no JavaScript assets."
    }
    $indexText = [IO.File]::ReadAllText($indexHtml)
    foreach ($forbidden in @("http://localhost", "http://127.0.0.1")) {
        if ($indexText -match [regex]::Escape($forbidden)) {
            throw "Production index.html contains forbidden development origin: $forbidden"
        }
    }

    $stage = Join-Path $work "stage"
    if (Test-Path $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
    New-Item -ItemType Directory -Force -Path (Join-Path $stage "application"), (Join-Path $stage "public_html") | Out-Null

    Invoke-Native "Stage backend" {
        $backendStageArchive = Join-Path $work "backend-stage.tar"
        tar.exe -C $backend -cf $backendStageArchive --exclude=.env --exclude=.env.* --exclude=vendor --exclude=node_modules --exclude=tests --exclude=load-tests --exclude=storage/logs --exclude=public/storage --exclude=.git .
        if ($LASTEXITCODE -ne 0) { return }
        tar.exe -C (Join-Path $stage "application") -xf $backendStageArchive
    }
    Invoke-Native "Stage frontend" {
        $frontendStageArchive = Join-Path $work "frontend-stage.tar"
        tar.exe -C (Join-Path $repo "dist") -cf $frontendStageArchive --exclude=server.cjs --exclude=server.cjs.map --exclude=server.mjs --exclude=server.mjs.map .
        if ($LASTEXITCODE -ne 0) { return }
        tar.exe -C (Join-Path $stage "public_html") -xf $frontendStageArchive
    }
    Copy-Item (Join-Path $repo "$deployRoot\public_html\index.php") (Join-Path $stage "public_html\index.php") -Force
    Copy-Item (Join-Path $repo "$deployRoot\public_html\.htaccess") (Join-Path $stage "public_html\.htaccess") -Force
    Copy-Item (Join-Path $repo "$deployRoot\remote-release.sh") (Join-Path $stage "application\remote-release.sh") -Force
    Copy-Item (Join-Path $repo "$deployRoot\remote-deploy.sh") (Join-Path $stage "application\remote-deploy.sh") -Force

    $builtAt = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
    $dirtyFlag = if ($dirty) { "true" } else { "false" }
    $manifest = @"
{
    "application": "skuggle",
    "release": "$releaseId",
    "commit": "$fullSha",
    "branch": "$branch",
    "environment": "production",
    "builtAt": "$builtAt",
    "frontendBuild": "$releaseId",
    "backendBuild": "$releaseId",
    "dirtyWorkingTree": $dirtyFlag
}
"@
    [IO.File]::WriteAllText((Join-Path $stage "release-manifest.json"), $manifest.Trim() + "`n", [Text.UTF8Encoding]::new($false))

    Invoke-Native "Create release archive" { tar.exe -C $stage -czf $release application public_html release-manifest.json }
    $hash = (Get-FileHash $release -Algorithm SHA256).Hash.ToLowerInvariant()
    [IO.File]::WriteAllText($checksum, "$hash  release.tar.gz`n", [Text.UTF8Encoding]::new($false))

    $sshOpts = @(
        "-o", "BatchMode=yes",
        "-o", "StrictHostKeyChecking=accept-new",
        "-o", "ServerAliveInterval=15",
        "-o", "ServerAliveCountMax=12",
        "-o", "TCPKeepAlive=yes",
        "-o", "Compression=yes"
    )
    $ssh = @("-i", $identity, "-p", "$Port") + $sshOpts + @("$UserName@$HostName")
    $scp = @("-i", $identity, "-P", "$Port") + $sshOpts
    Invoke-Native "Test SSH connection" { ssh.exe @ssh "echo SSH_OK" }

    if (-not $PSCmdlet.ShouldProcess("$UserName@$HostName", "Deploy Skuggle release $releaseId to $domainRoot")) { return }

    $destructiveFlag = if ($AllowDestructiveMigrations) { "true" } else { "false" }
    $remoteEnvPath = Join-Path $work "release.env"
    $remoteEnv = @"
RELEASE_ID=$releaseId
APP_RELEASE_ID=$releaseId
APP_GIT_SHA=$commit
DOMAIN_ROOT=$domainRoot
PHP_BIN=/opt/alt/php83/usr/bin/php
PUBLIC_HEALTH_URL=https://$Domain
ALLOW_DESTRUCTIVE_MIGRATIONS=$destructiveFlag
"@
    [IO.File]::WriteAllText($remoteEnvPath, $remoteEnv.Replace("`r`n", "`n"), [Text.UTF8Encoding]::new($false))

    Invoke-Native "Create remote artifact directory" { ssh.exe @ssh "mkdir -p '$artifactDir'" }
    Invoke-Native "Upload release archive" { scp.exe @scp $release "$UserName@$HostName`:$artifactDir/release.tar.gz" }
    Invoke-Native "Upload release checksum" { scp.exe @scp $checksum "$UserName@$HostName`:$artifactDir/release.tar.gz.sha256" }
    Invoke-Native "Upload release env" { scp.exe @scp $remoteEnvPath "$UserName@$HostName`:$remoteHome/skuggle-release.env" }
    Invoke-Native "Upload deployment command" { scp.exe @scp (Join-Path $repo "$deployRoot\remote-deploy.sh") "$UserName@$HostName`:$remoteHome/skuggle-remote-deploy.sh" }
    Invoke-Native "Activate release" {
        ssh.exe @ssh "set -euo pipefail; set -a; . '$remoteHome/skuggle-release.env'; set +a; rm -f '$remoteHome/skuggle-release.env'; bash '$remoteHome/skuggle-remote-deploy.sh'; rc=`$?; rm -f '$remoteHome/skuggle-remote-deploy.sh'; exit `$rc"
    }

    $health = Invoke-WebRequest -UseBasicParsing -TimeoutSec 20 -Uri "https://$Domain/ready"
    if ($health.StatusCode -ne 200) { throw "Readiness check returned HTTP $($health.StatusCode)" }
    $body = $health.Content | ConvertFrom-Json
    if ($body.status -ne "ready") { throw "Readiness check status is '$($body.status)'" }
    if ($body.release -ne $releaseId) { throw "Readiness release '$($body.release)' does not match $releaseId" }
    $homePage = Invoke-WebRequest -UseBasicParsing -TimeoutSec 20 -Uri "https://$Domain/"
    if ($homePage.StatusCode -ne 200 -or $homePage.Content -notmatch "assets/") {
        throw "Frontend smoke check failed for https://$Domain/"
    }
    Write-Host "Deployment successful: https://$Domain (release $releaseId)" -ForegroundColor Green
} finally {
    Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
}
