# Portable Python Environment Setup Script for PowerShell
# This script sets up a completely isolated Python environment for the backend

# Stop on any error
$ErrorActionPreference = "Stop"

Write-Host "Setting up portable Python environment..." -ForegroundColor Green

# Set working directory and path variables using relative paths
$RootDir = Join-Path $PSScriptRoot "..\..\"
$BackendDir = Join-Path $RootDir "backend"
$PortablePythonDir = Join-Path $BackendDir "portable_python"
$EnvDir = Join-Path $BackendDir "portable_venv"
$DownloadsDir = Join-Path $PSScriptRoot "downloads"
$PythonZip = Join-Path $DownloadsDir "python311.zip" 
$GetPipPath = Join-Path $DownloadsDir "get-pip.py"

# Create directories if they don't exist
if (-not (Test-Path $PortablePythonDir)) {
    Write-Host "Creating portable Python directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $PortablePythonDir -Force | Out-Null
}

if (-not (Test-Path $DownloadsDir)) {
    Write-Host "Creating downloads directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $DownloadsDir -Force | Out-Null
}

# Check if Python 3.11 embeddable package is already downloaded
$PythonUrl = "https://www.python.org/ftp/python/3.11.8/python-3.11.8-embed-amd64.zip"

if (-not (Test-Path $PythonZip)) {
    Write-Host "Downloading Python 3.11 embeddable package..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $PythonUrl -OutFile $PythonZip
}

# Extract Python if not already extracted
if (-not (Test-Path (Join-Path $PortablePythonDir "python.exe"))) {
    Write-Host "Extracting Python 3.11..." -ForegroundColor Yellow
    Expand-Archive -Path $PythonZip -DestinationPath $PortablePythonDir -Force
    
    # Remove file restriction in python311._pth to enable site-packages
    $PthFile = Join-Path $PortablePythonDir "python311._pth"
    $PthContent = Get-Content -Path $PthFile
    $NewContent = $PthContent -replace '#import site', 'import site'
    $NewContent | Set-Content -Path $PthFile
    
    # Download get-pip.py to install pip in the portable Python
    $GetPipUrl = "https://bootstrap.pypa.io/get-pip.py"
    
    Write-Host "Downloading get-pip.py..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $GetPipUrl -OutFile $GetPipPath
    
    # Install pip in the portable Python
    Write-Host "Installing pip..." -ForegroundColor Yellow
    & (Join-Path $PortablePythonDir "python.exe") $GetPipPath
    
    # Install virtualenv package
    Write-Host "Installing virtualenv package..." -ForegroundColor Yellow
    $PipPath = Join-Path $PortablePythonDir "Scripts\pip.exe"
    & $PipPath install virtualenv
}

# Create a virtual environment using the portable Python
if (-not (Test-Path $EnvDir)) {
    Write-Host "Creating virtual environment using portable Python..." -ForegroundColor Yellow
    $VirtualenvPath = Join-Path $PortablePythonDir "Scripts\virtualenv.exe"
    & $VirtualenvPath $EnvDir
}

# Install requirements in the virtual environment
$PipPath = Join-Path $EnvDir "Scripts\pip.exe"
$RequirementsFile = Join-Path $BackendDir "requirements.txt"

if (Test-Path $PipPath) {
    Write-Host "Installing requirements in the virtual environment..." -ForegroundColor Yellow
    & $PipPath install -r $RequirementsFile
} else {
    Write-Host "Error: pip not found in the virtual environment at $PipPath" -ForegroundColor Red
    Write-Host "Check the virtual environment setup and try again." -ForegroundColor Red
}

Write-Host "`nPortable Python environment setup complete!" -ForegroundColor Green
Write-Host "`nTo activate this environment manually, run: " -NoNewline
Write-Host "$EnvDir\Scripts\activate.ps1" -ForegroundColor Cyan
Write-Host "`nTo run the backend directly, use the start_backend.ps1 script in the root directory." -ForegroundColor Green
