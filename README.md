# DBExportHub

A modern web-based application for exporting SQL Server data to Excel with advanced filtering, preview capabilities, and optimized performance.

## Project Overview

DBExportHub is a full-stack web application designed to replace an outdated VB6 application for exporting trade/shipping data from SQL Server to Excel. It provides a user-friendly interface for specifying export parameters, previewing data, and downloading properly formatted Excel files optimized for large datasets.

The application follows a modern client-server architecture with a React frontend and FastAPI backend, communicating via RESTful API endpoints. It implements token-based authentication, secure database connections, and optimized data processing for handling large export operations.

## Key Features

- **Secure Authentication**: Token-based authentication with automatic expiry handling
- **Dynamic Database Connection**: Connect to any SQL Server database with proper credentials
- **Advanced Filtering**: Multiple parameter options for precise data extraction
- **Interactive Data Preview**: View sample data (configurable up to 1000 records) before export
- **Optimized Excel Export**: Efficient generation of properly formatted Excel files
- **Large Dataset Support**: Chunked data processing for handling millions of records
- **Responsive UI**: Modern Material-UI interface that works across devices
- **Cancellable Operations**: Ability to cancel long-running preview or export operations

## Architecture Breakdown

### Frontend Architecture

- **React Components**: Modular component structure with separation of concerns
- **Context API**: Global state management for authentication and application state
- **API Services**: Centralized API communication layer with error handling
- **Material-UI**: Consistent styling and responsive design

### Backend Architecture

- **FastAPI Framework**: High-performance asynchronous API endpoints
- **Pydantic Models**: Strong typing and validation for request/response data
- **JWT Authentication**: Secure token-based authentication system
- **Database Layer**: Abstracted database access with connection pooling
- **Excel Generation**: Optimized Excel file creation with proper formatting

### Data Flow

1. **Authentication**: User provides database credentials which are validated against SQL Server
2. **Parameter Selection**: User selects export parameters (date range, filters, etc.)
3. **Data Preview**: Backend executes stored procedure with parameters and returns sample data
4. **Export Process**: On export request, backend processes data in chunks and generates Excel file
5. **File Download**: Generated Excel file is streamed to the client for download

## Tech Stack

### Frontend
- **React.js**: UI library for building component-based interfaces
- **Material-UI**: Component library for consistent styling
- **React Router**: Client-side routing
- **Axios**: HTTP client for API communication
- **Context API**: State management

### Backend
- **FastAPI**: Modern, fast Python web framework
- **pyodbc**: SQL Server connectivity
- **pandas**: Data manipulation and processing
- **xlsxwriter**: High-performance Excel file generation
- **JWT**: Token-based authentication
- **Pydantic**: Data validation and settings management
- **Uvicorn**: ASGI web server

### Database
- **Microsoft SQL Server**: Primary data source
- **Stored Procedures**: Pre-defined database queries for data extraction

## Project Structure

```
DBExportHub/
├── backend/                # FastAPI application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py        # FastAPI entry point
│   │   ├── config.py      # Configuration settings
│   │   ├── models.py      # Pydantic models
│   │   ├── database.py    # Database connection
│   │   └── api/           # API endpoints
│   │       ├── __init__.py
│   │       ├── export.py  # Export endpoints
│   │       └── auth.py    # Auth endpoints
│   ├── requirements.txt   # Python dependencies
│   └── templates/         # Excel templates
└── frontend/              # React application
    ├── src/
    │   ├── components/    # Reusable UI components
    │   │   ├── ExportForm.jsx
    │   │   ├── ExportHeader.jsx
    │   │   └── PreviewTable.jsx
    │   ├── contexts/      # React contexts
    │   │   └── AuthContext.jsx
    │   ├── pages/         # Page components
    │   │   ├── LoginPage.jsx
    │   │   └── ExportPage.jsx
    │   ├── services/      # API services
    │   │   └── api.js
    │   ├── utils/         # Utility functions
    │   │   └── exportUtils.js
    │   ├── styles/        # Shared styles
    │   ├── App.jsx        # Main App component
    │   └── index.jsx      # Entry point
    ├── package.json       # NPM dependencies
    └── .env.example       # Environment variables example
```

## Core Components Explained

### Backend Components

- **main.py**: Application entry point, configures FastAPI, defines routes
- **config.py**: Application settings and configuration management
- **database.py**: Database connection handling and query execution
- **models.py**: Data models for request/response validation
- **api/export.py**: Export functionality including preview and Excel generation
- **api/auth.py**: Authentication logic and JWT token management

### Frontend Components

- **AuthContext.jsx**: Authentication state management and token handling
- **ExportPage.jsx**: Main page for export functionality
- **ExportForm.jsx**: Form for configuring export parameters
- **PreviewTable.jsx**: Data preview component with formatting
- **exportUtils.js**: Utility functions for API calls and export handling

## API Documentation

### Authentication Endpoints

#### `POST /api/auth/login`
- **Purpose**: Authenticate user with database credentials
- **Request Body**:
  ```json
  {
    "server": "your_server",
    "database": "your_database",
    "username": "your_username",
    "password": "your_password"
  }
  ```
