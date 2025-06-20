# Allow configuration of backend path
param(
    [string]$BackendPath = (Join-Path $PSScriptRoot "backend"),
    [switch]$ForceRecreateVenv = $false
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

# Check Python installation
if (-not (Test-Command python)) {
    Write-ColorOutput "ERROR: Python is not installed. Please install Python 3.8 or higher." -ForegroundColor Red
    exit 1
}

# Check if pip is installed
if (-not (Test-Command pip)) {
    Write-ColorOutput "ERROR: pip is not installed. Please install pip." -ForegroundColor Red
    exit 1
}

# Change directory to backend folder
if (-not (Test-Path $BackendPath)) {
    Write-ColorOutput "ERROR: Backend path '$BackendPath' does not exist. Please provide the correct path." -ForegroundColor Red
    exit 1
}
Set-Location -Path $BackendPath
Write-ColorOutput "Navigated to backend directory: $BackendPath" -ForegroundColor Cyan

# Check if virtual environment exists, create if it doesn't
if (-not (Test-Path "venv") -or $ForceRecreateVenv) {
    Write-ColorOutput "Creating virtual environment..." -ForegroundColor Cyan
    python -m venv venv
    if (-not $?) {
        Write-ColorOutput "ERROR: Failed to create virtual environment. Please check your Python installation." -ForegroundColor Red
        exit 1
    }
    Write-ColorOutput "Virtual environment created successfully." -ForegroundColor Green
}

# Try to activate virtual environment
Write-ColorOutput "Activating virtual environment..." -ForegroundColor Cyan
try {
    if (Test-Path ".\venv\Scripts\Activate.ps1") {
        & .\venv\Scripts\Activate.ps1
    } else {
        Write-ColorOutput "ERROR: Virtual environment activation script not found." -ForegroundColor Red
        Write-ColorOutput "Expected path: .\venv\Scripts\Activate.ps1" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-ColorOutput "ERROR: Failed to activate virtual environment: $_" -ForegroundColor Red
    exit 1
}
Write-ColorOutput "Virtual environment activated successfully." -ForegroundColor Green

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
Write-ColorOutput "Checking dependencies..." -ForegroundColor Cyan
if (Test-Path "requirements.txt") {
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
        Write-ColorOutput "`nThe following packages need to be installed:" -ForegroundColor Yellow
        $packagesToInstall | ForEach-Object { Write-ColorOutput "- $_" -ForegroundColor Yellow }
        Write-ColorOutput "Installing missing packages..." -ForegroundColor Cyan
        $packagesToInstall | ForEach-Object { 
            Write-ColorOutput "Installing: $_" -ForegroundColor Cyan
            pip install $_ 
            if (-not $?) {
                Write-ColorOutput "WARNING: Failed to install $_" -ForegroundColor Yellow
            }
        }
    }

    # Prompt for updates if needed
    if ($packagesToUpdate.Count -gt 0) {
        Write-ColorOutput "`nThe following packages have updates available:" -ForegroundColor Yellow
        $packagesToUpdate | ForEach-Object { Write-ColorOutput "- $_" -ForegroundColor Yellow }
        $updateChoice = Read-Host "Do you want to update these packages? (y/N)"
        if ($updateChoice -eq "y") {
            Write-ColorOutput "Updating packages..." -ForegroundColor Cyan
            pip install -r requirements.txt --upgrade
            if (-not $?) {
                Write-ColorOutput "WARNING: Some packages may not have updated correctly." -ForegroundColor Yellow
            } else {
                Write-ColorOutput "Packages updated successfully." -ForegroundColor Green
            }
        }
        else {
            Write-ColorOutput "Skipping package updates." -ForegroundColor Cyan
        }
    }

    if ($packagesToInstall.Count -eq 0 -and $packagesToUpdate.Count -eq 0) {
        Write-ColorOutput "All dependencies are up to date." -ForegroundColor Green
    }
} else {
    Write-ColorOutput "WARNING: requirements.txt not found. Cannot check dependencies." -ForegroundColor Yellow
}

# Create required directories if they don't exist
Write-ColorOutput "Creating required directories..." -ForegroundColor Cyan
$dirs = @("logs", "temp", "templates")
foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir
        Write-ColorOutput "Created directory: $dir" -ForegroundColor Green
    }
}

