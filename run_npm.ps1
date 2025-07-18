# Script to run npm commands using the portable Node.js
param(
    [Parameter(Mandatory=$true)]
    [string]$Command,
    
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Arguments
)

# Set PATH to include portable Node.js
$env:PATH = "$PSScriptRoot\portable_node;$env:PATH"

# Change to frontend directory
Set-Location -Path "$PSScriptRoot\frontend"

# Run the npm command
if ($Arguments) {
    & npm $Command $Arguments
} else {
    & npm $Command
}
