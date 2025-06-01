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
            return @{
                InUse = $true
                ProcessId = $tcpConn.OwningProcess
                ProcessName = if ($process) { $process.ProcessName } else { "Unknown" }
                CommandLine = if ($process) { $process.CommandLine } else { "Unknown" }
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
        Write-Host "Error checking port: $_"
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
            Write-Host "Using taskkill for process $ProcessId..."
            $null = taskkill /F /PID $ProcessId 2>$null
            Start-Sleep -Milliseconds 500
        }
        
        # Final check
        $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
        return ($null -eq $process)
    } catch {
        Write-Host "Error stopping process: $_"
        return $false
    }
}

# Discover all processes that might be relevant and display them
function Show-RelevantProcesses {
    Write-Host "`nCurrently running processes that might be relevant:"
    Write-Host "----------------------------------------------"
    
    # Show Python processes
    $pythonProcesses = Get-Process | Where-Object { $_.ProcessName -like "*python*" -or $_.MainWindowTitle -like "*python*" } | 
                      Select-Object Id, ProcessName, @{Name="WorkingSet";Expression={"$([math]::Round($_.WorkingSet / 1MB, 2)) MB"}}, StartTime, @{Name="RunTime";Expression={(Get-Date) - $_.StartTime}}
    
    if ($pythonProcesses) {
        Write-Host "Python Processes:"
        $pythonProcesses | Format-Table -AutoSize | Out-String | Write-Host
    } else {
        Write-Host "No Python processes found.`n"
    }
    
    # Show processes using network ports
    $netProcesses = Get-NetTCPConnection -State Listen | 
                   Where-Object { $_.LocalPort -ge 5000 -and $_.LocalPort -le 9000 } | 
                   Select-Object LocalPort, @{Name="ProcessId";Expression={$_.OwningProcess}}, @{Name="ProcessName";Expression={(Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName}}
    
    if ($netProcesses) {
        Write-Host "Processes using web ports (5000-9000):"
        $netProcesses | Sort-Object LocalPort | Format-Table -AutoSize | Out-String | Write-Host
    } else {
        Write-Host "No processes found using web ports (5000-9000).`n"
    }
}

# Check if port is available and handle port conflicts intelligently
$portInfo = Get-PortProcessInfo -Port $serverPort

if ($portInfo.InUse) {
    Write-Host "`nPort $serverPort is already in use by process: $($portInfo.ProcessId) ($($portInfo.ProcessName))"
    
    if ($portInfo.IsPython) {
        Write-Host "Detected Python process that is likely a previous instance of this application."
    }
    
    # Show detailed information about running processes
    Show-RelevantProcesses
    
    Write-Host "`nWhat would you like to do?"
    Write-Host "1. Display more details about running processes"
    Write-Host "2. Kill specific process by ID"
    Write-Host "3. Kill all Python processes"
    Write-Host "4. Use a different port"
    Write-Host "5. Exit"
    
    $response = Read-Host "Enter your choice (1-5)"
    
    if ($response -eq "1") {
        # Show more detailed process information
        Write-Host "`nDetailed process information:"
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
                Write-Host "Attempting to terminate process $pidToKill..."
                $killed = Stop-ProcessSafely -ProcessId $pidToKill
                
                if ($killed) {
                    Write-Host "Process $pidToKill has been terminated successfully."
                    Start-Sleep -Seconds 2  # Wait for port to be released
                } else {
                    Write-Host "Failed to kill process $pidToKill using standard methods. Trying taskkill..."
                    $null = taskkill /F /PID $pidToKill 2>$null
                    Start-Sleep -Seconds 2
                }
            }
        } else {
            Write-Host "Invalid process ID"
        }
    }
    
    elseif ($response -eq "3") {
        $confirmKill = Read-Host "Are you sure you want to kill ALL Python processes? This may affect other applications. (y/n)"
        if ($confirmKill -eq "y") {
            Write-Host "Attempting to terminate all Python processes..."
            $null = taskkill /F /IM python.exe 2>$null
            $null = taskkill /F /IM pythonw.exe 2>$null
            Start-Sleep -Seconds 2
            Write-Host "Python processes have been terminated."
        }
    }
    
    elseif ($response -eq "4") {
        # Find an available port by incrementing the current port
        $newPort = [int]$serverPort + 1
        while ((Get-PortProcessInfo -Port $newPort).InUse -eq $true) {
            $newPort++
            if ($newPort -gt 65535) {
                Write-Error "No available ports found. Please manually set a port in your .env file."
                exit 1
            }
        }
        
        Write-Host "Found available port: $newPort"
        $confirmPort = Read-Host "Do you want to use port $newPort for this session? (y/n)"
        
        if ($confirmPort -eq "y") {
            # Update the port in the environment for this session
            $serverPort = $newPort
            [Environment]::SetEnvironmentVariable("SERVER_PORT", $newPort)
            
            # Also suggest updating the .env file
            Write-Host "Remember to update SERVER_PORT=$newPort in your .env file for future runs."
            $updateEnvFile = Read-Host "Would you like to update your .env file with this port? (y/n)"
            
            if ($updateEnvFile -eq "y") {
                # Update the .env file if it exists
                $envFilePath = Join-Path $BackendPath ".env"
                if (Test-Path $envFilePath) {
                    $envContent = Get-Content $envFilePath -Raw
                    # Check if SERVER_PORT already exists in the file
                    if ($envContent -match "SERVER_PORT=[0-9]+") {
                        # Replace existing SERVER_PORT
                        $envContent = $envContent -replace "SERVER_PORT=[0-9]+", "SERVER_PORT=$newPort"
                    } else {
                        # Add SERVER_PORT at the end of the file
                        $envContent = $envContent.TrimEnd() + "`nSERVER_PORT=$newPort`n"
                    }
                    Set-Content -Path $envFilePath -Value $envContent
                    Write-Host ".env file updated with SERVER_PORT=$newPort"
                } else {
                    Write-Host "No .env file found at $envFilePath. Please create one with SERVER_PORT=$newPort"
                }
            }
        } else {
            Write-Error "Port selection cancelled. Please update your SERVER_PORT manually and try again."
            exit 1
        }
    }
    
    elseif ($response -eq "5") {
        Write-Error "Exiting as requested. Please update your SERVER_PORT in .env file or terminate the blocking process manually."
        exit 1
    }
    
    else {
        Write-Error "Invalid option. Please try again with a valid option (1-5)."
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
