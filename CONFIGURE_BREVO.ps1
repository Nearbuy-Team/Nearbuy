[CmdletBinding()]
param(
    [string]$FromEmail,
    [switch]$Restart
)

$ErrorActionPreference = 'Stop'
$backendDirectory = Join-Path $PSScriptRoot 'backend'
$envPath = Join-Path $backendDirectory '.env'
$examplePath = Join-Path $backendDirectory '.env.example'

if (-not (Test-Path -LiteralPath $envPath)) {
    Copy-Item -LiteralPath $examplePath -Destination $envPath
}

if ([string]::IsNullOrWhiteSpace($FromEmail)) {
    $FromEmail = Read-Host 'Enter the exact sender email address verified in Brevo'
}

try {
    $parsedAddress = [System.Net.Mail.MailAddress]::new($FromEmail)
    if ($parsedAddress.Address -ne $FromEmail.Trim()) {
        throw 'Sender must be a plain email address.'
    }
} catch {
    throw 'OTP_FROM must be the exact sender email address verified in Brevo.'
}

$secureKey = Read-Host 'Paste the Brevo API key (input is hidden)' -AsSecureString
$keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
try {
    $apiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer)
    if ([string]::IsNullOrWhiteSpace($apiKey) -or -not $apiKey.StartsWith('xkeysib-')) {
        throw 'The Brevo API key should start with xkeysib-.'
    }

    $content = [System.IO.File]::ReadAllText($envPath)
    $settings = [ordered]@{
        OTP_DELIVERY = 'brevo'
        OTP_FROM = $FromEmail.Trim()
        OTP_FROM_NAME = 'Nearbuy'
        BREVO_API_KEY = $apiKey
        BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'
    }

    foreach ($setting in $settings.GetEnumerator()) {
        $pattern = '(?m)^' + [regex]::Escape($setting.Key) + '=.*$'
        $line = $setting.Key + '=' + $setting.Value
        if ([regex]::IsMatch($content, $pattern)) {
            $content = [regex]::Replace($content, $pattern, $line)
        } else {
            $content = $content.TrimEnd("`r", "`n") + [Environment]::NewLine + $line + [Environment]::NewLine
        }
    }

    $utf8WithoutBom = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($envPath, $content, $utf8WithoutBom)
} finally {
    if ($keyPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer)
    }
    $apiKey = $null
}

Write-Host 'Brevo settings were saved to the ignored backend/.env file.' -ForegroundColor Green
Write-Host 'The API key was not printed and will not be committed by Git.'

if ($Restart) {
    Push-Location $backendDirectory
    try {
        docker compose --env-file .env up -d --build --force-recreate user-service api-gateway | Out-Host
        if ($LASTEXITCODE -ne 0) {
            throw 'Docker could not restart the email service.'
        }
    } finally {
        Pop-Location
    }
    Write-Host 'User service restarted. Register with a new real address to test delivery.' -ForegroundColor Green
} else {
    Write-Host 'Run this command again with -Restart, or restart user-service before testing.'
}
