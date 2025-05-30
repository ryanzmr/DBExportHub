# DBExportHub Installation Guide

This guide provides step-by-step instructions for setting up the DBExportHub application on your local machine. DBExportHub is a web-based application for exporting SQL Server data to Excel based on specific conditions.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- Node.js (v18+)
- Python (v3.8+)
- SQL Server
- ODBC Driver for SQL Server (v17+)
- Git (for cloning the repository)

## Clone the Repository

```bash
git clone <repository-url>
cd DBExportHub
```

## Backend Setup

### 1. Create and Activate a Virtual Environment

#### Windows:
```bash
cd backend
python -m venv venv
venv\Scripts\activate
```

#### Linux/Mac:
```bash
cd backend
python -m venv venv
source venv/bin/activate
```

### 2. Install Backend Dependencies

The backend dependencies are listed in the `requirements.txt` file. Install them using pip:

```bash
pip install -r requirements.txt
```

This will install the following packages:
- fastapi>=0.68.0: Web framework for building APIs
- uvicorn>=0.15.0: ASGI server for running FastAPI
- pyodbc>=4.0.32: For SQL Server connectivity
- pandas>=1.3.3: For data manipulation
- python-dotenv>=0.19.0: For loading environment variables
- pydantic>=1.8.2: For data validation
- openpyxl>=3.0.9: For Excel file generation
- xlsxwriter>=3.0.3: For optimized Excel file generation
- python-multipart>=0.0.5: For handling form data
- numpy>=1.20.0: For numerical operations
- PyJWT>=2.1.0: For JWT-based authentication
- pathlib>=1.0.1: For file path operations
- uuid>=1.30: For generating unique identifiers
- python-json-logger>=2.0.4: For structured logging

### 3. Configure Environment Variables

Create a `.env` file in the backend directory with the following environment variables:

```
# Authentication
SECRET_KEY=your-secure-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS Settings
BACKEND_CORS_ORIGINS=http://localhost,http://localhost:3000,http://localhost:5173

# Database Settings
DB_DRIVER=ODBC Driver 17 for SQL Server

# File Paths
TEMP_DIR=./temp
TEMPLATES_DIR=./templates
LOGS_DIR=./logs
```

Ensure the ODBC driver name matches your installed version. You can check available drivers using:

#### Windows:
```
odbcad32.exe
```

#### Linux:
```
odbcinst -q -d
```

### 4. Create Required Directories

Ensure the following directories exist in the backend folder:
```bash
mkdir -p logs temp templates
```

### 5. Start the Application

The application comes with PowerShell scripts to automate the startup process:

#### Start Backend Server:
```powershell
.\start-backend.ps1
```
The backend server will start running at http://localhost:8000

#### Start Frontend Development Server:
```powershell
.\start-frontend.ps1
```
The frontend development server will start at http://localhost:3001

These scripts will:
1. Set up the required environment
2. Install/update dependencies
3. Create necessary directories and config files
4. Start the development servers

Note: You can also start the servers manually if needed:

Backend:
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Frontend:
```powershell
cd frontend
npm install
npm run dev -- --port 3001
```

This will install all the required packages including:
- React (v18.2.0) and React DOM
- Material-UI (v5.16.14) components and icons
- MUI Data Grid (v7.27.2) for data display
- MUI Date Pickers Pro (v7.27.1) for date selection
- Axios (v1.4.0) for API calls
- React Router (v6.11.1) for navigation
- Day.js (v1.11.13) for date handling
- TypeScript support
- Vite (v6.2.0) as the build tool

### 3. Configure Environment Variables

Create a `.env` file in the frontend directory based on the `.env.example` file:

```bash
cp .env.example .env
```

Edit the `.env` file to set the API URL (default is http://localhost:8000):

```
VITE_API_URL=http://localhost:8000
```

### 4. Run the Frontend Development Server

```bash
npm run dev
```

The frontend development server will start running at http://localhost:3000 or http://localhost:5173 (depending on Vite configuration).

## Accessing the Application

Once both the backend and frontend servers are running, you can access the application by opening your web browser and navigating to the frontend URL (http://localhost:3000 or http://localhost:5173).

## Authentication System

DBExportHub uses a token-based authentication system:

1. The system uses JWT (JSON Web Tokens) for authentication
2. Tokens are generated with a configurable expiration time (set by ACCESS_TOKEN_EXPIRE_MINUTES)
3. There's a fallback implementation if the JWT package encounters issues
4. Tokens are validated on each API request to ensure security

The authentication flow:
1. User provides SQL Server connection details
2. Backend validates the connection and issues a JWT token
3. Frontend stores the token for subsequent API calls

## Building for Production

### Backend

For production, you should run the backend using a production-grade ASGI server:

```bash
# Using Uvicorn without --reload
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Or using Gunicorn with Uvicorn workers
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
```

### Frontend

To build the frontend for production:

```bash
cd frontend
npm run build
```

This will create a `dist` directory with optimized production files that can be served by any static file server.

## Troubleshooting

### Common Issues

1. **ODBC Driver Issues**: 
   - Error: "The DSN specified does not exist" or "Driver not found"
   - Solution: Ensure you have the correct ODBC Driver for SQL Server installed and the driver name in your .env file matches exactly

2. **Database Connection**: 
   - Error: "Cannot connect to SQL Server" or "Login failed"
   - Solution: Verify SQL Server is running and credentials are correct. Check firewall settings and SQL Server authentication mode.

3. **Port Conflicts**: 
   - Error: "Address already in use" 
   - Solution: Change the port in the uvicorn command (--port XXXX) or in the Vite configuration for frontend

4. **JWT Authentication Issues**:
   - Error: "Invalid token" or "Token expired"
   - Solution: Check SECRET_KEY configuration and ACCESS_TOKEN_EXPIRE_MINUTES in the .env file

5. **Large Export Failures**:
   - Error: "Memory error" or timeout during large exports
   - Solution: Increase system memory, use more specific filters, or optimize your SQL Server queries

### Getting Help

If you encounter any issues during installation or setup, please refer to:
- The project documentation
- Backend logs in the `logs` directory
- Browser console for frontend errors

## Next Steps

After successful installation, refer to the CONFIGURATION_GUIDE.md for detailed information on how to use the DBExportHub application for importing and exporting SQL Server data to Excel.