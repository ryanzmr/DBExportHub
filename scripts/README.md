# DBExportHub Automation Scripts

This directory contains automation scripts for the DBExportHub project to simplify development, building, and deployment processes.

## Main Scripts (Project Root)

These scripts are located in the project root directory and serve as the primary entry points:

### `start_backend.ps1`
- **Purpose**: Starts the Python FastAPI backend server with automatic environment setup
- **Features**:
  - Automatically creates Python virtual environment if not exists
  - Installs dependencies if needed
  - Sets up required directories (logs, temp, templates)
  - Configures environment variables from .env file
  - Provides clear logging and error messages
- **Usage**: Run from project root with `.\start_backend.ps1`

### `start_frontend.ps1`
- **Purpose**: Starts the React frontend development server
- **Features**:
  - Automatically installs Node.js dependencies if needed
  - Supports both system-installed and portable Node.js
  - Configures environment variables from .env file
  - Provides clear logging and error messages
- **Usage**: Run from project root with `.\start_frontend.ps1`

### `start_app.ps1`
- **Purpose**: Starts both backend and frontend servers concurrently
- **Features**:
  - Launches backend in a separate window
  - Starts frontend in the current window
  - Validates environment configuration (ports, CORS, API URL)
  - Creates required directories
  - Provides clear logging and error messages
- **Usage**: Run from project root with `.\start_app.ps1`

### `build_frontend.ps1`
- **Purpose**: Builds the React frontend for production deployment
- **Features**:
  - Cleans previous build artifacts
  - Installs dependencies if needed
  - Builds optimized production bundle
  - Supports both system-installed and portable Node.js
- **Usage**: Run from project root with `.\build_frontend.ps1`

## Utility Scripts

### `utils.ps1`
- **Purpose**: Provides common utility functions used by other scripts
- **Features**:
  - Environment variable management
  - Cross-platform compatibility (Windows/Linux)
  - Logging with timestamps and color coding
  - Directory management
  - Command existence checking
- **Usage**: Imported by other scripts, not meant to be run directly

## Portable Environment Scripts

### `scripts/portable_env/`
Contains scripts for managing portable Python environments:
- `setup.ps1`: Sets up a portable Python environment
- `activate.ps1`: Activates the portable Python environment
- `run_backend.ps1`: Runs the backend with the portable environment

### `scripts/portable_node/`
Contains scripts for managing portable Node.js:
- `setup.ps1`: Sets up portable Node.js if needed

### `scripts/frontend/`
Contains scripts for frontend management:
- `build_frontend.ps1`: Builds the frontend for production
- `run_frontend.ps1`: Runs the frontend development server
- `run_frontend_portable.ps1`: Runs frontend with portable Node.js

## Cross-Platform Support

These scripts are designed to work on both Windows and Linux environments with PowerShell Core. They detect the operating system and adapt accordingly.

## Environment Variables

The scripts read configuration from `.env` files in the backend and frontend directories. Make sure these files exist and contain the necessary configuration.

## Error Handling

All scripts include comprehensive error handling and will provide clear error messages if something goes wrong. Check the console output for troubleshooting information.
