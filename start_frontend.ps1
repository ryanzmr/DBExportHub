# DBExportHub Frontend Startup Script
# This script automatically handles dependency installation and starts the development server
# using Node.js for the React frontend

param (
    [switch]$ForcePortableNode = $false
)

# Stop on any error
$ErrorActionPreference = "Stop"

# Import utility functions
. (Join-Path $PSScriptRoot "scripts\utils.ps1")

# Set working directory and path variables using relative paths
$RootDir = Get-ProjectRoot
$FrontendDir = Join-Path $RootDir "frontend"
$NodeModulesDir = Join-Path $FrontendDir "node_modules"
$EnvFile = Join-Path $FrontendDir ".env"

# Read port configuration from .env file
$FrontendPort = Get-EnvValue -filePath $EnvFile -key "VITE_PORT" -defaultValue "3001"

# Read API URL from .env file
$ApiUrl = Get-EnvValue -filePath $EnvFile -key "VITE_API_URL" -defaultValue "http://localhost:8000"

# Display startup information
Write-InfoLog "Starting DBExportHub frontend application..."
Write-InfoLog "Frontend will be available at: http://localhost:$FrontendPort"
Write-InfoLog "API URL is configured as: $ApiUrl"

# Set up Node.js environment
$PortableNodeDir = Join-Path $RootDir "portable_node"
$PortableNodeSetupScript = Join-Path $RootDir "scripts\portable_node\setup.ps1"

# Always use portable Node.js only
Write-InfoLog "[ENVIRONMENT] Using portable Node.js installation only"

# Check if portable Node.js exists
if (Test-Path (Join-Path $PortableNodeDir "node.exe")) {
    Write-InfoLog "[ENVIRONMENT] Using existing portable Node.js installation"
    $env:PATH = "$PortableNodeDir;$env:PATH"
} else {
    # Try to set up portable Node.js
    Write-WarningLog "Portable Node.js not found. Setting it up now..."
    
    # Ensure the portable_node scripts directory exists
    Ensure-Directory -path (Join-Path $RootDir "scripts\portable_node")
    
    # Check if portable Node.js setup script exists
    if (Test-Path $PortableNodeSetupScript) {
        Write-InfoLog "Running portable Node.js setup script..."
        try {
            & $PortableNodeSetupScript
            
            # Verify portable Node.js was set up correctly
            if (Test-Path (Join-Path $PortableNodeDir "node.exe")) {
                Write-SuccessLog "Portable Node.js set up successfully."
                $env:PATH = "$PortableNodeDir;$env:PATH"
            } else {
                Write-ErrorLog "Failed to set up portable Node.js. Check the setup script."
                exit 1
            }
        } catch {
            Write-ErrorLog "Error setting up portable Node.js: $_"
            exit 1
        }
    } else {
        Write-ErrorLog "Portable Node.js setup script not found at: $PortableNodeSetupScript"
        exit 1
    }
}

# Verify Node.js is working
try {
    $NodeVersion = node -v
    Write-SuccessLog "Node.js $NodeVersion is ready"
    
    # Display environment information
    Write-InfoLog "[ENVIRONMENT] Using portable Node.js from: $PortableNodeDir"
    
    $NpmVersion = npm -v
    Write-SuccessLog "npm $NpmVersion is ready"
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

# Start the frontend development server
Write-InfoLog "Starting frontend development server..."

# Change directory to the frontend folder
$CurrentLocation = Get-Location
Set-Location -Path $FrontendDir

try {
    # Run the frontend in development mode
    npm run dev
}
catch {
    Write-ErrorLog "Error running frontend development server: $_"
}
finally {
    # Return to original directory when npm run dev is terminated
    Set-Location -Path $CurrentLocation
    Write-InfoLog "Frontend server has been stopped."
}
