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
    $FromEmail = Read-Host 'Enter the exact sender email address verified in Mailjet'
}

try {
    $parsedAddress = [System.Net.Mail.MailAddress]::new($FromEmail)
    if ($parsedAddress.Address -ne $FromEmail.Trim()) {
        throw 'Sender must be a plain email address.'
    }
} catch {
    throw 'OTP_FROM must be the exact sender email address verified in Mailjet.'
}

$secureApiKey = Read-Host 'Paste the Mailjet API key (input is hidden)' -AsSecureString
$secureSecretKey = Read-Host 'Paste the Mailjet secret key (input is hidden)' -AsSecureString
$apiKeyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureApiKey)
$secretKeyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureSecretKey)

try {
    $apiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($apiKeyPointer)
    $secretKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretKeyPointer)
    if ([string]::IsNullOrWhiteSpace($apiKey) -or [string]::IsNullOrWhiteSpace($secretKey)) {
        throw 'Both Mailjet keys are required.'
    }

    $content = [System.IO.File]::ReadAllText($envPath)
    $settings = [ordered]@{
        OTP_DELIVERY = 'mailjet'
        OTP_FROM = $FromEmail.Trim()
        OTP_FROM_NAME = 'Nearbuy'
        MAILJET_API_KEY = $apiKey
        MAILJET_SECRET_KEY = $secretKey
        MAILJET_API_URL = 'https://api.mailjet.com/v3.1/send'
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
    if ($apiKeyPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($apiKeyPointer)
    }
    if ($secretKeyPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretKeyPointer)
    }
    $apiKey = $null
    $secretKey = $null
}

Write-Host 'Mailjet settings were saved to the ignored backend/.env file.' -ForegroundColor Green
Write-Host 'The API keys were not printed and will not be committed by Git.'

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
