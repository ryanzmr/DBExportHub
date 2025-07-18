# DBExportHub Utility Functions
# This file contains utility functions used by various scripts in the DBExportHub project

# Function to read values from .env files
function Get-EnvValue {
    param (
        [string]$filePath,
        [string]$key,
        [string]$defaultValue
    )
    
    if (Test-Path $filePath) {
        $content = Get-Content $filePath
        
        foreach ($line in $content) {
            if ($line -match "^\s*$key=(.*)") {
                $value = $matches[1].Trim('"').Trim("'")
                return $value
            }
        }
    }
    
    return $defaultValue
}

# Function to check if a command exists
function Test-CommandExists {
    param (
        [string]$command
    )
    
    $exists = $null
    try {
        if (Get-Command $command -ErrorAction Stop) {
            $exists = $true
        }
    }
    catch {
        $exists = $false
    }
    return $exists
}

# Function to determine if we're running on Windows
function Test-IsWindows {
    if ($PSVersionTable.PSVersion.Major -ge 6) {
        # PowerShell Core 6+ has built-in $IsWindows variable
        return $IsWindows
    }
    else {
        # For Windows PowerShell 5.1 and below
        return $true
    }
}

# Function to determine if we're running on Linux
function Test-IsLinux {
    if ($PSVersionTable.PSVersion.Major -ge 6) {
        # PowerShell Core 6+ has built-in $IsLinux variable
        return $IsLinux
    }
    else {
        # For Windows PowerShell 5.1 and below
        return $false
    }
}

# Function to determine if we're running on macOS
function Test-IsMacOS {
    if ($PSVersionTable.PSVersion.Major -ge 6) {
        # PowerShell Core 6+ has built-in $IsMacOS variable
        return $IsMacOS
    }
    else {
        # For Windows PowerShell 5.1 and below
        return $false
    }
}

# Function to create a directory if it doesn't exist
function Ensure-Directory {
    param (
        [string]$path
    )
    
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Host "Created directory: $path" -ForegroundColor Green
    }
}

# Function to log messages with timestamp and color
function Write-LogMessage {
    param (
        [string]$message,
        [string]$level = "INFO",
        [string]$foregroundColor = "White"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $levelPadded = $level.PadRight(5)
    Write-Host "[$timestamp] [$levelPadded] $message" -ForegroundColor $foregroundColor
}

# Function to log info messages
function Write-InfoLog {
    param (
        [string]$message
    )
    
    Write-LogMessage -message $message -level "INFO" -foregroundColor "Cyan"
}

# Function to log success messages
function Write-SuccessLog {
    param (
        [string]$message
    )
    
    Write-LogMessage -message $message -level "OK" -foregroundColor "Green"
}

# Function to log warning messages
function Write-WarningLog {
    param (
        [string]$message
    )
    
    Write-LogMessage -message $message -level "WARN" -foregroundColor "Yellow"
}

# Function to log error messages
function Write-ErrorLog {
    param (
        [string]$message
    )
    
    Write-LogMessage -message $message -level "ERROR" -foregroundColor "Red"
}

# Function to get the root directory of the project
function Get-ProjectRoot {
    return (Join-Path $PSScriptRoot "..")
}
