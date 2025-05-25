# DBExportHub

A modern web-based application for exporting and importing SQL Server trade/shipping data to Excel based on specific filtering conditions.

## Project Overview

DBExportHub is a comprehensive replacement for a legacy VB6 application, designed to efficiently extract, process, and export trade/shipping data from SQL Server databases to formatted Excel files. The application features a user-friendly interface for setting export parameters, previewing data, and downloading Excel reports. Additionally, it now includes an import functionality for reverse data flow operations.

## Core Features

- **Secure Database Connectivity**: Dynamic SQL Server authentication with JWT token-based session management
- **Flexible Data Filtering**: Multiple parameter options for precise data extraction (date range, HS codes, companies, countries, etc.)
- **Interactive Data Preview**: View the first 100 records before exporting full datasets
- **Excel Export with Professional Formatting**: Properly formatted spreadsheets with custom styling
- **Large Dataset Handling**: Optimized for handling millions of records with memory-efficient processing
- **Real-time Progress Tracking**: Live updates on operation progress with percentage completion
- **Operation Management**: Ability to cancel long-running operations
- **Comprehensive Logging**: Detailed activity tracking for troubleshooting and auditing
- **Error Handling**: Graceful error recovery with user-friendly messages
- **Responsive UI**: Modern Material UI design that works across devices
- **Data Import Capability**: Support for importing data back into SQL Server (new feature)

## Technical Architecture

### System Architecture Overview

DBExportHub implements a modern client-server architecture with clear separation of concerns:

1. **Frontend Layer** (React.js):
   - User interface and interaction handling
   - Form validation and data presentation
   - Authentication state management
   - HTTP request management with Axios
   - Progress tracking visualization

2. **Backend Layer** (FastAPI):
   - RESTful API endpoints for data operations
   - Database connection management
   - Authentication and security
   - Data processing and transformation
   - Excel file generation
   - Progress tracking system
   - Logging and error handling

3. **Database Layer** (Microsoft SQL Server):
   - Data storage
   - Stored procedures for data extraction
   - Transaction management

### Authentication Flow

The application implements a secure authentication flow:

1. User enters SQL Server credentials (server, database, username, password)
2. Backend validates the connection by attempting to connect to the database
3. Upon successful connection, a JWT token is generated containing connection details (excluding password)
4. Token is returned to the frontend with a configurable expiration time (default: 60 minutes)
5. Frontend stores the token in session storage and includes it in the Authorization header for all subsequent API calls
6. Backend validates the token for each request and extracts connection details

**Security Features**:
- Password is never stored in the token or client-side storage
- Token expiration handling with auto-logout
- Custom JWT implementation with fallback mechanism for compatibility
- CORS protection for API endpoints

### Data Export Process

The export workflow is designed for efficiency and user experience:

1. **Parameter Selection**:
   - User selects date range (fromMonth, toMonth) and optional filters
   - Form validates input before submission

2. **Preview Generation**:
   - Frontend requests a preview with preview_only=true parameter
   - Backend executes the stored procedure with limited output (max_records=100)
   - Results are returned as JSON with column metadata
   - Frontend displays the preview in a data grid

3. **Excel Generation**:
   - User initiates full export after reviewing preview
   - Backend creates a unique operation ID for tracking
   - Stored procedure is executed with full data retrieval
   - Data is processed in chunks to optimize memory usage
   - Excel workbook is created with XlsxWriter in constant_memory mode
   - Progress updates are sent to frontend during processing
   - Completed file is streamed to the user's browser
   - Temporary files are automatically cleaned up

4. **Excel Row Limit Handling**:
   - System checks if result set exceeds Excel's row limit (1,048,576 rows)
   - If exceeded, user is prompted to confirm partial export
   - User can choose to continue (with truncated data) or cancel

### Memory Optimization and Performance

The application employs several techniques to handle large datasets efficiently:

1. **Chunked Data Processing**:
   - Data is fetched and processed in configurable batches
   - Each batch is written to Excel and then released from memory
   - Prevents out-of-memory errors when dealing with millions of rows

2. **Constant Memory Excel Generation**:
   - XlsxWriter is configured in constant_memory mode
   - Worksheet data is written sequentially and flushed to disk
   - Significantly reduces memory footprint for large exports

3. **Garbage Collection**:
   - Explicit garbage collection after processing large chunks
   - Temporary object cleanup to free resources

4. **Database Optimization**:
   - Efficient parameter passing to stored procedures
   - Connection pooling and proper connection closure
   - Temporary table usage for intermediate results

### Operation Tracking System

The application includes a sophisticated operation tracking system:

