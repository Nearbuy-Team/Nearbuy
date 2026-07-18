param(
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$backendDirectory = Split-Path -Parent $PSScriptRoot

Push-Location $backendDirectory
try {
    docker version --format '{{.Server.Version}}' | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw 'Docker Desktop is not running.'
    }

    if ($SkipBuild) {
        docker compose up -d
    } else {
        docker compose up -d --build
    }
    if ($LASTEXITCODE -ne 0) {
        throw 'Docker Compose could not start the Nearbuy stack.'
    }

    $tablesReady = $false
    for ($attempt = 1; $attempt -le 45; $attempt++) {
        $tableCount = docker compose exec -T postgres psql -U postgres -d nearbuy_db -tAc `
            "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users', 'listings', 'orders', 'wallet_transactions');" 2>$null

        if ($LASTEXITCODE -eq 0 -and $tableCount.Trim() -eq '4') {
            $tablesReady = $true
            break
        }

        Start-Sleep -Seconds 2
    }

    if (-not $tablesReady) {
        throw 'The backend tables were not ready in time. Run docker compose logs to inspect the services.'
    }

    docker compose exec -T postgres psql -U postgres -d nearbuy_db `
        -v ON_ERROR_STOP=1 -f /opt/nearbuy/dev/seed-test-data.sql
    if ($LASTEXITCODE -ne 0) {
        throw 'Seeding failed.'
    }

    Write-Host ''
    Write-Host 'Mock login: buyer@nearbuy.test / Nearbuy123!'
    Write-Host 'Seller login: seller@nearbuy.test / Nearbuy123!'
    Write-Host 'Rental seller: rentals@nearbuy.test / Nearbuy123!'
} finally {
    Pop-Location
}
