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
Set-Location -Path $PSScriptRoot\backend

# Allow for force recreation of virtual environment
param(
    [switch]$ForceRecreateVenv = $false
)

# Check if virtual environment exists, create if it doesn't
if (-not (Test-Path "venv") -or $ForceRecreateVenv) {
    Write-Host "Creating virtual environment..."
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..."
.\venv\Scripts\Activate.ps1

# Install/Update dependencies
Write-Host "Installing/Updating dependencies..."
pip install -r requirements.txt

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
# Authentication
SECRET_KEY=your-secure-secret-key-please-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS Settings
BACKEND_CORS_ORIGINS=http://localhost,http://localhost:3000,http://localhost:5173

# Database Settings
DB_DRIVER=ODBC Driver 17 for SQL Server

# File Paths
TEMP_DIR=./temp
TEMPLATES_DIR=./templates
LOGS_DIR=./logs
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "Created default .env file. Please update the settings as needed."
}

# Check if port 8000 is available
try {
    $portCheck = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
    if ($portCheck) {
        Write-Error "Port 8000 is already in use. Please free up the port or use a different port."
        exit 1
    }
} catch {
    # If the command fails, it likely means the port is free
}

# Start the backend server
Write-Host "Starting backend server on http://localhost:8000"
try {
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
} catch {
    Write-Error "Failed to start server: $_"
    exit 1
}
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
