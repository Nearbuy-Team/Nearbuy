[CmdletBinding()]
param(
    [switch]$UsePaystack
)

$ErrorActionPreference = 'Stop'
$repositoryDirectory = $PSScriptRoot
$backendDirectory = Join-Path $repositoryDirectory 'backend'
$mobileDirectory = Join-Path $repositoryDirectory 'nearbuy-mobile'
$backendEnv = Join-Path $backendDirectory '.env'
$mobileEnv = Join-Path $mobileDirectory '.env'

function Find-LanIPv4 {
    $routes = Get-NetRoute -AddressFamily IPv4 -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue |
        Where-Object { $_.NextHop -ne '0.0.0.0' } |
        Sort-Object @{ Expression = { $_.RouteMetric + $_.InterfaceMetric } }

    foreach ($route in $routes) {
        $addresses = Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $route.InterfaceIndex -ErrorAction SilentlyContinue |
            Where-Object {
                $_.AddressState -eq 'Preferred' -and
                $_.IPAddress -notlike '127.*' -and
                $_.IPAddress -notlike '169.254.*'
            }

        foreach ($address in $addresses) {
            if ($address.IPAddress -match '^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)') {
                return $address.IPAddress
            }
        }
    }

    throw 'No private LAN IPv4 address was found. Connect the laptop to Wi-Fi or your phone hotspot, then try again.'
}

function Set-MobileApiUrl([string]$lanIp) {
    $apiLine = "EXPO_PUBLIC_API_URL=http://${lanIp}:8080"
    $content = if (Test-Path $mobileEnv) { [System.IO.File]::ReadAllText($mobileEnv) } else { '' }

    if ($content -match '(?m)^EXPO_PUBLIC_API_URL=.*$') {
        $content = [regex]::Replace($content, '(?m)^EXPO_PUBLIC_API_URL=.*$', $apiLine)
    } else {
        if ($content.Length -gt 0 -and -not $content.EndsWith("`n")) {
            $content += [Environment]::NewLine
        }
        $content += $apiLine + [Environment]::NewLine
    }

    $utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($mobileEnv, $content, $utf8WithoutBom)
}

function Get-DotEnvValue([string]$name) {
    $content = [System.IO.File]::ReadAllText($backendEnv)
    $match = [regex]::Match($content, "(?m)^\s*$([regex]::Escape($name))\s*=\s*(.*?)\s*$")
    if (-not $match.Success) {
        return ''
    }
    return $match.Groups[1].Value.Trim().Trim('"').Trim("'")
}

function Test-DemoBackend([string]$apiUrl) {
    try {
        $body = @{ email = 'buyer@nearbuy.test'; password = 'Nearbuy123!' } | ConvertTo-Json
        $response = Invoke-RestMethod -Method Post -Uri "$apiUrl/api/auth/login" `
            -ContentType 'application/json' -Body $body -TimeoutSec 5
        if ([string]::IsNullOrWhiteSpace($response.token)) {
            return $false
        }
        $headers = @{ Authorization = "Bearer $($response.token)" }
        Invoke-RestMethod -Method Get -Uri "$apiUrl/api/wallet/balance" `
            -Headers $headers -TimeoutSec 5 | Out-Null
        Invoke-RestMethod -Method Get -Uri "$apiUrl/api/listings" `
            -Headers $headers -TimeoutSec 5 | Out-Null
        return $true
    } catch {
        return $false
    }
}

if (-not (Test-Path $backendEnv)) {
    throw 'backend/.env is missing. Copy backend/.env.example to backend/.env and fill in the local secrets first.'
}

if ($UsePaystack) {
    $paystackKey = Get-DotEnvValue 'PAYSTACK_SECRET_KEY'
    if (-not $paystackKey.StartsWith('sk_test_')) {
        throw 'The -UsePaystack option requires a Paystack test secret key (sk_test_...) in backend/.env. Live keys are intentionally refused by the exhibition launcher.'
    }
    $env:PAYSTACK_SECRET_KEY = $paystackKey
    Write-Host 'Payment mode: Paystack test checkout (internet required; no real charges).'
} else {
    # A non-key sentinel overrides any value loaded from backend/.env. An empty
    # process value would allow Docker Compose to fall back to the .env value.
    $env:PAYSTACK_SECRET_KEY = 'disabled-for-exhibition-sandbox'
    $env:PAYSTACK_TRANSFERS_ENABLED = 'false'
    $env:PAYMENTS_SANDBOX_ENABLED = 'true'
    Write-Host 'Payment mode: local sandbox (recommended for a reliable exhibition demo).'
}

docker version --format '{{.Server.Version}}' | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw 'Docker Desktop is not ready. Open it, wait for the engine to start, and run this command again.'
}

$lanIp = Find-LanIPv4
Set-MobileApiUrl $lanIp

Write-Host "Using phone-accessible API: http://${lanIp}:8080"
Write-Host 'Starting the backend and restoring exhibition demo data...'

& powershell.exe -NoProfile -ExecutionPolicy Bypass -File `
    (Join-Path $backendDirectory 'scripts\seed-test-data.ps1') -SkipBuild
if ($LASTEXITCODE -ne 0) {
    throw 'The backend or demo-data setup failed.'
}

Push-Location $backendDirectory
try {
    docker compose --env-file .env restart api-gateway | Out-Host
    if ($LASTEXITCODE -ne 0) {
        throw 'The API gateway could not restart.'
    }
} finally {
    Pop-Location
}

$apiReady = $false
for ($attempt = 1; $attempt -le 30; $attempt++) {
    if (Test-DemoBackend "http://${lanIp}:8080") {
        $apiReady = $true
        break
    }
    Start-Sleep -Seconds 2
}

if (-not $apiReady) {
    Write-Host 'Refreshing the API gateway connection...'
    Push-Location $backendDirectory
    try {
        docker compose --env-file .env restart api-gateway | Out-Host
    } finally {
        Pop-Location
    }

    for ($attempt = 1; $attempt -le 30; $attempt++) {
        if (Test-DemoBackend "http://${lanIp}:8080") {
            $apiReady = $true
            break
        }
        Start-Sleep -Seconds 2
    }
}

if (-not $apiReady) {
    throw "The demo login is not reachable at http://${lanIp}:8080. Check Windows Firewall and make sure the phone and laptop are on the same private network."
}

$metroListener = Get-NetTCPConnection -State Listen -LocalPort 8081 -ErrorAction SilentlyContinue
if ($metroListener) {
    throw 'Port 8081 is already in use. Run .\STOP_EXHIBITION.ps1, then run this launcher again.'
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

Write-Host ''
Write-Host 'Nearbuy is ready.' -ForegroundColor Green
Write-Host 'Buyer:  buyer@nearbuy.test / Nearbuy123!'
Write-Host 'Seller: seller@nearbuy.test / Nearbuy123!'
Write-Host "API:    http://${lanIp}:8080"
Write-Host 'Mailpit: http://localhost:8025'
Write-Host ''
Write-Host 'Keep this window open and scan the QR code with the iPhone Camera or Expo Go.'
Write-Host 'When finished, press Ctrl+C and run .\STOP_EXHIBITION.ps1 from the repository root.'
Write-Host ''

Push-Location $mobileDirectory
try {
    & npx.cmd expo start --clear --lan --go
} finally {
    Pop-Location
}
