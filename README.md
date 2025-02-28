# DBExportHub

A web-based application for exporting SQL Server data to Excel based on specific conditions.

## Overview

DBExportHub is a modern replacement for an outdated VB6 application that exports trade/shipping data from SQL Server to Excel. The application provides a user-friendly interface for specifying export parameters, previewing data, and downloading formatted Excel files.

## Features

- Secure database connection with dynamic credentials
- Parameter-based data extraction
- Data preview capability (first 100 records)
- Excel export with proper formatting
- Optimized for large datasets

## Tech Stack

### Frontend
- React.js
- Material-UI for styling
- React Hooks for state management
- Axios for API calls

### Backend
- FastAPI (Python)
- pyodbc for SQL Server connectivity
- OpenPyXL for Excel generation
- JWT for authentication (optional)
- Uvicorn web server

### Database
- Microsoft SQL Server
- Existing stored procedures

## Project Structure

```
DBExportHub/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py       # FastAPI entry point
│   │   ├── config.py     # Configuration settings
│   │   ├── models.py     # Pydantic models
│   │   ├── database.py   # Database connection
│   │   ├── auth.py       # Authentication
│   │   └── api/          # API endpoints
│   │       ├── __init__.py
│   │       ├── export.py # Export endpoints
│   │       └── auth.py   # Auth endpoints
│   ├── requirements.txt  # Python dependencies
│   └── .env.example      # Environment variables example
└── frontend/            # React application
    ├── public/
    ├── src/
    │   ├── components/   # React components
    │   ├── pages/        # Page components
    │   ├── services/     # API services
    │   ├── utils/        # Utility functions
    │   ├── App.js        # Main App component
    │   └── index.js      # Entry point
    ├── package.json      # NPM dependencies
    └── .env.example      # Environment variables example
```

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- SQL Server
- ODBC Driver for SQL Server

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

5. Create a `.env` file based on `.env.example` and configure your database settings.

6. Run the FastAPI server:
   ```
   uvicorn app.main:app --reload
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

3. Create a `.env` file based on `.env.example` and configure your API URL.

4. Start the development server:
   ```
   npm start
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Log in with your database credentials
3. Enter export parameters
4. Preview data (optional)
5. Export to Excel

## License

This project is licensed under the MIT License.

# DBExportHub - Testing Guide

## Prerequisites
- Python 3.8 or higher
- Running instance of SQL Server
- Database with test data

## Steps to Test the Application

### 1. Start the Backend Server
Navigate to the backend directory and start the server:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

### 2. Run the Test Script
Use the provided test script to verify all API endpoints:

```bash
python test_script.py
```

This script tests:
- Health check endpoint
- Database login functionality
- Data preview capability
- Excel export functionality

### 3. Run Automated Tests (Optional)
For more comprehensive testing:

```bash
pip install pytest
pytest tests/test_api.py -v
```

## Troubleshooting

### Common Issues:
1. **Connection Errors**: Verify SQL Server credentials and that the server is accepting connections
2. **Missing Dependencies**: Make sure all requirements are installed
3. **Permission Issues**: Check that the application has permission to create files in the output directory

### Logs:
Check the server logs for detailed error messages.

## Manual Testing
You can also test the API endpoints manually using curl or Postman:

### Health Check
```
GET http://localhost:8000/api/health
```

### Login
```
POST http://localhost:8000/api/login
Content-Type: application/json

{
  "server": "your_server",
  "database": "your_database",
  "username": "your_username",
  "password": "your_password"
}
```

### Preview Data
```
POST http://localhost:8000/api/preview
Content-Type: application/json

{
  "server": "your_server",
  "database": "your_database",
  "username": "your_username",
  "password": "your_password",
  "query": "SELECT TOP 10 * FROM YourTable",
  "parameters": {}
}
```

### Export Data
```
POST http://localhost:8000/api/export
Content-Type: application/json

{
  "server": "your_server",
  "database": "your_database",
  "username": "your_username",
  "password": "your_password",
  "query": "SELECT * FROM YourTable",
  "parameters": {},
  "filename": "export.xlsx"
}
```