# DBExportHub Frontend Build Script
# This script builds the React frontend for production deployment

# Stop on any error
$ErrorActionPreference = "Stop"

# Import utility functions
. (Join-Path $PSScriptRoot "scripts\utils.ps1")

# Set working directory and path variables using relative paths
$RootDir = Get-ProjectRoot
$FrontendDir = Join-Path $RootDir "frontend"
$NodeModulesDir = Join-Path $FrontendDir "node_modules"
$DistDir = Join-Path $FrontendDir "dist"

# Display startup information
Write-InfoLog "Building DBExportHub frontend for production..."

# Check if Node.js is installed
$UsePortableNode = $false
$PortableNodeDir = Join-Path $RootDir "portable_node"

if (-not (Test-CommandExists "node")) {
    Write-WarningLog "Node.js not found in PATH. Checking for portable Node.js..."
    
    if (Test-Path (Join-Path $PortableNodeDir "node.exe")) {
        Write-InfoLog "Using portable Node.js installation."
        $UsePortableNode = $true
        $env:PATH = "$PortableNodeDir;$env:PATH"
    }
    else {
        Write-ErrorLog "Node.js is not installed and portable Node.js not found."
        Write-ErrorLog "Please install Node.js (v18+) or set up portable Node.js."
        exit 1
    }
}

# Verify Node.js is working
try {
    $NodeVersion = node -v
    Write-SuccessLog "Node.js $NodeVersion is ready"
} catch {
    Write-ErrorLog "Error verifying Node.js installation: $_"
    exit 1
}

# Check if frontend dependencies are installed
if (-not (Test-Path $NodeModulesDir)) {
    Write-WarningLog "Frontend dependencies not found. Installing now..."
    
    # Change directory to the frontend folder
    $CurrentLocation = Get-Location
    Set-Location -Path $FrontendDir
    
    try {
        # Install dependencies
        Write-InfoLog "Running npm install..."
        npm install
        Write-SuccessLog "Frontend dependencies installed successfully!"
    }
    catch {
        Write-ErrorLog "Error installing frontend dependencies: $_"
        Set-Location -Path $CurrentLocation
        exit 1
    }
    
    # Return to original directory
    Set-Location -Path $CurrentLocation
} else {
    Write-InfoLog "Frontend dependencies already installed."
}

# Clean previous build if it exists
if (Test-Path $DistDir) {
    Write-InfoLog "Cleaning previous build..."
    Remove-Item -Recurse -Force $DistDir
    Write-SuccessLog "Previous build cleaned successfully."
}

# Build the frontend
Write-InfoLog "Building frontend for production..."

# Change directory to the frontend folder
$CurrentLocation = Get-Location
Set-Location -Path $FrontendDir

try {
    # Run the build command
    npm run build
    
    if (Test-Path $DistDir) {
        Write-SuccessLog "Frontend built successfully!"
        Write-InfoLog "Production files are available in: $DistDir"
    } else {
        Write-ErrorLog "Build completed but dist directory not found."
        exit 1
    }
}
catch {
    Write-ErrorLog "Error building frontend: $_"
    exit 1
}
finally {
    # Return to original directory
    Set-Location -Path $CurrentLocation
}
