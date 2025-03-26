# DBExportHub

A web-based application for exporting SQL Server data to Excel based on specific conditions.

## Project Overview

DBExportHub is a modern replacement for an outdated VB6 application that exports trade/shipping data from SQL Server to Excel. The application provides a user-friendly interface for specifying export parameters, previewing data, and downloading formatted Excel files. It's designed to handle large datasets efficiently and provide a seamless user experience.

## Features

- Secure database connection with dynamic credentials
- Parameter-based data extraction
- Data preview capability (first 100 records)
- Excel export with proper formatting
- Optimized for large datasets
- Token-based authentication
- Responsive user interface
- Real-time operation progress tracking
- Cancellable operations
- Comprehensive logging system

## Architecture Breakdown

### System Architecture

DBExportHub follows a client-server architecture:

1. **Frontend (Client)**: React.js application that provides the user interface
2. **Backend (Server)**: FastAPI application that handles database connections and data processing
3. **Database**: Microsoft SQL Server that stores the data to be exported

### Workflow Process

1. **Authentication Flow**:
   - User provides SQL Server connection details (server, database, username, password)
   - Backend validates the connection and issues a JWT token
   - Frontend stores the token and uses it for subsequent API calls

2. **Data Export Flow**:
   - User specifies export parameters (date range, filters, etc.)
   - Frontend sends a preview request to the backend
   - Backend executes the stored procedure with the specified parameters
   - Frontend displays a preview of the data (first 100 records)
   - User can then export the full dataset to Excel
   - Backend generates the Excel file and sends it to the frontend for download
   - Progress is tracked and displayed to the user in real-time
   - Operation can be cancelled if needed

### Authentication System

DBExportHub uses a universal token-based authentication system with JWT:
- Secure token generation with a configurable expiration time
- Fallback implementation if the JWT package encounters issues
- Environment variable configuration via SECRET_KEY
- Token expiration controlled by ACCESS_TOKEN_EXPIRE_MINUTES setting

## Tech Stack

### Frontend
- React.js (v18.2.0) with React Router (v6.11.1) for navigation
- Material-UI (v5.16.14) for styling and components including MUI Data Grid (v7.27.2) and Date Pickers Pro (v7.27.1)
- React Hooks for state management
- Axios (v1.4.0) for API calls
- Vite (v6.2.0) as the build tool
- TypeScript support
- Day.js (v1.11.13) for date handling

### Backend
- FastAPI (Python) for the API server
- pyodbc for SQL Server connectivity
- pandas for data manipulation
- OpenPyXL for Excel generation
- PyJWT for authentication
- Uvicorn web server
- Python JSON Logger for structured logging

### Database
- Microsoft SQL Server
- Existing stored procedures

## Setup & Installation Guide

### Prerequisites

- Node.js (v18+)
- Python (v3.8+)
- SQL Server
- ODBC Driver for SQL Server (v17+)

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd DBExportHub/backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Create a `.env` file in the backend directory with any necessary environment variables:
   ```
   SECRET_KEY=your-secure-secret-key
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   BACKEND_CORS_ORIGINS=http://localhost,http://localhost:3000,http://localhost:5173
   ```

6. Run the FastAPI server:
   ```
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd DBExportHub/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example` with your configuration:
   ```
   VITE_API_URL=http://localhost:8000
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Access the application at `http://localhost:3000` (default port)

## Code Structure & Module Explanation

### Backend Structure

```
backend/
├── app/                    # FastAPI application
│   ├── __init__.py
│   ├── main.py             # FastAPI entry point
│   ├── config.py           # Configuration settings
│   ├── models.py           # Pydantic models
│   ├── database.py         # Database connection
│   ├── logger.py           # Logging configuration
│   └── api/                # API endpoints
│       ├── __init__.py
│       ├── auth.py         # Authentication utilities
│       ├── cancel.py       # Operation cancellation
│       ├── data_processing.py  # Data processing utilities
│       ├── database_operations.py  # Database operation utilities
│       ├── excel_utils.py  # Excel generation utilities
│       ├── export.py       # Export endpoints wrapper
│       ├── export_service.py  # Export service implementation
│       ├── logging_utils.py  # Logging utilities
│       └── operation_tracker.py  # Operation tracking
├── logs/                   # Log files directory
├── templates/              # Excel templates
├── temp/                   # Temporary files directory
└── requirements.txt        # Python dependencies
```

### Frontend Structure

```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── dashboard/      # Dashboard-specific components
│   │   └── login/          # Login-specific components
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   │   ├── Dashboard/      # Export page components
│   │   └── Login/          # Login page components
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   ├── App.jsx             # Main App component
│   ├── index.jsx           # Entry point
│   └── theme.js            # MUI theme configuration
├── .env.example            # Environment variables template
├── package.json            # NPM dependencies
└── vite.config.js          # Vite configuration
```

## API Documentation

### Authentication Endpoints

#### POST /api/auth/login

Authenticate user with database credentials.

**Request:**
```json
{
  "server": "sql-server-name",
  "database": "database-name",
  "username": "db-username",
  "password": "db-password"
}
```

**Response:**
```json
{
  "access_token": "jwt-token",
  "token_type": "bearer"
}
```

### Data Export Endpoints

#### POST /api/export/preview

Get a preview of the data (first 100 records).

**Request:**
```json
{
  "server": "sql-server-name",
  "database": "database-name",
  "username": "db-username",
  "password": "db-password",
  "fromMonth": 202301,
  "toMonth": 202312,
  "hs": "optional-hs-code",
  "prod": "optional-product-description",
  "iec": "optional-iec",
  "expCmp": "optional-exporter-company",
  "forcount": "optional-foreign-country",
  "forname": "optional-foreign-name",
  "port": "optional-port",
  "preview_only": true,
  "max_records": 100
}
```

**Response:**
```json
{
  "data": [
    { 
      "column1": "value1",
      "column2": "value2",
      ...
    },
    ...
  ],
  "count": 100
}
```

#### POST /api/export/excel

Export data to Excel.

**Request:**
Same as preview, but with `preview_only` set to `false`

**Response:**
Excel file download

### Operation Management Endpoints

#### GET /api/operations/{operation_id}/progress

Get the progress of an operation.

**Response:**
```json
{
  "operation_id": "uuid",
  "status": "running",
  "progress": 75,
  "message": "Processing record 750 of 1000"
}
```

#### POST /api/operations/{operation_id}/cancel

Cancel an ongoing operation.

**Response:**
```json
{
  "status": "cancelled",
  "message": "Operation cancelled successfully"
}
```

## Logging System

DBExportHub includes a comprehensive logging system that tracks:

1. API requests and responses
2. Database operations
3. Export operations
4. Authentication events
5. Errors and exceptions

Logs are stored in the `backend/logs` directory and follow a structured JSON format for easier parsing and analysis.

## Building for Production

### Backend

For production, run the backend without the `--reload` flag:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Or use a production ASGI server like Gunicorn with Uvicorn workers.

### Frontend

To build the frontend for production:

```bash
cd frontend
npm run build
```

This will create a `dist` directory with optimized production files that can be served by any static file server.

## Troubleshooting

For detailed troubleshooting information, please refer to the installation guide and the logging guide in the project documentation.