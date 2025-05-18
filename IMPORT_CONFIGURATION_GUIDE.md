# DBExportHub - Import Configuration Guide

## Overview

The Import feature in DBExportHub allows users to import trade/shipping data from SQL Server to Excel. It follows the same architecture and workflow as the Export feature but uses different stored procedures and views specifically designed for import operations.

## Import Parameters

The Import feature accepts the following parameters:

- **From Month**: Start month in format YYYYMM (e.g., 202101 for January 2021)
- **To Month**: End month in format YYYYMM (e.g., 202112 for December 2021)
- **HS Code**: Filter by HS Code
- **Product**: Filter by product description
- **IEC**: Filter by IEC code
- **Importer**: Filter by importer company name
- **Foreign Country**: Filter by foreign country
- **Foreign Exporter**: Filter by foreign exporter name
- **Port**: Filter by port name

## Import Process

1. Connect to the database using provided credentials
2. Execute the `ImportJNPTData_New1` stored procedure with the specified parameters
3. Retrieve data from the `IMPDATA` view
4. Generate an Excel file with proper formatting
5. Return the Excel file for download

## Backend Processing Flow

1. User enters parameters in the Import Configuration form
2. Frontend sends these parameters to the backend API
3. Backend connects to SQL Server using provided credentials
4. Backend executes the stored procedure `ImportJNPTData_New1` with parameters
5. Data is filtered according to the parameters
6. For preview: First 100 records are returned to the frontend
7. For export: All matching records are formatted into Excel using the template
8. Excel file is sent back to the frontend for download

## API Endpoints

### Preview Data

```
POST /api/import/preview
```

This endpoint returns a preview of the data (first 100 records) based on the specified parameters.

### Generate Excel

```
POST /api/import/excel
```

This endpoint generates an Excel file with all the data based on the specified parameters and returns it for download.

## Excel File Naming Convention

The generated Excel files follow this naming convention:

```
[Parameters]_[MonthYearRange]IMP.xlsx
```

Where:
- `Parameters` is a combination of the filter parameters (HS Code, Product, IEC, etc.)
- `MonthYearRange` is the month and year range in the format MMMYY (e.g., JAN21-DEC21)
- `IMP` indicates that this is an import file

## Implementation Details

The Import feature is implemented using the following components:

- `import.py`: FastAPI router for import endpoints
- `import_service.py`: Service layer for import operations
- `database_operations_import.py`: Database operations for import
- `excel_utils_import.py`: Excel utilities for import

The implementation follows the same modular design as the Export feature, with clear separation of concerns and reuse of common utilities where possible.

## Environment Variables

The Import feature uses the following environment variables:

- `IMPORT_STORED_PROCEDURE`: The name of the stored procedure to execute (default: `ImportJNPTData_New1`)
- `IMPORT_VIEW`: The name of the view to retrieve data from (default: `IMPDATA`)

These variables can be configured in the `.env` file.