# Activate the portable virtual environment for manual development work

# Set working directory and path variables using relative paths
$RootDir = Join-Path $PSScriptRoot "..\..\"
$BackendDir = Join-Path $RootDir "backend"
$ActivateScript = Join-Path $BackendDir "portable_venv\Scripts\activate.ps1"

# Check if portable environment exists
if (-not (Test-Path $ActivateScript)) {
    Write-Host "Portable environment not found. Setting it up first..." -ForegroundColor Yellow
    & (Join-Path $PSScriptRoot "setup.ps1")
}

& $ActivateScript
Write-Host "`nPortable Python environment activated." -ForegroundColor Green
Write-Host "Type 'deactivate' when you're done.`n" -ForegroundColor Cyan
