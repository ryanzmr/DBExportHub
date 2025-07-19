# DBExportHub All-in-One Startup Script
# This script starts both the frontend and backend applications in separate windows

# Stop on any error
$ErrorActionPreference = "Stop"

# Import utility functions
. (Join-Path $PSScriptRoot "scripts\utils.ps1")

# Set working directory and path variables using relative paths
$RootDir = Get-ProjectRoot
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$BackendEnvFile = Join-Path $BackendDir ".env"
$FrontendEnvFile = Join-Path $FrontendDir ".env"

# Read port configuration from .env files
$BackendPort = Get-EnvValue -filePath $BackendEnvFile -key "SERVER_PORT" -defaultValue "8000"
$FrontendPort = Get-EnvValue -filePath $FrontendEnvFile -key "VITE_PORT" -defaultValue "3001"

# Display startup information
Write-InfoLog "Starting DBExportHub - both frontend and backend applications..."
Write-InfoLog "Backend will be available at: http://localhost:$BackendPort"
Write-InfoLog "Frontend will be available at: http://localhost:$FrontendPort"

# Check if the API URL in frontend .env matches the backend port
$ApiUrl = Get-EnvValue -filePath $FrontendEnvFile -key "VITE_API_URL" -defaultValue "http://localhost:8000"
$ExpectedApiUrl = "http://localhost:$BackendPort"

if ($ApiUrl -ne $ExpectedApiUrl) {
    Write-WarningLog "Frontend API URL ($ApiUrl) does not match backend URL ($ExpectedApiUrl)."
    Write-WarningLog "This may cause connection issues. Consider updating your frontend .env file."
}

# Check if backend port is in CORS origins
$CorsOrigins = Get-EnvValue -filePath $BackendEnvFile -key "BACKEND_CORS_ORIGINS" -defaultValue ""
$FrontendUrl = "http://localhost:$FrontendPort"

if (-not $CorsOrigins.Contains($FrontendUrl)) {
    Write-WarningLog "Frontend URL ($FrontendUrl) is not in backend CORS origins ($CorsOrigins)."
    Write-WarningLog "This may cause CORS issues. Consider updating your backend .env file."
}

# Ensure required directories exist
# Helper function to resolve directory paths (handles both absolute and relative paths)
function Resolve-DirectoryPath {
    param(
        [string]$basePath,
        [string]$envPath,
        [string]$defaultPath
    )
    
    $path = Get-EnvValue -filePath $BackendEnvFile -key $envPath -defaultValue $defaultPath
    
    # If path is absolute (starts with drive letter or UNC path), use it as-is
    if ([System.IO.Path]::IsPathRooted($path)) {
        return $path
    }
    
    # If path is relative, combine with base path
    return Join-Path $basePath $path.TrimStart("./")
}

$TempDir = Resolve-DirectoryPath -basePath $BackendDir -envPath "TEMP_DIR" -defaultPath "./temp"
$LogsDir = Resolve-DirectoryPath -basePath $BackendDir -envPath "LOGS_DIR" -defaultPath "./logs"
$TemplatesDir = Resolve-DirectoryPath -basePath $BackendDir -envPath "TEMPLATES_DIR" -defaultPath "./templates"

Ensure-Directory -path $TempDir
Ensure-Directory -path $LogsDir
Ensure-Directory -path $TemplatesDir

# Start backend in a new window
Write-InfoLog "Starting backend in a new window..."

# Use PowerShell Core if available, otherwise use Windows PowerShell
$PowerShellExe = "powershell"
if (Test-CommandExists "pwsh") {
    $PowerShellExe = "pwsh"
}

Start-Process $PowerShellExe -ArgumentList "-NoExit", "-File", "`"$PSScriptRoot\start_backend.ps1`""

# Give the backend a moment to start before launching the frontend
Write-InfoLog "Waiting for backend to initialize..."
Start-Sleep -Seconds 3

# Start frontend in this window
Write-InfoLog "Starting frontend in this window..."
& "$PSScriptRoot\start_frontend.ps1"