1. Each operation (preview, export) receives a unique identifier
2. Operation status is maintained in an in-memory tracker
3. Clients can poll for progress updates via a dedicated endpoint
4. Progress is reported as percentage complete with status message
5. Users can cancel operations at any point
6. Automatic cleanup of abandoned operations after configurable timeout

## Tech Stack

### Frontend
- **React.js (v18.2.0)**: Core UI library with React Router (v6.11.1) for SPA navigation
- **Material-UI (v5.16.14)**: Component library including:
  - MUI Data Grid (v7.27.2) for data table display
  - Date Pickers Pro (v7.27.1) for advanced date selection
  - Theme customization for consistent styling
- **State Management**: React Context API and Hooks (useState, useEffect, useRef) 
- **HTTP Client**: Axios (v1.4.0) with interceptors for authentication headers
- **Build System**: Vite (v6.2.0) for fast development and optimized production builds
- **Date Library**: Day.js (v1.11.13) for date formatting and manipulation
- **Form Handling**: Controlled components with custom validation

### Backend
- **FastAPI (Python)**: Modern, high-performance API framework with automatic OpenAPI documentation
- **Database Connectivity**: pyodbc for SQL Server connections with connection pooling
- **Data Processing**: pandas for efficient data manipulation and transformation
- **Excel Generation**: 
  - XlsxWriter for high-performance Excel file creation with constant memory mode
  - Custom formatting and styling modules
- **Authentication**: PyJWT for token generation and validation with fallback mechanism
- **Web Server**: Uvicorn ASGI server with websocket support
- **Logging**: Python JSON Logger for structured, searchable logs with emoji support
- **Error Handling**: Custom exception handlers with detailed error reporting
- **Progress Tracking**: In-memory operation tracker with polling endpoint

### Database
- **Microsoft SQL Server**: Core database engine
- **Stored Procedures**: Custom procedures for efficient data extraction
- **ODBC Driver**: Driver 17 for SQL Server (configurable)

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
│   ├── __init__.py         # Package initialization
│   ├── main.py             # FastAPI entry point with route definitions
│   ├── config.py           # Environment and application configuration
│   ├── models.py           # Pydantic data models for validation
│   ├── database.py         # SQL Server connection management
│   ├── logger.py           # Structured logging configuration
│   └── api/                # API endpoints and business logic
│       ├── __init__.py     # API package initialization
│       ├── auth.py         # Authentication utilities
│       ├── cancel.py       # Operation cancellation handlers
│       ├── data_processing.py  # Data transformation utilities
│       ├── database_operations.py  # Database query execution
│       ├── excel_utils.py  # Excel file generation utilities
│       ├── export.py       # Export endpoint implementation
│       ├── export_service.py  # Core export business logic
│       ├── import_module.py  # Import functionality implementation
│       ├── logging_utils.py  # Specialized logging functions
│       └── operation_tracker.py  # Progress tracking system
├── logs/                   # Application log files
├── temp/                   # Temporary storage for generated files
├── templates/              # Excel template files
├── venv/                   # Python virtual environment
├── requirements.txt        # Python dependencies
└── .env                    # Environment variables configuration
```

### Frontend Structure

```
frontend/
├── src/                    # Source code
│   ├── components/         # Reusable UI components
│   │   ├── dashboard/      # Dashboard-specific components
│   │   │   ├── ExportForm.jsx       # Export parameter form
│   │   │   ├── ExportHeader.jsx     # Dashboard header
│   │   │   ├── PreviewTable.jsx     # Data preview grid
│   │   │   ├── RecordCountBox.jsx   # Record count display
│   │   │   ├── ProgressTracker.jsx  # Export progress tracking
│   │   │   └── ExcelRowLimitDialog.jsx  # Excel limit warning
│   │   ├── Navigation.jsx  # App navigation component
│   │   └── common/         # Shared UI components
│   ├── hooks/              # Custom React hooks
│   │   └── useProgress.js  # Hook for tracking operation progress
│   ├── pages/              # Application pages
│   │   ├── Login/          # Login page components
│   │   ├── Dashboard/      # Main dashboard page
│   │   │   ├── ExportPage.jsx  # Export functionality
│   │   │   └── Import.jsx      # Import functionality
│   │   └── HomePage.jsx    # Application home page
│   ├── services/           # API service layer
│   │   └── api.js          # Axios API client configuration
│   ├── utils/              # Utility functions
│   │   ├── exportUtils.js  # Export-related helper functions
│   │   └── formatters.js   # Data formatting utilities
│   ├── App.jsx             # Main application component
│   ├── index.jsx           # Application entry point
│   ├── theme.js            # Material UI theme configuration
│   └── index.css           # Global styles
├── public/                 # Static assets
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
