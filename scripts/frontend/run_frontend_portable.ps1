# Frontend Setup and Run Script with Portable Node.js for PowerShell
# This script sets up and runs the frontend application using a portable Node.js installation

# Stop on any error
$ErrorActionPreference = "Stop"

# Import utility functions
. (Join-Path $PSScriptRoot "..\..\scripts\utils.ps1")

# Set working directory and path variables using relative paths
$RootDir = Join-Path $PSScriptRoot "..\..\"
$FrontendDir = Join-Path $RootDir "frontend"
$NodeModulesDir = Join-Path $FrontendDir "node_modules"
$EnvFile = Join-Path $FrontendDir ".env"
$PortableNodeDir = Join-Path $RootDir "portable_node"
$PortableNodeSetupScript = Join-Path $RootDir "scripts\portable_node\setup.ps1"

# Get frontend port from .env or use default 3000
$FrontendPort = Get-EnvValue -filePath $EnvFile -key "VITE_PORT" -defaultValue "3000"

# Check if portable Node.js is installed
if (-not (Test-Path (Join-Path $PortableNodeDir "node.exe"))) {
    Write-Host "Portable Node.js not found. Setting it up now..." -ForegroundColor Yellow
    
    # Ensure the portable_node directory exists
    if (-not (Test-Path (Join-Path $RootDir "scripts\portable_node"))) {
        New-Item -ItemType Directory -Path (Join-Path $RootDir "scripts\portable_node") -Force | Out-Null
    }
    
    # Run the setup script
    & $PortableNodeSetupScript
}

# Add portable Node.js to PATH for this session
$env:PATH = "$PortableNodeDir;$env:PATH"

# Verify portable Node.js is working
try {
    $NodeVersion = node -v
    Write-Host "Portable Node.js $NodeVersion is ready" -ForegroundColor Green
} catch {
    Write-Host "Error: Portable Node.js setup failed. Please check the setup script." -ForegroundColor Red
    exit 1
}

# Check if npm is available with portable Node.js
try {
    $NpmVersion = npm -v
    Write-Host "npm $NpmVersion is ready" -ForegroundColor Green
} catch {
    Write-Host "Error: npm not found in portable Node.js. Please check the setup script." -ForegroundColor Red
    exit 1
}

# Check if frontend dependencies are installed
if (-not (Test-Path $NodeModulesDir)) {
    Write-Host "`nFrontend dependencies not found. Installing now..." -ForegroundColor Yellow
    
    # Change directory to the frontend folder
    $CurrentLocation = Get-Location
    Set-Location -Path $FrontendDir
    
    # Install dependencies using portable Node.js
    Write-Host "`nRunning npm install with portable Node.js..." -ForegroundColor Cyan
    npm install
    
    # Return to original directory
    Set-Location -Path $CurrentLocation
    
    Write-Host "`nFrontend dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "`nFrontend dependencies already installed" -ForegroundColor Green
}

Write-Host "`nStarting frontend development server with portable Node.js..." -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:$FrontendPort" -ForegroundColor Cyan

# Change directory to the frontend folder
$CurrentLocation = Get-Location
Set-Location -Path $FrontendDir

# Run the frontend in development mode using portable Node.js
npm run dev

# Return to original directory when npm run dev is terminated
Set-Location -Path $CurrentLocation

Write-Host "`nFrontend server has been stopped" -ForegroundColor Yellow
