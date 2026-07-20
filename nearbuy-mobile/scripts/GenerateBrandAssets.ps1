param(
    [string]$Master = (Join-Path $PSScriptRoot '..\assets\brand-icon-master.png')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$assets = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\assets'))
$source = [Drawing.Image]::FromFile([IO.Path]::GetFullPath($Master))

function Write-BrandImage {
    param(
        [string]$Path,
        [int]$Width,
        [int]$Height,
        [int]$LogoSize
    )

    $bitmap = [Drawing.Bitmap]::new($Width, $Height, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.Clear([Drawing.Color]::Black)
        $graphics.CompositingQuality = [Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::HighQuality
        $x = [int](($Width - $LogoSize) / 2)
        $y = [int](($Height - $LogoSize) / 2)
        $graphics.DrawImage($source, $x, $y, $LogoSize, $LogoSize)
        $bitmap.Save($Path, [Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $graphics.Dispose()
        $bitmap.Dispose()
    }
}

try {
    Write-BrandImage (Join-Path $assets 'icon.png') 1024 1024 1024
    Write-BrandImage (Join-Path $assets 'adaptive-icon.png') 1024 1024 1024
    Write-BrandImage (Join-Path $assets 'favicon.png') 48 48 48
    Write-BrandImage (Join-Path $assets 'splash.png') 1284 2778 760
} finally {
    $source.Dispose()
}

Write-Output 'Nearbuy icon, adaptive icon, favicon, and splash assets generated.'
