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

## Tech Stack

### Frontend
- React.js (v18.2.0) with React Router (v6.11.1) for navigation
- Material-UI (v5.16.14) for styling and components including MUI Data Grid and Date Pickers
- React Hooks for state management
- Axios for API calls
- Vite (v6.2.0) as the build tool
- TypeScript support

### Backend
- FastAPI (Python) for the API server
- pyodbc for SQL Server connectivity
- pandas for data manipulation
- OpenPyXL for Excel generation
- JWT for authentication
- Uvicorn web server

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

5. Run the FastAPI server:
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

3. Create a `.env` file based on `.env.example` with your configuration.

4. Start the development server:
   ```
   npm run dev
   ```

5. Access the application at `http://localhost:3000` (as configured in vite.config.js)

## Code Structure & Module Explanation

### Backend Structure

```
backend/
├── app/                  # FastAPI application
│   ├── __init__.py
│   ├── main.py           # FastAPI entry point
│   ├── config.py         # Configuration settings
│   ├── models.py         # Pydantic models
│   ├── database.py       # Database connection
│   └── api/              # API endpoints
│       ├── __init__.py
│       ├── export.py     # Export endpoints
│       └── auth.py       # Auth endpoints
├── requirements.txt      # Python dependencies
└── templates/            # Excel templates
```

**Key Backend Files:**

- **main.py**: Entry point for the FastAPI application, defines routes and middleware
- **config.py**: Configuration settings for the application
- **models.py**: Pydantic models for request/response validation
- **database.py**: Database connection utilities
- **api/export.py**: Endpoints for data preview and Excel export
- **api/auth.py**: Authentication utilities

### Frontend Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── dashboard/    # Dashboard-specific components
│   │   └── login/        # Login-specific components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   │   ├── Dashboard/    # Export page components
│   │   └── Login/        # Login page components
│   ├── services/         # API services
│   ├── utils/            # Utility functions
│   ├── App.jsx           # Main App component
│   ├── index.jsx         # Entry point
│   └── theme.js          # MUI theme configuration
├── .env.example          # Environment variables template
├── package.json          # NPM dependencies
└── vite.config.js        # Vite configuration
```

**Key Frontend Files:**

- **App.jsx**: Main application component with routing and authentication context
- **pages/Login/LoginPage.jsx**: Login page for database connection
- **pages/Dashboard/ExportPage.jsx**: Main export interface
- **components/dashboard/ExportForm.jsx**: Form for export parameters
- **components/dashboard/PreviewTable.jsx**: Table for data preview
- **utils/exportUtils.js**: Utility functions for export operations
- **services/api.js**: API service for backend communication
- **services/authService.js**: Authentication service
- **hooks/useAuth.js**: Custom hook for authentication

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
  "token": "jwt-token",
  "token_type": "bearer",
  "expires_in": 300
}
```

### Export Endpoints

#### POST /api/export/preview

Get a preview of the export data.

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
  "iec": "optional-iec-code",
  "expCmp": "optional-exporter-company",
  "forcount": "optional-foreign-country",
  "forname": "optional-foreign-importer",
  "port": "optional-port",
  "preview_only": true,
  "max_records": 100
}
```

**Response:**
```json
{
  "data": [/* Array of data records */],
  "count": 100
}
```

#### POST /api/export/excel

Generate and download an Excel file.

**Request:**
(Same as preview endpoint, but with `preview_only: false`)

**Response:**
Excel file download

## Common Issues & Debugging Guide

### Connection Issues

1. **Database Connection Failures**
   - Verify SQL Server credentials are correct
   - Ensure the SQL Server is accessible from the backend server
   - Check that the ODBC Driver is installed correctly
   - Verify firewall settings allow the connection

2. **Token Expiration**
   - The default token expiration is set to 5 minutes
   - If experiencing frequent logouts, check the `ACCESS_TOKEN_EXPIRE_MINUTES` setting in `main.py`

### Data Export Issues

1. **No Data in Preview**
   - Verify the export parameters are correct
   - Check that the date range contains data
   - Ensure the stored procedure is working correctly

2. **Excel Export Failures**
   - Check for sufficient disk space for temporary files
   - Verify the Excel template exists in the correct location
   - For large datasets, increase the server timeout settings

### Performance Optimization

1. **Slow Data Preview**
   - Limit the number of records in the preview
   - Add appropriate indexes to the database tables

2. **Slow Excel Generation**
   - Use chunking for large datasets (set `useChunking: true` and `chunkSize: 5000`)
   - Consider using server-side pagination

## Future Enhancement Opportunities

1. **Data Caching**: Implement client-side caching for frequently accessed data
2. **Export Templates**: Add support for custom export templates
3. **Batch Operations**: Enable batch export functionality
4. **Advanced Filtering**: Implement more sophisticated data filtering options
5. **User Preferences**: Add user-specific settings and preferences