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

# First check for missing dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "Node modules not found. Installing dependencies..."
    npm install
}

# Check for outdated packages
Write-Host "Checking package status..."
$outdatedInfo = $null
$missingPackages = @()
$outdatedPackages = @()

try {
    # Check if any packages are missing or outdated
    Write-Host "Running 'npm outdated' to check package versions..."
    $outdatedJson = npm outdated --json 2>$null
    if ($outdatedJson -and $outdatedJson.Trim() -ne "{}") {
        $outdatedInfo = $outdatedJson | ConvertFrom-Json -AsHashtable
        
        # Separate missing and outdated packages
        foreach ($package in $outdatedInfo.Keys) {
            $info = $outdatedInfo[$package]
            if (-not $info.current) {
                $missingPackages += $package
            } else {
                $outdatedPackages += @{
                    Name = $package
                    Current = $info.current
                    Latest = $info.latest
                }
            }
        }
        
        # Install missing packages automatically
        if ($missingPackages.Count -gt 0) {
            Write-Host "`nInstalling missing packages: $($missingPackages -join ', ')"
            npm install $($missingPackages -join ' ')
        }
        
        # Prompt for updates to existing packages
        if ($outdatedPackages.Count -gt 0) {
            Write-Host "`nThe following packages have updates available:"
            foreach ($package in $outdatedPackages) {
                Write-Host "- $($package.Name) (Current: $($package.Current), Available: $($package.Latest))"
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
    } else {
        Write-Host "All packages are up to date."
    }
}
catch {
    Write-Host "Note: Unable to check for package updates. This is normal if npm is not initialized or if there are no packages installed yet."
    Write-Host "The script will continue with installation if needed."
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

# Check if default port is in use
if (-not (Test-PortAvailable $Port)) {
    Write-Host "`nPort $Port is already in use."
    
    # Try to find the next available port
    $currentPort = $Port
    $maxPortToTry = $Port + 10  # Try up to 10 ports after the specified one
    
    while ($currentPort -lt $maxPortToTry) {
        $currentPort++
        if (Test-PortAvailable $currentPort) {
            Write-Host "Switching to available port $currentPort"
            break
        }
    }
    
    if ($currentPort -ge $maxPortToTry) {
        Write-Host "Could not find an available port between $Port and $($maxPortToTry-1). Please specify a different port manually."
        exit 1
    }
} else {
    $currentPort = $Port
}

# Start the development server
Write-Host "`nStarting frontend server on port $currentPort..."
$env:VITE_PORT = $currentPort
npm run dev
