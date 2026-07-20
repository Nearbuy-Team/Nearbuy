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
}
