# Portable Node.js Environment Setup Script for PowerShell
# This script sets up a completely isolated Node.js environment for the frontend

# Stop on any error
$ErrorActionPreference = "Stop"

Write-Host "Setting up portable Node.js environment..." -ForegroundColor Green

# Set working directory and path variables using relative paths
$RootDir = Join-Path $PSScriptRoot "..\..\"
$PortableNodeDir = Join-Path $RootDir "portable_node"
$DownloadsDir = Join-Path $PSScriptRoot "downloads"
$NodeZip = Join-Path $DownloadsDir "node.zip"

# Create directories if they don't exist
if (-not (Test-Path $PortableNodeDir)) {
    Write-Host "Creating portable Node.js directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $PortableNodeDir -Force | Out-Null
}

if (-not (Test-Path $DownloadsDir)) {
    Write-Host "Creating downloads directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $DownloadsDir -Force | Out-Null
}

# Node.js version to download
$NodeVersion = "18.18.0" # LTS version compatible with Vite v6
$NodeUrl = "https://nodejs.org/dist/v$NodeVersion/node-v$NodeVersion-win-x64.zip"

# Check if Node.js is already downloaded
if (-not (Test-Path $NodeZip)) {
    Write-Host "Downloading Node.js $NodeVersion..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $NodeUrl -OutFile $NodeZip
}

# Extract Node.js if not already extracted
if (-not (Test-Path (Join-Path $PortableNodeDir "node.exe"))) {
    Write-Host "Extracting Node.js..." -ForegroundColor Yellow
    
    # Create a temporary extraction directory
    $TempExtractDir = Join-Path $DownloadsDir "node_extract_temp"
    if (Test-Path $TempExtractDir) {
        Remove-Item -Path $TempExtractDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $TempExtractDir -Force | Out-Null
    
    # Extract the zip file
    Expand-Archive -Path $NodeZip -DestinationPath $TempExtractDir -Force
    
    # Find the extracted directory (should be something like node-v16.20.0-win-x64)
    $ExtractedDir = Get-ChildItem -Path $TempExtractDir -Directory | Select-Object -First 1
    
    if ($ExtractedDir) {
        # Copy contents to portable_node directory
        Copy-Item -Path "$($ExtractedDir.FullName)\*" -Destination $PortableNodeDir -Recurse -Force
        
        # Clean up temporary extraction directory
        Remove-Item -Path $TempExtractDir -Recurse -Force
        
        Write-Host "Node.js extracted successfully to $PortableNodeDir" -ForegroundColor Green
    } else {
        Write-Host "Error: Could not find extracted Node.js directory" -ForegroundColor Red
        exit 1
    }
}

# Create npm runner script
$NpmRunnerScript = @"
# Script to run npm commands using the portable Node.js
param(
    [Parameter(Mandatory=`$true)]
    [string]`$Command,
    
    [Parameter(ValueFromRemainingArguments=`$true)]
    [string[]]`$Arguments
)

# Set PATH to include portable Node.js
`$env:PATH = "`$PSScriptRoot\portable_node;`$env:PATH"

# Change to frontend directory
Set-Location -Path "`$PSScriptRoot\frontend"

# Run the npm command
if (`$Arguments) {
    & npm `$Command `$Arguments
} else {
    & npm `$Command
}
"@

$NpmRunnerPath = Join-Path $RootDir "run_npm.ps1"
Set-Content -Path $NpmRunnerPath -Value $NpmRunnerScript

Write-Host "`nPortable Node.js environment setup complete!" -ForegroundColor Green
Write-Host "`nTo run npm commands with the portable Node.js, use: " -NoNewline
Write-Host ".\run_npm.ps1 <command> [arguments]" -ForegroundColor Cyan
Write-Host "Example: .\run_npm.ps1 install" -ForegroundColor Cyan
Write-Host "Example: .\run_npm.ps1 run dev" -ForegroundColor Cyan
