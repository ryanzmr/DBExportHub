# DBExportHub - Import Feature

## Overview

The Import feature is an extension of the DBExportHub application that allows users to import trade/shipping data from SQL Server to Excel. It follows the same architecture and workflow as the Export feature but uses different stored procedures and views specifically designed for import operations.

## Features

- Parameter-based data filtering
- Data preview capability (first 100 records)
- Excel generation with proper formatting
- Progress tracking during operations
- Cancellable operations
- Comprehensive logging

## Implementation

The Import feature has been implemented as a parallel module to the existing Export feature, following the same modular design principles. The implementation includes:

### Backend Components

- `import.py`: FastAPI router for import endpoints
- `import_service.py`: Service layer for import operations
- `database_operations_import.py`: Database operations for import
- `excel_utils_import.py`: Excel utilities for import

### Configuration

The Import feature uses the following environment variables:

- `IMPORT_STORED_PROCEDURE`: The name of the stored procedure to execute (default: `ImportJNPTData_New1`)
- `IMPORT_VIEW`: The name of the view to retrieve data from (default: `IMPDATA`)

### API Endpoints

- `POST /api/import/preview`: Returns a preview of the data based on the specified parameters
- `POST /api/import/excel`: Generates an Excel file with all the data based on the specified parameters

## Usage

1. Configure the Import parameters in the frontend
2. Use the Preview button to see a sample of the data
3. Use the Generate Excel button to create and download the full Excel file

## Differences from Export Feature

The Import feature is nearly identical to the Export feature in terms of architecture and workflow, with the following key differences:

- Uses `ImportJNPTData_New1` stored procedure instead of `ExportData_New1`
- Uses `IMPDATA` view instead of `EXPDATA`
- Uses `impCmp` parameter instead of `expCmp`
- Generated Excel files have `IMP` suffix instead of `EXP`

## Logging

The Import feature uses a dedicated logger (`import_logger`) to distinguish import operations from export operations in the logs.

## For More Information

See the detailed [Import Configuration Guide](./IMPORT_CONFIGURATION_GUIDE.md) for more information on how to use the Import feature.