[CmdletBinding()]
param(
    [switch]$Tunnel,
    [switch]$KeepCache
)

$ErrorActionPreference = 'Stop'
$repositoryDirectory = $PSScriptRoot
$mobileDirectory = Join-Path $repositoryDirectory 'nearbuy-mobile'
$hostedApiUrl = 'https://nearbuy-api-7c197b38.onrender.com'

if (-not (Test-Path (Join-Path $mobileDirectory 'package.json'))) {
    throw "The Nearbuy mobile project was not found at $mobileDirectory"
}

$listener = Get-NetTCPConnection -State Listen -LocalPort 8081 -ErrorAction SilentlyContinue |
    Select-Object -First 1
if ($listener) {
    $owner = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)" `
        -ErrorAction SilentlyContinue
    if ([string]$owner.CommandLine -like "*$mobileDirectory*") {
        Write-Host 'Nearbuy Expo is already running on port 8081.' -ForegroundColor Yellow
        Write-Host 'Run .\STOP_NEARBUY.cmd first if you want a clean restart.'
        exit 0
    }
    throw "Port 8081 is being used by another program (process $($listener.OwningProcess))."
}

if (-not (Test-Path (Join-Path $mobileDirectory 'node_modules'))) {
    Write-Host 'Installing mobile dependencies (first run only)...'
    Push-Location $mobileDirectory
    try {
        & npm.cmd install
        if ($LASTEXITCODE -ne 0) {
            throw 'npm install failed.'
        }
    } finally {
        Pop-Location
    }
}

# The hosted HTTPS backend remains available independently of this laptop.
$env:EXPO_PUBLIC_API_URL = $hostedApiUrl

# Free Render services sleep after 15 idle minutes and take minutes to wake, so
# wake every service before Expo opens and keep them warm while testing.
$hostedServiceUrls = @(
    'https://nearbuy-api-7c197b38.onrender.com',
    'https://nearbuy-user-7c197b38.onrender.com',
    'https://nearbuy-listing-7c197b38.onrender.com',
    'https://nearbuy-chat-7c197b38.onrender.com',
    'https://nearbuy-payment-7c197b38.onrender.com'
)

$pingServiceBlock = {
    param($target, $timeoutMinutes)
    $deadline = (Get-Date).AddMinutes($timeoutMinutes)
    while ((Get-Date) -lt $deadline) {
        try {
            Invoke-WebRequest -Uri $target -UseBasicParsing -TimeoutSec 90 | Out-Null
            return $true
        } catch {
            # Any HTTP status (401/403/404) still proves the service is awake.
            if ($_.Exception.Response) { return $true }
        }
        Start-Sleep -Seconds 5
    }
    return $false
}

Write-Host 'Waking the hosted backend (cold Render services can take 3-5 minutes)...'
$wakeJobs = foreach ($serviceUrl in $hostedServiceUrls) {
    Start-Job -ScriptBlock $pingServiceBlock -ArgumentList $serviceUrl, 7
}
$null = Wait-Job -Job $wakeJobs -Timeout 450
for ($index = 0; $index -lt $wakeJobs.Count; $index++) {
    $awake = Receive-Job -Job $wakeJobs[$index] -ErrorAction SilentlyContinue
    $serviceName = ([Uri]$hostedServiceUrls[$index]).Host.Split('.')[0]
    if ($awake -eq $true) {
        Write-Host "  $serviceName is awake." -ForegroundColor Green
    } else {
        Write-Warning "  $serviceName did not respond. Check https://dashboard.render.com before demoing."
    }
}
Remove-Job -Job $wakeJobs -Force -ErrorAction SilentlyContinue

# Ping every service each 5 minutes so nothing falls asleep mid-demo. The job
# is removed when this script exits (Ctrl+C included) via the finally block.
$keepAliveJob = Start-Job -ScriptBlock {
    param($targets)
    while ($true) {
        foreach ($target in $targets) {
            try { Invoke-WebRequest -Uri $target -UseBasicParsing -TimeoutSec 90 | Out-Null } catch {}
        }
        Start-Sleep -Seconds 300
    }
} -ArgumentList (, $hostedServiceUrls)
$connectionMode = if ($Tunnel) { 'tunnel' } else { 'lan' }
$expoArguments = @('expo', 'start', "--$connectionMode", '--go', '--port', '8081')
if (-not $KeepCache) {
    $expoArguments += '--clear'
}

Write-Host ''
Write-Host 'Starting Nearbuy mobile testing...' -ForegroundColor Green
Write-Host "Backend: $hostedApiUrl"
Write-Host "Expo connection: $connectionMode"
if ($Tunnel) {
    Write-Host 'Tunnel mode depends on Expo/ngrok and can occasionally time out.' -ForegroundColor Yellow
} else {
    Write-Host 'Connect the iPhone and laptop to the same Wi-Fi, then scan the QR in Expo Go.'
}
Write-Host 'Keep this window open. Press Ctrl+C when finished, or run STOP_NEARBUY.cmd.'
Write-Host ''

Push-Location $mobileDirectory
try {
    & npx.cmd @expoArguments
} finally {
    Pop-Location
    if ($keepAliveJob) {
        Stop-Job -Job $keepAliveJob -ErrorAction SilentlyContinue
        Remove-Job -Job $keepAliveJob -Force -ErrorAction SilentlyContinue
    }
}
