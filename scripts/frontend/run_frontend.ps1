# Frontend Setup and Run Script for PowerShell
# This script sets up and runs the frontend application

# Stop on any error
$ErrorActionPreference = "Stop"

# Import utility functions
. (Join-Path $PSScriptRoot "..\..\scripts\utils.ps1")

# Set working directory and path variables using relative paths
$RootDir = Join-Path $PSScriptRoot "..\..\"
$FrontendDir = Join-Path $RootDir "frontend"
$NodeModulesDir = Join-Path $FrontendDir "node_modules"
$EnvFile = Join-Path $FrontendDir ".env"

# Get frontend port from .env or use default 3000
$FrontendPort = Get-EnvValue -filePath $EnvFile -key "VITE_PORT" -defaultValue "3000"

# Check if Node.js is installed
try {
    $NodeVersion = node -v
    Write-Host "Node.js $NodeVersion is installed" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed or not in the PATH. Please install Node.js to continue." -ForegroundColor Red
    Write-Host "Download Node.js from: https://nodejs.org/" -ForegroundColor Cyan
    exit 1
}

# Check if npm is installed
try {
    $NpmVersion = npm -v
    Write-Host "npm $NpmVersion is installed" -ForegroundColor Green
} catch {
    Write-Host "npm is not installed or not in the PATH. It should be included with Node.js." -ForegroundColor Red
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

Write-Host "`nStarting frontend development server..." -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:$FrontendPort" -ForegroundColor Cyan

# Change directory to the frontend folder
$CurrentLocation = Get-Location
Set-Location -Path $FrontendDir

# Run the frontend in development mode
npm run dev

# Return to original directory when npm run dev is terminated
Set-Location -Path $CurrentLocation

Write-Host "`nFrontend server has been stopped" -ForegroundColor Yellow
