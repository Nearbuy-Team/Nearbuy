[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$backendDirectory = Join-Path $PSScriptRoot 'backend'
$mobileDirectory = Join-Path $PSScriptRoot 'nearbuy-mobile'

$listeners = @(Get-NetTCPConnection -State Listen -LocalPort 8081 -ErrorAction SilentlyContinue)
foreach ($processId in @($listeners.OwningProcess | Sort-Object -Unique)) {
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue
    $commandLine = [string]$processInfo.CommandLine

    if ($commandLine -like "*$mobileDirectory*" -or $commandLine -match 'expo(\\|/)bin(\\|/)cli|expo start') {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped the Nearbuy Expo server (process $processId)."
    } else {
        Write-Warning "Port 8081 belongs to another program (process $processId), so it was not stopped."
    }
}

Push-Location $backendDirectory
try {
    docker compose --env-file .env down
    if ($LASTEXITCODE -ne 0) {
        throw 'Docker Compose could not stop the Nearbuy backend.'
    }
} finally {
    Pop-Location
}

Write-Host 'Nearbuy is stopped. PostgreSQL data and uploaded images were preserved.' -ForegroundColor Green
