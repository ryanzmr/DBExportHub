# DBExportHub Backend Startup Script
# This script automatically handles environment setup and activation for the DBExportHub backend

# Stop on any error
$ErrorActionPreference = "Stop"

# Import utility functions
. (Join-Path $PSScriptRoot "scripts\utils.ps1")

# Set working directory and path variables using relative paths
$RootDir = Get-ProjectRoot
$BackendDir = Join-Path $RootDir "backend"
$EnvFile = Join-Path $BackendDir ".env"
$PortableEnvDir = Join-Path $BackendDir "portable_venv"
$PortablePythonDir = Join-Path $BackendDir "portable_python"
$PythonExe = Join-Path $PortableEnvDir "Scripts\python.exe"
$ActivateScript = Join-Path $PortableEnvDir "Scripts\activate.ps1"
$SetupScript = Join-Path $RootDir "scripts\portable_env\setup.ps1"

# Read port configuration from .env file
$BackendPort = Get-EnvValue -filePath $EnvFile -key "SERVER_PORT" -defaultValue "8000"

# Read CORS settings from .env file
$CorsOrigins = Get-EnvValue -filePath $EnvFile -key "BACKEND_CORS_ORIGINS" -defaultValue "http://localhost:3001"

# Display startup information
Write-InfoLog "Starting DBExportHub backend application..."
Write-InfoLog "Backend will be available at: http://localhost:$BackendPort"

# Verify the frontend URL matches the CORS configuration
Write-InfoLog "CORS origins configured: $CorsOrigins"
Write-WarningLog "If you encounter CORS errors, ensure your frontend URL is allowed in backend CORS settings."

# Ensure required directories exist
$TempDirValue = Get-EnvValue -filePath $EnvFile -key "TEMP_DIR" -defaultValue "./temp"
$LogsDirValue = Get-EnvValue -filePath $EnvFile -key "LOGS_DIR" -defaultValue "./logs"
$TemplatesDirValue = Get-EnvValue -filePath $EnvFile -key "TEMPLATES_DIR" -defaultValue "./templates"

# Handle paths - if they start with ./ they are relative to backend dir, otherwise they are absolute
if ($TempDirValue.StartsWith("./")) {
    $TempDir = Join-Path $BackendDir $TempDirValue.TrimStart("./")
} else {
    $TempDir = $TempDirValue
}

if ($LogsDirValue.StartsWith("./")) {
    $LogsDir = Join-Path $BackendDir $LogsDirValue.TrimStart("./")
} else {
    $LogsDir = $LogsDirValue
}

if ($TemplatesDirValue.StartsWith("./")) {
    $TemplatesDir = Join-Path $BackendDir $TemplatesDirValue.TrimStart("./")
} else {
    $TemplatesDir = $TemplatesDirValue
}

Ensure-Directory -path $TempDir
Ensure-Directory -path $LogsDir
Ensure-Directory -path $TemplatesDir

# Check if portable Python environment exists, if not, set it up
if (-not (Test-Path $PythonExe)) {
    Write-WarningLog "Portable Python environment not found. Setting it up now..."
    
    # Run the portable environment setup script
    Write-InfoLog "Running portable Python environment setup script..."
    try {
        & $SetupScript
        
        if (-not (Test-Path $PythonExe)) {
            Write-ErrorLog "Failed to create portable Python environment. Check the setup script for errors."
            exit 1
        }
        
        Write-SuccessLog "Portable Python environment created successfully."
    }
    catch {
        Write-ErrorLog "Error setting up portable Python environment: $_"
        exit 1
    }
}

# Activate the virtual environment and run the application
Write-InfoLog "Starting application with Python environment..."
Write-InfoLog "[ENVIRONMENT] Using portable Python environment: $PortableEnvDir"

$CurrentLocation = Get-Location
Set-Location -Path $BackendDir

try {
    if (Test-IsWindows) {
        & $ActivateScript
        python -m uvicorn app.main:app --host 0.0.0.0 --port $BackendPort --reload
    }
    else {
        & $VenvDir/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port $BackendPort --reload
    }
}
catch {
    Write-ErrorLog "Error running backend application: $_"
}
finally {
    # Return to original directory
    Set-Location -Path $CurrentLocation
    
    # Deactivate virtual environment if it was activated
    if (Test-Path function:deactivate) {
        deactivate
        Write-InfoLog "Virtual environment deactivated."
    }
}
