# Allow configuration of frontend path and port
param(
    [string]$FrontendPath = "D:\Project_References_2.0\DBExportHub\frontend",
    [int]$Port = 3001,
    [switch]$ForceInstall = $false
)

# Set error action preference to stop on any error
$ErrorActionPreference = "Stop"

# Function to check if npm is installed
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check if npm is installed
if (-not (Test-Command npm)) {
    Write-Error "npm is not installed. Please install Node.js which includes npm."
    exit 1
}

# Check if the frontend path exists
if (-not (Test-Path $FrontendPath)) {
    Write-Error "Frontend path '$FrontendPath' does not exist. Please provide the correct path."
    exit 1
}

# Change directory to frontend
Set-Location -Path $FrontendPath

# Function to check package version differences
function Compare-PackageVersions {
    param (
        [string]$PackageName,
        [string]$CurrentVersion,
        [string]$WantedVersion
    )
    
    if (-not $CurrentVersion -or -not $WantedVersion) { return $false }
    
    # Remove any semver symbols (^, ~, etc.) and clean version strings
    $current = $CurrentVersion -replace '[^\d\.].*$'
    $wanted = $WantedVersion -replace '[^\d\.].*$'
    
    try {
        $currentParts = [version]$current
        $wantedParts = [version]$wanted
        return $currentParts -lt $wantedParts
    }
    catch {
        # If version comparison fails, assume update is needed
        return $true
    }
}

# Check if node_modules exists
if (-not (Test-Path "node_modules") -or $ForceInstall) {
    Write-Host "Node modules not found. Installing dependencies..."
    npm install
}
else {
    # Read package.json
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    
    # Check installed versions against package.json
    Write-Host "Checking dependencies..."
    $outdatedInfo = $null
    try {
        $outdatedJson = npm outdated --json 2>$null
        if ($outdatedJson) {
            $outdatedInfo = $outdatedJson | ConvertFrom-Json -AsHashtable
        }
    }
    catch {
        Write-Host "Unable to check for updates. Continuing with existing packages..."
    }

    if ($outdatedInfo -and $outdatedInfo.Count -gt 0) {
        Write-Host "`nThe following packages have updates available:"
        foreach ($package in $outdatedInfo.Keys) {
            $info = $outdatedInfo[$package]
            Write-Host "- $package (Current: $($info.current), Available: $($info.latest))"
        }
        
        $updateChoice = Read-Host "Do you want to update these packages? (y/N)"
        if ($updateChoice -eq "y") {
            Write-Host "Updating packages..."
            npm install
        }
        else {
            Write-Host "Skipping package updates."
        }
    }
    else {
        Write-Host "All dependencies are up to date."
    }
}

# Check if the build is needed
if (-not (Test-Path "dist") -or $ForceInstall) {
    Write-Host "Building the project..."
    npm run build
}

# Function to check if port is available
function Test-PortAvailable {
    param (
        [int]$Port
    )
    try {
        $portCheck = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        return $null -eq $portCheck
    } catch {
        return $true
    }
}

# Find an available port starting from the preferred port
$currentPort = $Port
while (-not (Test-PortAvailable $currentPort)) {
    Write-Host "Port $currentPort is in use, trying next port..."
    $currentPort++
}

# Start the development server
Write-Host "Starting frontend server on port $currentPort..."
$env:VITE_PORT = $currentPort
npm run dev -- --port=$currentPort --host