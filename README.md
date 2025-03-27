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

### Progress Tracking System

The application features a real-time operation tracking system:
- Each export operation gets a unique identifier
- Backend sends progress updates during long-running operations
- Frontend displays a progress bar with percentage and status
- Users can cancel operations at any point
- Automatic cleanup of cancelled or incomplete operations

### Error Handling

DBExportHub includes a comprehensive error handling system:
- Structured logging with different log levels (INFO, DEBUG, ERROR)
- Custom error responses with meaningful messages
- Frontend error display with user-friendly messages
- Automatic resource cleanup on error
- Error tracking with operation IDs for troubleshooting

### Memory Optimization

For handling large datasets efficiently:
- Data is processed in chunks to minimize memory usage
- Excel files are generated with constant memory mode
- Configurable batch sizes for database operations
- Automatic garbage collection during large operations
- Temporary file management with cleanup

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
- XlsxWriter and OpenPyXL for Excel generation
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

Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

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
   DB_DRIVER=ODBC Driver 17 for SQL Server
   TEMP_DIR=./temp
   TEMPLATES_DIR=./templates
   LOGS_DIR=./logs
   ```

6. Create required directories:
   ```
   mkdir -p logs temp templates
   ```

7. Run the FastAPI server:
   ```
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   python -m uvicorn app.main:app --reload

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

5. Access the application at `http://localhost:3000` or `http://localhost:5173` (depending on Vite configuration)

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

- `POST /login`: Authenticates user with SQL Server credentials
  - Request: `{ server, database, username, password }`
  - Response: `{ token, user_info }`

### Export Endpoints

- `POST /api/export/preview`: Get a preview of export data
  - Request: Export parameters (fromMonth, toMonth, filters)
  - Response: `{ data, operation_id, total_records }`

- `POST /api/export/excel`: Generate and download Excel file
  - Request: Export parameters (fromMonth, toMonth, filters)
  - Response: Excel file download

### Operation Endpoints

- `GET /api/operations/{operation_id}/progress`: Get operation progress
  - Response: `{ progress, status, message }`

- `POST /api/operations/{operation_id}/cancel`: Cancel an operation
  - Response: `{ success, message }`

## Deployment Guide

### Production Deployment

1. **Backend Deployment**:
   - Use a production ASGI server:
     ```
     gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
     ```
   - Configure a reverse proxy (Nginx/Apache) to forward requests
   - Set up SSL certificates for secure communication
   - Configure environment variables for production settings

2. **Frontend Deployment**:
   - Build the frontend for production:
     ```
     npm run build
     ```
   - Serve the static files using Nginx or any static file server
   - Configure CORS headers to allow communication with the backend
   - Set up content delivery networks (CDNs) for improved performance

3. **Security Considerations**:
   - Use HTTPS for all communications
   - Configure proper firewall rules
   - Implement rate limiting to prevent abuse
   - Regularly update dependencies for security patches
   - Set up proper backup systems

## Performance Optimizations

DBExportHub includes several optimizations for handling large datasets:

1. **Chunked Data Processing**: Data is fetched and processed in manageable chunks
2. **Memory-Efficient Excel Generation**: XlsxWriter with constant memory mode
3. **Database Connection Pooling**: Efficient connection management
4. **Progressive Loading**: UI displays data as it becomes available
5. **Background Processing**: Long-running operations don't block the UI
6. **Cache Utilization**: Temporary tables for improved query performance
7. **Resource Cleanup**: Automatic cleanup of temporary files and resources

## Troubleshooting

Please refer to the `installation_guide.txt` for detailed troubleshooting steps and common issues.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software and is not licensed for public use.

## Acknowledgements

- FastAPI for the efficient API framework
- React and Material-UI for the frontend components
- Microsoft for SQL Server and ODBC drivers
- All the open-source libraries that made this project possible