# Check if .env file exists, create if it doesn't
if (-not (Test-Path ".env")) {
    Write-ColorOutput "Creating default .env file..." -ForegroundColor Yellow
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
    Write-ColorOutput "Created default .env file. Please update the settings as needed." -ForegroundColor Yellow
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
$serverHost = if ([Environment]::GetEnvironmentVariable('HOST')) { 
    [Environment]::GetEnvironmentVariable('HOST') 
} else { 
    "0.0.0.0" 
}
$serverPort = if ([Environment]::GetEnvironmentVariable('PORT')) { 
    [Environment]::GetEnvironmentVariable('PORT') 
} else { 
    "8000" 
}

# Function to check if port is available and get process info
function Get-PortProcessInfo {
    param (
        [int]$Port
    )
    try {
        # Try standard TCP connection check first
        $tcpConn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($tcpConn) {
            $process = Get-Process -Id $tcpConn.OwningProcess -ErrorAction SilentlyContinue
            $cmdLine = $null
            try {
                $cmdLine = (Get-WmiObject -Class Win32_Process -Filter "ProcessId = $($tcpConn.OwningProcess)").CommandLine
            } catch {
                $cmdLine = "Unknown"
            }
            
            return @{
                InUse = $true
                ProcessId = $tcpConn.OwningProcess
                ProcessName = if ($process) { $process.ProcessName } else { "Unknown" }
                CommandLine = $cmdLine
            }
        }
        
        # If we couldn't find it via TCP connection, look for Python processes
        $pythonProcesses = Get-Process | Where-Object { $_.ProcessName -like "*python*" -or $_.MainWindowTitle -like "*python*" }
        if ($pythonProcesses) {
            return @{
                InUse = $true
                ProcessId = $pythonProcesses[0].Id
                ProcessName = $pythonProcesses[0].ProcessName
                CommandLine = "Python process (likely running Uvicorn)"
                IsPython = $true
            }
        }
        
        return @{
            InUse = $false
        }
    } catch {
        Write-ColorOutput "Error checking port: $_" -ForegroundColor Red
        return @{
            InUse = $false
            Error = $_.Exception.Message
        }
    }
}

# Enhanced function to kill a process with better error handling
function Stop-ProcessSafely {
    param (
        [int]$ProcessId,
        [switch]$Force = $true
    )
    
    try {
        # First try standard Stop-Process
        Stop-Process -Id $ProcessId -Force:$Force -ErrorAction SilentlyContinue
        
        # Wait a moment and check if process is still running
        Start-Sleep -Milliseconds 500
        $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
        
        if ($process) {
            # Try alternative method - taskkill (more aggressive)
            Write-ColorOutput "Using taskkill for process $ProcessId..." -ForegroundColor Yellow
            $null = taskkill /F /PID $ProcessId 2>$null
            Start-Sleep -Milliseconds 500
        }
        
        # Final check
        $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
        return ($null -eq $process)
    } catch {
        Write-ColorOutput "Error stopping process: $_" -ForegroundColor Red
        return $false
    }
}

# Discover all processes that might be relevant and display them
function Show-RelevantProcesses {
    Write-ColorOutput "`nCurrently running processes that might be relevant:" -ForegroundColor Cyan
    Write-ColorOutput "----------------------------------------------" -ForegroundColor Cyan
    
    # Show Python processes
    $pythonProcesses = Get-Process | Where-Object { $_.ProcessName -like "*python*" -or $_.MainWindowTitle -like "*python*" } | 
                      Select-Object Id, ProcessName, @{Name="WorkingSet";Expression={"$([math]::Round($_.WorkingSet / 1MB, 2)) MB"}}, StartTime, @{Name="RunTime";Expression={(Get-Date) - $_.StartTime}}
    
    if ($pythonProcesses) {
        Write-ColorOutput "Python Processes:" -ForegroundColor Yellow
        $pythonProcesses | Format-Table -AutoSize | Out-String | Write-Host
    } else {
        Write-ColorOutput "No Python processes found.`n" -ForegroundColor Cyan
    }
    
    # Show processes using network ports
    $netProcesses = Get-NetTCPConnection -State Listen | 
                   Where-Object { $_.LocalPort -ge 5000 -and $_.LocalPort -le 9000 } | 
                   Select-Object LocalPort, @{Name="ProcessId";Expression={$_.OwningProcess}}, @{Name="ProcessName";Expression={(Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName}}
    
    if ($netProcesses) {
        Write-ColorOutput "Processes using web ports (5000-9000):" -ForegroundColor Yellow
        $netProcesses | Sort-Object LocalPort | Format-Table -AutoSize | Out-String | Write-Host
    } else {
        Write-ColorOutput "No processes found using web ports (5000-9000).`n" -ForegroundColor Cyan
    }
}

# Check if port is available and handle port conflicts intelligently
$portInfo = Get-PortProcessInfo -Port $serverPort

if ($portInfo.InUse) {
    Write-ColorOutput "`nPort $serverPort is already in use by process: $($portInfo.ProcessId) ($($portInfo.ProcessName))" -ForegroundColor Yellow
    
    if ($portInfo.IsPython) {
        Write-ColorOutput "Detected Python process that is likely a previous instance of this application." -ForegroundColor Yellow
    }
    
    # Show detailed information about running processes
    Show-RelevantProcesses
    
    Write-ColorOutput "`nWhat would you like to do?" -ForegroundColor Cyan
    Write-ColorOutput "1. Display more details about running processes" -ForegroundColor White
    Write-ColorOutput "2. Kill specific process by ID" -ForegroundColor White
    Write-ColorOutput "3. Kill all Python processes" -ForegroundColor White
    Write-ColorOutput "4. Use a different port" -ForegroundColor White
    Write-ColorOutput "5. Exit" -ForegroundColor White
    
    $response = Read-Host "Enter your choice (1-5)"
    
    if ($response -eq "1") {
        # Show more detailed process information
        Write-ColorOutput "`nDetailed process information:" -ForegroundColor Cyan
        Get-Process | Where-Object { $_.ProcessName -like "*python*" -or $_.Id -eq $portInfo.ProcessId } | 
        Select-Object Id, ProcessName, Path, StartTime, @{Name="Memory (MB)";Expression={[math]::Round($_.WorkingSet / 1MB, 2)}} | 
        Format-List | Out-String | Write-Host
        
        # Ask again after showing details
        $recurse = Read-Host "Press Enter to return to options"
        # Show options again
        Show-RelevantProcesses
        $response = Read-Host "Enter your choice (1-5)"
    }
    
    if ($response -eq "2") {
        $pidToKill = Read-Host "Enter the process ID to kill"
        if ([int]::TryParse($pidToKill, [ref]$null)) {
            $confirmKill = Read-Host "Are you sure you want to kill process $pidToKill? (y/n)"
            if ($confirmKill -eq "y") {
                Write-ColorOutput "Attempting to terminate process $pidToKill..." -ForegroundColor Cyan
                $killed = Stop-ProcessSafely -ProcessId $pidToKill
                
                if ($killed) {
                    Write-ColorOutput "Process $pidToKill has been terminated successfully." -ForegroundColor Green
                    Start-Sleep -Seconds 2  # Wait for port to be released
                    
                    # Check if port is now available
                    $portCheck = Get-PortProcessInfo -Port $serverPort
                    if (-not $portCheck.InUse) {
                        Write-ColorOutput "Port $serverPort is now available. Continuing with server startup..." -ForegroundColor Green
                        # Will continue to server startup below
                    } else {
                        Write-ColorOutput "Port $serverPort is still in use. Please try another option." -ForegroundColor Yellow
                        exit 1
                    }
                } else {
                    Write-ColorOutput "Failed to kill process $pidToKill using standard methods. Trying taskkill..." -ForegroundColor Yellow
                    $null = taskkill /F /PID $pidToKill 2>$null
                    Start-Sleep -Seconds 2
                    
                    # Check if process is still running
                    $process = Get-Process -Id $pidToKill -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-ColorOutput "ERROR: Failed to terminate process $pidToKill. Please try to close it manually." -ForegroundColor Red
                        exit 1
                    } else {
                        Write-ColorOutput "Process $pidToKill has been terminated successfully." -ForegroundColor Green
                        
                        # Check if port is now available
                        $portCheck = Get-PortProcessInfo -Port $serverPort
                        if (-not $portCheck.InUse) {
                            Write-ColorOutput "Port $serverPort is now available. Continuing with server startup..." -ForegroundColor Green
                            # Will continue to server startup below
                        } else {
                            Write-ColorOutput "Port $serverPort is still in use. Please try another option." -ForegroundColor Yellow
                            exit 1
                        }
                    }
                }
            }
        } else {
            Write-ColorOutput "Invalid process ID" -ForegroundColor Red
            exit 1
        }
    }
    
    elseif ($response -eq "3") {
        $confirmKill = Read-Host "Are you sure you want to kill ALL Python processes? This may affect other applications. (y/n)"
        if ($confirmKill -eq "y") {
            Write-ColorOutput "Attempting to terminate all Python processes..." -ForegroundColor Cyan
            
            # Get all Python processes before attempting to kill them
            $pythonProcessesBefore = Get-Process | Where-Object { $_.ProcessName -like "*python*" }
            if ($pythonProcessesBefore.Count -eq 0) {
                Write-ColorOutput "No Python processes found to terminate." -ForegroundColor Yellow
            } else {
                # Try to kill processes individually for better error handling
                foreach ($process in $pythonProcessesBefore) {
                    Write-ColorOutput "Terminating Python process with ID: $($process.Id)" -ForegroundColor Cyan
                    try {
                        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                    } catch {
                        Write-ColorOutput "Failed to stop process $($process.Id) with Stop-Process" -ForegroundColor Yellow
                    }
                }
                
                # Additional attempt with taskkill as backup
                $null = taskkill /F /IM python.exe 2>$null
                # Ignore errors for pythonw.exe as it might not exist
                $null = taskkill /F /IM pythonw.exe 2>$null
            }
            
            Start-Sleep -Seconds 2
            
            # Check if any Python processes are still running
            $pythonProcessesAfter = Get-Process | Where-Object { $_.ProcessName -like "*python*" }
            if ($pythonProcessesAfter.Count -gt 0) {
                Write-ColorOutput "WARNING: Some Python processes could not be terminated:" -ForegroundColor Yellow
                $pythonProcessesAfter | ForEach-Object {
                    Write-ColorOutput "  - Process ID: $($_.Id), Name: $($_.ProcessName)" -ForegroundColor Yellow
                }
                Write-ColorOutput "Please try to close them manually or use option 2 to kill specific processes." -ForegroundColor Yellow
                
                # Ask if user wants to retry with option 2
                $retryChoice = Read-Host "Would you like to kill a specific process ID instead? (y/n)"
                if ($retryChoice -eq "y") {
                    $pidToKill = Read-Host "Enter the process ID to kill"
                    if ([int]::TryParse($pidToKill, [ref]$null)) {
                        Write-ColorOutput "Attempting to terminate process $pidToKill..." -ForegroundColor Cyan
                        $killed = Stop-ProcessSafely -ProcessId $pidToKill
                        
                        if ($killed) {
                            Write-ColorOutput "Process $pidToKill has been terminated successfully." -ForegroundColor Green
                        } else {
                            Write-ColorOutput "ERROR: Failed to terminate process $pidToKill. Please try to close it manually." -ForegroundColor Red
                            exit 1
                        }
                    } else {
                        Write-ColorOutput "Invalid process ID" -ForegroundColor Red
                    }
                }
            } else {
                Write-ColorOutput "All Python processes have been terminated successfully." -ForegroundColor Green
            }
            
            # Regardless of whether all processes were killed, check if port is now available
            $portCheck = Get-PortProcessInfo -Port $serverPort
            if (-not $portCheck.InUse) {
                Write-ColorOutput "Port $serverPort is now available. Continuing with server startup..." -ForegroundColor Green
                # We don't need any special flag, just let it continue to server start
            } else {
                Write-ColorOutput "WARNING: Port $serverPort is still in use despite terminating Python processes." -ForegroundColor Yellow
                Show-RelevantProcesses
                
                $finalChoice = Read-Host "Would you like to exit (e) or try a different port (p)?"
                if ($finalChoice -eq "p") {
                    # Find an available port
                    $newPort = [int]$serverPort + 1
                    while ((Get-PortProcessInfo -Port $newPort).InUse -eq $true) {
                        $newPort++
                        if ($newPort -gt 65535) {
                            Write-ColorOutput "ERROR: No available ports found. Please manually set a port in your .env file." -ForegroundColor Red
                            exit 1
                        }
                    }
                    
                    Write-ColorOutput "Using alternative port: $newPort" -ForegroundColor Green
                    $serverPort = $newPort
                    [Environment]::SetEnvironmentVariable("PORT", $newPort)
                } else {
                    Write-ColorOutput "Exiting as requested. Please resolve port conflicts manually and try again." -ForegroundColor Cyan
                    exit 0
                }
            }
        }
    }
    
    elseif ($response -eq "4") {
        # Find an available port by incrementing the current port
        $newPort = [int]$serverPort + 1
        while ((Get-PortProcessInfo -Port $newPort).InUse -eq $true) {
            $newPort++
            if ($newPort -gt 65535) {
                Write-ColorOutput "ERROR: No available ports found. Please manually set a port in your .env file." -ForegroundColor Red
                exit 1
            }
        }
        
        Write-ColorOutput "Found available port: $newPort" -ForegroundColor Green
        Write-ColorOutput "WARNING: Using a different port may cause issues with frontend connectivity." -ForegroundColor Yellow
        Write-ColorOutput "It's recommended to keep using port 8000 and resolve the port conflict instead." -ForegroundColor Yellow
        $confirmPort = Read-Host "Do you want to use port $newPort for this session? (y/n)"
        
        if ($confirmPort -eq "y") {
            # Update the port in the environment for this session
            $serverPort = $newPort
            [Environment]::SetEnvironmentVariable("PORT", $newPort)
            
            # Also suggest updating the .env file
            Write-ColorOutput "Remember to update PORT=$newPort in your .env file for future runs." -ForegroundColor Yellow
            $updateEnvFile = Read-Host "Would you like to update your .env file with this port? (y/n)"
            
            if ($updateEnvFile -eq "y") {
                # Update the .env file if it exists
                $envFilePath = Join-Path $BackendPath ".env"
                if (Test-Path $envFilePath) {
                    $envContent = Get-Content $envFilePath -Raw
                    # Check if PORT already exists in the file
                    if ($envContent -match "PORT=[0-9]+") {
                        # Replace existing PORT
                        $envContent = $envContent -replace "PORT=[0-9]+", "PORT=$newPort"
                    } else {
                        # Add PORT at the end of the file
                        $envContent = $envContent.TrimEnd() + "`nPORT=$newPort`n"
                    }
                    Set-Content -Path $envFilePath -Value $envContent
                    Write-ColorOutput ".env file updated with PORT=$newPort" -ForegroundColor Green
                } else {
                    Write-ColorOutput "No .env file found at $envFilePath. Please create one with PORT=$newPort" -ForegroundColor Yellow
                }
            }
        } else {
            Write-ColorOutput "Port selection cancelled. Please update your PORT manually and try again." -ForegroundColor Red
            exit 1
        }
    }
    
    elseif ($response -eq "5") {
        Write-ColorOutput "Exiting as requested. Please update your PORT in .env file or terminate the blocking process manually." -ForegroundColor Cyan
        exit 0
    }
    
    else {
        Write-ColorOutput "Invalid option. Please try again with a valid option (1-5)." -ForegroundColor Red
        exit 1
    }
}

Write-ColorOutput "Starting backend server on http://${serverHost}:${serverPort}" -ForegroundColor Green
try {
    # Check if uvicorn is available
    $uvicornInstalled = $false
    try {
        $uvicornInstalled = [bool](Get-Command -Name uvicorn -ErrorAction SilentlyContinue)
    } catch {
        $uvicornInstalled = $false
    }
    
    if (-not $uvicornInstalled) {
        Write-ColorOutput "uvicorn command not found. Attempting to start server using python -m uvicorn..." -ForegroundColor Yellow
        & python -m uvicorn app.main:app --host $serverHost --port $serverPort --reload
    } else {
        & uvicorn app.main:app --host $serverHost --port $serverPort --reload
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "ERROR: Server failed to start with exit code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-ColorOutput "ERROR: Failed to start server: $_" -ForegroundColor Red
    
    # Additional troubleshooting information
    Write-ColorOutput "`nTroubleshooting information:" -ForegroundColor Yellow
    Write-ColorOutput "1. Make sure uvicorn is installed: pip install uvicorn" -ForegroundColor Yellow
    Write-ColorOutput "2. Check that app/main.py exists and contains a FastAPI app instance" -ForegroundColor Yellow
    Write-ColorOutput "3. Verify virtual environment is activated correctly" -ForegroundColor Yellow
    
    exit 1
}