- **Response**: JWT token for authenticated requests
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 1800
  }
  ```

#### `POST /api/auth/refresh`
- **Purpose**: Refresh an existing authentication token
- **Request Body**:
  ```json
  {
    "token": "current_token"
  }
  ```
- **Response**: New JWT token with extended expiration

### Export Endpoints

#### `POST /api/export/preview`
- **Purpose**: Generate a preview of data based on export parameters
- **Request Body**:
  ```json
  {
    "server": "your_server",
    "database": "your_database",
    "username": "your_username",
    "password": "your_password",
    "fromMonth": 202101,
    "toMonth": 202112,
    "hs": "7308",
    "prod": "%steel%",
    "iec": "1234567890",
    "expCmp": "%ltd%",
    "forcount": "USA,UK",
    "forname": "%corp%",
    "port": "JNPT",
    "max_records": 100
  }
  ```
- **Response**: Preview data and record count
  ```json
  {
    "data": [...],
    "count": 100
  }
  ```

#### `POST /api/export/excel`
- **Purpose**: Generate and download Excel file based on export parameters
- **Request Body**: Same as preview endpoint, without `max_records`
- **Response**: Excel file download

## Setup Instructions

### Prerequisites

- **Node.js**: v16+ (for frontend)
- **Python**: v3.8+ (for backend)
- **SQL Server**: Any recent version
- **ODBC Driver**: SQL Server ODBC Driver 17 or compatible

### Backend Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/DBExportHub.git
   cd DBExportHub
   ```

2. **Create and activate a virtual environment**:
   ```bash
   cd backend
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   
   The backend requires the following dependencies:
   - FastAPI (>=0.68.0): Modern, fast Python web framework
   - Uvicorn (>=0.15.0): ASGI web server
   - PyODBC (>=4.0.32): SQL Server connectivity
   - Pandas (>=1.3.3): Data manipulation and processing
   - Python-dotenv (>=0.19.0): Environment variable management
   - Pydantic (>=1.8.2): Data validation and settings management
   - OpenPyXL (>=3.0.9): Excel file handling
   - Python-multipart (>=0.0.5): Form data parsing
   - PyJWT (>=2.3.0): JWT token authentication
   - NumPy (>=1.20.0): Numerical operations
   - Pathlib (>=1.0.1): File path handling
   - JSON5 (>=0.9.6): JSON processing

4. **Create environment configuration**:
   - Create a `.env` file in the backend directory
   - Add the following variables:
     ```
     SECRET_KEY=your_secret_key_here
     ACCESS_TOKEN_EXPIRE_MINUTES=30
     ```

5. **Run the FastAPI server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   The API will be available at http://localhost:8000

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   
   The frontend requires the following dependencies:
   - React (^18.2.0): UI library for building component-based interfaces
   - React Router DOM (^6.11.1): Client-side routing
   - Material-UI (^5.16.14): Component library for consistent styling
   - Axios (^1.4.0): HTTP client for API communication
   - Vite (^6.2.0): Build tool and development server

3. **Create environment configuration**:
   - Create a `.env` file in the frontend directory based on the provided `.env.example`
   - Add the following variables:
     ```
     VITE_API_URL=http://localhost:8000
     ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will be available at http://localhost:5173

5. **Build for production**:
   ```bash
   npm run build
   ```
   The production-ready files will be available in the `dist` directory.

## Usage Guide

### Authentication

1. Open the application in your browser
2. Enter your SQL Server credentials:
   - Server name/IP
   - Database name
   - Username
   - Password
3. Click "Login" to authenticate

### Exporting Data

1. Configure export parameters:
   - Select date range (required)
   - Enter HS Code filter (optional)
   - Enter Product description filter (optional)
   - Enter IEC filter (optional)
   - Enter Exporter company filter (optional)
   - Enter Foreign country filter (optional)
   - Enter Foreign importer name filter (optional)
   - Enter Port filter (optional)

2. Click "Preview Data" to see a sample of the data

3. Review the preview data in the table below

4. Click "Export to Excel" to generate and download the Excel file

5. Wait for the export process to complete (progress will be displayed)

6. The Excel file will automatically download when ready

## Recent Enhancements

### Frontend Improvements

- **Component Modularization**: Refactored into smaller, reusable components
- **Authentication System**: Implemented robust token-based authentication
- **Data Visualization**: Enhanced preview table with better styling and functionality
- **Responsive Design**: Improved mobile compatibility

### Backend Optimizations

- **API Performance**: Improved response times with connection pooling
- **Excel Generation**: Switched to xlsxwriter for better performance with large datasets
- **Security Enhancements**: Improved JWT implementation and credential handling

## Troubleshooting Guide

### Common Issues

#### Connection Errors

- **Issue**: Unable to connect to SQL Server
- **Solution**: 
  - Verify server name/IP is correct
  - Ensure SQL Server is running and accessible from your network
  - Check that the provided user has access to the specified database
  - Verify that the ODBC driver is properly installed

#### Export Timeout

- **Issue**: Export operation times out for large datasets
- **Solution**:
  - Use more specific filters to reduce the dataset size
  - Increase the timeout setting in the backend configuration
  - Consider splitting the export into smaller date ranges

#### Excel File Format Issues

- **Issue**: Excel file formatting is incorrect
- **Solution**:
  - Check that the Excel template is properly configured
  - Verify that the column mappings match the expected format
  - Update the column width settings in the export.py file

### Debugging

- **Backend Logs**: Check the console where the backend server is running
- **Frontend Console**: Open browser developer tools (F12) and check the console for errors
- **Network Requests**: Monitor API calls in the browser's Network tab

## Development Guide

### Adding New Features

1. **New Export Parameter**:
   - Add the parameter to the `ExportParameters` model in `models.py`
   - Update the `ExportForm.jsx` component to include the new field
   - Modify the stored procedure call in `export.py` to include the new parameter

2. **Custom Excel Formatting**:
   - Modify the `generate_excel` function in `export.py`
   - Update the column width settings and formatting options

### Running Tests

```bash
# Backend tests
cd backend
pip install pytest
pytest tests/

# Frontend tests
cd frontend
npm test
```

## License

This project is licensed under the MIT License.

## Contributors

- Initial Development Team
- Enhancement Support Team (March 2025)