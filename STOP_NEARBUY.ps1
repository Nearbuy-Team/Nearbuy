[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repositoryDirectory = $PSScriptRoot
$backendDirectory = Join-Path $repositoryDirectory 'backend'
$mobileDirectory = Join-Path $repositoryDirectory 'nearbuy-mobile'
$stopped = 0

$localProcesses = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object {
        $commandLine = [string]$_.CommandLine
        ($_.Name -in @('node.exe', 'java.exe') -and
            ($commandLine -like "*$mobileDirectory*" -or $commandLine -like "*$backendDirectory*")) -or
        ($_.Name -eq 'cloudflared.exe' -and $commandLine -like '*nearbuy-cloudflared*')
    }

foreach ($process in @($localProcesses | Sort-Object ProcessId -Descending)) {
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped $($process.Name) process $($process.ProcessId)."
    $stopped++
}

if (Get-Command docker -ErrorAction SilentlyContinue) {
    & docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0 -and (Test-Path (Join-Path $backendDirectory 'docker-compose.yml'))) {
        Push-Location $backendDirectory
        try {
            & docker compose --env-file .env down --remove-orphans | Out-Host
            if ($LASTEXITCODE -ne 0) {
                Write-Warning 'The Nearbuy Docker stack could not be stopped cleanly.'
            }
        } finally {
            Pop-Location
        }
    }
}

if ($stopped -eq 0) {
    Write-Host 'No local Nearbuy app processes were running.'
}

Write-Host ''
Write-Host 'All local Nearbuy services are stopped.' -ForegroundColor Green
Write-Host 'Render, Paystack, Mailjet, and the hosted database remain online and use no resources on this PC.'
Write-Host 'The Android APK continues to work while the hosted Render services are online.'
