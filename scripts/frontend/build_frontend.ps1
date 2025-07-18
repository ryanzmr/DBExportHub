# Script to build the frontend for production

# Stop on any error
$ErrorActionPreference = "Stop"

# Set working directory and path variables using relative paths
$RootDir = Join-Path $PSScriptRoot "..\..\"
$FrontendDir = Join-Path $RootDir "frontend"
$NodeModulesDir = Join-Path $FrontendDir "node_modules"
$BuildDir = Join-Path $FrontendDir "dist"

# Check if Node.js is installed
try {
    $NodeVersion = node -v
    Write-Host "Node.js $NodeVersion is installed" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed or not in the PATH. Please install Node.js to continue." -ForegroundColor Red
    Write-Host "Download Node.js from: https://nodejs.org/" -ForegroundColor Cyan
    exit 1
}

# Check if frontend dependencies are installed
if (-not (Test-Path $NodeModulesDir)) {
    Write-Host "`nFrontend dependencies not found. Installing now..." -ForegroundColor Yellow
    
    # Change directory to the frontend folder
    $CurrentLocation = Get-Location
    Set-Location -Path $FrontendDir
    
    # Install dependencies
    Write-Host "`nRunning npm install..." -ForegroundColor Cyan
    npm install
    
    # Return to original directory
    Set-Location -Path $CurrentLocation
    
    Write-Host "`nFrontend dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "`nFrontend dependencies already installed" -ForegroundColor Green
}

Write-Host "`nBuilding frontend for production..." -ForegroundColor Cyan

# Change directory to the frontend folder
$CurrentLocation = Get-Location
Set-Location -Path $FrontendDir

# Build the frontend for production
npm run build

# Return to original directory
Set-Location -Path $CurrentLocation

if (Test-Path $BuildDir) {
    Write-Host "`nFrontend built successfully! The production build is in: $BuildDir" -ForegroundColor Green
} else {
    Write-Host "`nError: Frontend build failed. Check for errors above." -ForegroundColor Red
    exit 1
}
