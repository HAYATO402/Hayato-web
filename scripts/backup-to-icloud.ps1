param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("before", "after")]
    [string]$Stage,

    [string]$ICloudRoot = "$HOME\iCloudDrive"
)

$ErrorActionPreference = "Stop"

# The project folder is one level above the scripts folder.
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ProjectName = Split-Path -Leaf $ProjectRoot

if (-not (Test-Path -LiteralPath $ProjectRoot)) {
    throw "Project folder not found: $ProjectRoot"
}

if (-not (Test-Path -LiteralPath $ICloudRoot)) {
    throw "iCloud Drive not found: $ICloudRoot"
}

$BackupRoot = Join-Path `
    $ICloudRoot `
    "AI-Development\Backups\$ProjectName"

New-Item `
    -ItemType Directory `
    -Force `
    -Path $BackupRoot |
    Out-Null

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$TemporaryDirectory = Join-Path `
    $env:TEMP `
    "$ProjectName-$Stage-$Timestamp"

$ZipPath = Join-Path `
    $BackupRoot `
    "$Stage-$Timestamp.zip"

New-Item `
    -ItemType Directory `
    -Force `
    -Path $TemporaryDirectory |
    Out-Null

try {
    $RobocopyArguments = @(
        $ProjectRoot
        $TemporaryDirectory
        "/E"
        "/XD"
        ".git"
        ".vercel"
        "node_modules"
        ".next"
        "/XF"
        ".env"
        ".env.*"
        "*.tmp"
        "*.temp"
        "/R:1"
        "/W:1"
        "/XJ"
        "/NFL"
        "/NDL"
        "/NJH"
        "/NJS"
        "/NP"
    )

    & robocopy @RobocopyArguments
    $RobocopyExitCode = $LASTEXITCODE

    if ($RobocopyExitCode -ge 8) {
        throw "Robocopy failed. Exit code: $RobocopyExitCode"
    }

    $CopiedFiles = Get-ChildItem `
        -LiteralPath $TemporaryDirectory `
        -Force

    if (-not $CopiedFiles) {
        throw "No files were copied."
    }

    Compress-Archive `
        -Path (Join-Path $TemporaryDirectory "*") `
        -DestinationPath $ZipPath `
        -CompressionLevel Optimal `
        -Force

    Write-Host ""
    Write-Host "iCloud backup created successfully."
    Write-Host "Stage: $Stage"
    Write-Host "Backup path: $ZipPath"
}
finally {
    if (Test-Path -LiteralPath $TemporaryDirectory) {
        Remove-Item `
            -LiteralPath $TemporaryDirectory `
            -Recurse `
            -Force
    }
}