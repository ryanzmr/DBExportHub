# Allow configuration of frontend path and port
param(
    [string]$FrontendPath = (Join-Path $PSScriptRoot "frontend"),
    [int]$Port = 3001,
    [switch]$ForceInstall = $false
)

# Set error action preference to stop on any error
$ErrorActionPreference = "Stop"

# Function for colored output
function Write-ColorOutput {
    param (
        [Parameter(Mandatory = $true)]
        [string]$Message,
        
        [Parameter(Mandatory = $false)]
        [string]$ForegroundColor = "White"
    )
    
    Write-Host $Message -ForegroundColor $ForegroundColor
}

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check if npm is installed
if (-not (Test-Command npm)) {
    Write-ColorOutput "ERROR: npm is not installed. Please install Node.js which includes npm." -ForegroundColor Red
    exit 1
}

# Check if the frontend path exists
if (-not (Test-Path $FrontendPath)) {
    Write-ColorOutput "ERROR: Frontend path '$FrontendPath' does not exist. Please provide the correct path." -ForegroundColor Red
    exit 1
}

# Change directory to frontend
Set-Location -Path $FrontendPath
Write-ColorOutput "Navigated to frontend directory: $FrontendPath" -ForegroundColor Cyan

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
    Write-ColorOutput "Node modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "ERROR: npm install failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
    Write-ColorOutput "Dependencies installed successfully" -ForegroundColor Green
}

# Check for outdated packages
Write-ColorOutput "Checking package status..." -ForegroundColor Cyan
$outdatedInfo = $null
$missingPackages = @()
$outdatedPackages = @()

try {
    # Check if any packages are missing or outdated
    Write-ColorOutput "Running 'npm outdated' to check package versions..." -ForegroundColor Cyan
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
            Write-ColorOutput "`nInstalling missing packages: $($missingPackages -join ', ')" -ForegroundColor Yellow
            npm install $($missingPackages -join ' ')
            if ($LASTEXITCODE -ne 0) {
                Write-ColorOutput "WARNING: Some packages failed to install. The application may not work correctly." -ForegroundColor Yellow
            } else {
                Write-ColorOutput "Missing packages installed successfully." -ForegroundColor Green
            }
        }
        
        # Prompt for updates to existing packages
        if ($outdatedPackages.Count -gt 0) {
            Write-ColorOutput "`nThe following packages have updates available:" -ForegroundColor Yellow
            foreach ($package in $outdatedPackages) {
                Write-ColorOutput "- $($package.Name) (Current: $($package.Current), Available: $($package.Latest))" -ForegroundColor Yellow
            }
            
            $updateChoice = Read-Host "Do you want to update these packages? (y/N)"
            if ($updateChoice -eq "y") {
                Write-ColorOutput "Updating packages..." -ForegroundColor Cyan
                npm install
                if ($LASTEXITCODE -ne 0) {
                    Write-ColorOutput "WARNING: Some packages failed to update. The application may still work with older versions." -ForegroundColor Yellow
                } else {
                    Write-ColorOutput "Packages updated successfully." -ForegroundColor Green
                }
            }
            else {
                Write-ColorOutput "Skipping package updates." -ForegroundColor Cyan
            }
        }
    } else {
        Write-ColorOutput "All packages are up to date." -ForegroundColor Green
    }
}
catch {
    Write-ColorOutput "Note: Unable to check for package updates. This is normal if npm is not initialized or if there are no packages installed yet." -ForegroundColor Yellow
    Write-ColorOutput "The script will continue with installation if needed." -ForegroundColor Cyan
}

# Check if the build is needed
if (-not (Test-Path "dist") -or $ForceInstall) {
    Write-ColorOutput "Building the project..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "ERROR: Build failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
    Write-ColorOutput "Build completed successfully" -ForegroundColor Green
}

# Function to get process info using a port
function Get-ProcessInfoByPort {
    param (
        [int]$Port
    )
    
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($connection) {
            $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
            return @{
                InUse = $true
                ProcessId = $connection.OwningProcess
                ProcessName = if ($process) { $process.ProcessName } else { "Unknown" }
                CommandLine = if ($process) { (Get-WmiObject -Class Win32_Process -Filter "ProcessId = $($connection.OwningProcess)").CommandLine } else { "Unknown" }
            }
        }
        return @{ InUse = $false }
    } catch {
        Write-ColorOutput "Error checking port: $_" -ForegroundColor Red
        return @{ InUse = $false }
    }
}

# Function to terminate a process
function Stop-ProcessByPort {
    param (
        [int]$ProcessId
    )
    
    try {
        $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
        if ($process) {
            Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
            Start-Sleep -Milliseconds 500
            $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
            if ($process) {
                # Fallback to taskkill
                taskkill /F /PID $ProcessId 2>$null
                Start-Sleep -Milliseconds 500
                $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
            }
            return ($null -eq $process)
        }
        return $false
    } catch {
        Write-ColorOutput "Error stopping process: $_" -ForegroundColor Red
        return $false
    }
}

# Check if port is in use
$portInfo = Get-ProcessInfoByPort -Port $Port
if ($portInfo.InUse) {
    Write-ColorOutput "`nPort $Port is already in use!" -ForegroundColor Yellow
    Write-ColorOutput "Process using the port: $($portInfo.ProcessId) ($($portInfo.ProcessName))" -ForegroundColor Yellow
    
    # Determine if it's likely related to the app
    $isLikelyApp = $portInfo.ProcessName -like "*node*" -or $portInfo.CommandLine -like "*vite*" -or $portInfo.CommandLine -like "*npm*" -or $portInfo.CommandLine -like "*frontend*"
    
    if ($isLikelyApp) {
        Write-ColorOutput "This appears to be a related application process." -ForegroundColor Cyan
        $killChoice = Read-Host "Do you want to terminate this process and start a new instance? (y/N)"
        
        if ($killChoice -eq "y") {
            Write-ColorOutput "Attempting to terminate process $($portInfo.ProcessId)..." -ForegroundColor Cyan
            $killed = Stop-ProcessByPort -ProcessId $portInfo.ProcessId
            
            if ($killed) {
                Write-ColorOutput "Process terminated successfully." -ForegroundColor Green
            } else {
                Write-ColorOutput "Failed to terminate the process. Please close it manually." -ForegroundColor Red
                exit 1
            }
        } else {
            Write-ColorOutput "Exiting as requested. Please free up port $Port and try again." -ForegroundColor Cyan
            exit 0
        }
    } else {
        Write-ColorOutput "This appears to be an unrelated process." -ForegroundColor Yellow
        Write-ColorOutput "For security reasons, the script will not attempt to terminate it." -ForegroundColor Yellow
        Write-ColorOutput "Please free up port $Port manually and try again." -ForegroundColor Red
        exit 1
    }
}

# Start the development server
Write-ColorOutput "`nStarting frontend server on port $Port..." -ForegroundColor Green
$env:VITE_PORT = $Port
npm run dev
