[CmdletBinding()]
param(
    [string]$ApiUrl,
    [switch]$NoWait
)

$ErrorActionPreference = 'Stop'
$mobileDirectory = Join-Path $PSScriptRoot 'nearbuy-mobile'

function Find-LanIPv4 {
    $routes = Get-NetRoute -AddressFamily IPv4 -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue |
        Where-Object { $_.NextHop -ne '0.0.0.0' } |
        Sort-Object @{ Expression = { $_.RouteMetric + $_.InterfaceMetric } }

    foreach ($route in $routes) {
        $address = Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $route.InterfaceIndex -ErrorAction SilentlyContinue |
            Where-Object {
                $_.AddressState -eq 'Preferred' -and
                $_.IPAddress -match '^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)'
            } |
            Select-Object -First 1
        if ($address) {
            return $address.IPAddress
        }
    }
    throw 'No private LAN IPv4 address was found. Pass -ApiUrl with an HTTPS backend URL.'
}

if ([string]::IsNullOrWhiteSpace($ApiUrl)) {
    $ApiUrl = 'http://' + (Find-LanIPv4) + ':8080'
}

try {
    $parsedUrl = [Uri]$ApiUrl
    if (-not $parsedUrl.IsAbsoluteUri -or $parsedUrl.Scheme -notin @('http', 'https')) {
        throw 'invalid'
    }
} catch {
    throw 'ApiUrl must be an absolute http:// or https:// URL.'
}

if ($parsedUrl.Scheme -eq 'http') {
    Write-Warning 'This APK is for LAN exhibition use. It will only work while that backend address is reachable.'
}

Push-Location $mobileDirectory
try {
    & npx.cmd eas-cli@latest whoami | Out-Host
    if ($LASTEXITCODE -ne 0) {
        throw 'Sign in first with: npx.cmd eas-cli@latest login'
    }

    & npx.cmd eas-cli@latest env:create preview --name EXPO_PUBLIC_API_URL --value $ApiUrl `
        --visibility plaintext --scope project --force --non-interactive | Out-Host
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not configure the EAS preview API URL.'
    }

    $buildArguments = @('eas-cli@latest', 'build', '--platform', 'android', '--profile', 'preview', '--non-interactive')
    if ($NoWait) {
        $buildArguments += '--no-wait'
    } else {
        $buildArguments += '--wait'
    }
    & npx.cmd @buildArguments | Out-Host
    if ($LASTEXITCODE -ne 0) {
        throw 'The EAS Android build did not complete successfully.'
    }
} finally {
    Pop-Location
}
