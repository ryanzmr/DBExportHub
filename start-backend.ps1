# Allow configuration of backend path
param(
    [string]$BackendPath = "D:\Project_References_2.0\DBExportHub\backend",
    [switch]$ForceRecreateVenv = $false
)

# Set error action preference to stop on any error
$ErrorActionPreference = "Stop"

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check Python installation
if (-not (Test-Command python)) {
    Write-Error "Python is not installed. Please install Python 3.8 or higher."
    exit 1
}

# Check if pip is installed
if (-not (Test-Command pip)) {
    Write-Error "pip is not installed. Please install pip."
    exit 1
}

# Change directory to backend folder
if (-not (Test-Path $BackendPath)) {
    Write-Error "Backend path '$BackendPath' does not exist. Please provide the correct path."
    exit 1
}
Set-Location -Path $BackendPath

# Check if virtual environment exists, create if it doesn't
if (-not (Test-Path "venv") -or $ForceRecreateVenv) {
    Write-Host "Creating virtual environment..."
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..."
.\venv\Scripts\Activate.ps1

# Function to check if a package is installed
function Get-PipPackageVersion {
    param (
        [string]$PackageName
    )
    try {
        $output = pip show $PackageName 2>$null
        if ($output) {
            return ($output | Select-String "Version: (.*)").Matches.Groups[1].Value
        }
    }
    catch {
        return $null
    }
    return $null
}

# Function to parse version string
function Compare-Versions {
    param (
        [string]$Version1,
        [string]$Version2
    )
    $v1 = [version]($Version1 -replace '-.*$')
    $v2 = [version]($Version2 -replace '-.*$')
    return $v1.CompareTo($v2)
}

# Read requirements.txt and check each package
Write-Host "Checking dependencies..."
$requirements = Get-Content "requirements.txt"
$packagesToInstall = @()
$packagesToUpdate = @()

foreach ($line in $requirements) {
    if ($line.Trim() -and -not $line.StartsWith("#")) {
        $package = $line -split "[>=<]" | Select-Object -First 1
        $requiredVersion = if ($line -match ">=([0-9\.]+)") { $matches[1] } else { $null }
        
        $installedVersion = Get-PipPackageVersion $package
        
        if (-not $installedVersion) {
            $packagesToInstall += $line
        }
        elseif ($requiredVersion -and (Compare-Versions $installedVersion $requiredVersion) -lt 0) {
            $packagesToUpdate += "$package (Current: $installedVersion, Required: >=$requiredVersion)"
        }
    }
}

# Install missing packages
if ($packagesToInstall.Count -gt 0) {
    Write-Host "`nThe following packages need to be installed:"
    $packagesToInstall | ForEach-Object { Write-Host "- $_" }
    Write-Host "Installing missing packages..."
    $packagesToInstall | ForEach-Object { pip install $_ }
}

# Prompt for updates if needed
if ($packagesToUpdate.Count -gt 0) {
    Write-Host "`nThe following packages have updates available:"
    $packagesToUpdate | ForEach-Object { Write-Host "- $_" }
    $updateChoice = Read-Host "Do you want to update these packages? (y/N)"
    if ($updateChoice -eq "y") {
        Write-Host "Updating packages..."
        pip install -r requirements.txt --upgrade
    }
    else {
        Write-Host "Skipping package updates."
    }
}

if ($packagesToInstall.Count -eq 0 -and $packagesToUpdate.Count -eq 0) {
    Write-Host "All dependencies are up to date."
}

# Create required directories if they don't exist
Write-Host "Creating required directories..."
$dirs = @("logs", "temp", "templates")
foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir
        Write-Host "Created directory: $dir"
    }
}

# Check if .env file exists, create if it doesn't
if (-not (Test-Path ".env")) {
    Write-Host "Creating default .env file..."
    @"
# Server Settings
HOST=0.0.0.0
PORT=8000

# Authentication
SECRET_KEY=your-secure-secret-key-please-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_ALGORITHM=HS256

# CORS Settings
BACKEND_CORS_ORIGINS=http://localhost,http://localhost:3001,http://localhost:5173

# Database Settings
DB_DRIVER=ODBC Driver 17 for SQL Server
DB_FETCH_BATCH_SIZE=250000

# Export/Import Settings
EXPORT_STORED_PROCEDURE=ExportData_New1
EXPORT_VIEW=EXPDATA
IMPORT_STORED_PROCEDURE=ImportJNPTData_New1
IMPORT_VIEW=IMPDATA

# File Paths (relative to backend directory)
TEMP_DIR=./temp
TEMPLATES_DIR=./templates
LOGS_DIR=./logs
EXCEL_TEMPLATE_PATH=./templates/EXDPORT_Tamplate_JNPT.xlsx

# Logging
LOG_LEVEL=INFO
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "Created default .env file. Please update the settings as needed."
}

# Load environment variables from .env file
$envContent = Get-Content .env -ErrorAction SilentlyContinue
foreach ($line in $envContent) {
    if ($line -match '^([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value)
    }
}

# Get server settings from environment variables or use defaults
$serverHost = if ([Environment]::GetEnvironmentVariable('SERVER_HOST')) { 
    [Environment]::GetEnvironmentVariable('SERVER_HOST') 
} else { 
    "0.0.0.0" 
}
$serverPort = if ([Environment]::GetEnvironmentVariable('SERVER_PORT')) { 
    [Environment]::GetEnvironmentVariable('SERVER_PORT') 
} else { 
    "8000" 
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

# Check if port is available
if (-not (Test-PortAvailable $serverPort)) {
    Write-Host "`nPort $serverPort is already in use."
    Write-Host "You have two options:"
    Write-Host "1. Kill the process using port $serverPort with command:"
    Write-Host "   Stop-Process -Id (Get-NetTCPConnection -LocalPort $serverPort).OwningProcess -Force"
    Write-Host "2. Change the port in your .env file"
    
    $response = Read-Host "Press 'k' to kill the process, or Enter to exit"
    
    if ($response -eq 'k') {
        try {
            $process = Get-NetTCPConnection -LocalPort $serverPort -ErrorAction Stop
            Stop-Process -Id $process.OwningProcess -Force
            Write-Host "Process using port $serverPort has been terminated."
            Start-Sleep -Seconds 2  # Wait for port to be released
        } catch {
            Write-Error "Failed to kill process. Please try again or use a different port."
            exit 1
        }
    } else {
        Write-Error "Please update the SERVER_PORT in your .env file and try again."
        exit 1
    }
}

Write-Host "Starting backend server on http://${serverHost}:${serverPort}"
try {
    & uvicorn app.main:app --host $serverHost --port $serverPort --reload
} catch {
    Write-Error "Failed to start server: $_"
    exit 1
}
