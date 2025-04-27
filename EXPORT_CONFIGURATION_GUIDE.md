# DBExportHub - Export Configuration Guide

This document provides a detailed explanation of the Export Configuration section in the DBExportHub dashboard, including what each field represents and how they interact with the backend system.

## Overview

The Export Configuration section allows users to specify parameters for filtering and exporting data from the SQL Server database to Excel. The system provides both basic and advanced filtering options to help users narrow down the exact data they need.

## Basic Fields

### From Month
- **Purpose**: Defines the start date for data export
- **Format**: YYYYMM (e.g., 202301 for January 2023)
- **Required**: Yes
- **Backend Parameter**: `fromMonth`
- **Processing**: Used in SQL query to filter records starting from this month

### To Month
- **Purpose**: Defines the end date for data export
- **Format**: YYYYMM (e.g., 202312 for December 2023)
- **Required**: Yes
- **Backend Parameter**: `toMonth`
- **Processing**: Used in SQL query to filter records up to this month

### HS Code
- **Purpose**: Filter by Harmonized System code (international product classification)
- **Format**: Numeric code
- **Required**: No (Optional)
- **Backend Parameter**: `hs`
- **Processing**: Filters export data to include only items with matching HS codes

### Product Description
- **Purpose**: Filter by product description text
- **Format**: Text string
- **Required**: No (Optional)
- **Backend Parameter**: `prod`
- **Processing**: Filters export data to include only items with matching text in description

## Advanced Fields

Toggle the "Advanced Options" switch to access these additional filters:

### IEC
- **Purpose**: Filter by Importer-Exporter Code
- **Format**: Alphanumeric code
- **Required**: No (Optional)
- **Backend Parameter**: `iec`
- **Processing**: Filters export data to include only items with matching IEC

### Exporter Company
- **Purpose**: Filter by exporting company name
- **Format**: Text string
- **Required**: No (Optional)
- **Backend Parameter**: `expCmp`
- **Processing**: Filters export data to include only items from specified companies

### Importer Country
- **Purpose**: Filter by importing country
- **Format**: Country name
- **Required**: No (Optional)
- **Backend Parameter**: `forcount` (in the API)
- **Processing**: Filters export data to include only items going to specified countries

### Port
- **Purpose**: Filter by port of export/import
- **Format**: Port name or code
- **Required**: No (Optional)
- **Backend Parameter**: `port`
- **Processing**: Filters export data to include only items through specified ports

### Importer Name
- **Purpose**: Filter by importing company/entity name
- **Format**: Text string
- **Required**: No (Optional)
- **Backend Parameter**: `forname` (in the API)
- **Processing**: Filters export data to include only items for specified importers

### Shipper
- **Purpose**: Filter by transportation method
- **Format**: Text string
- **Required**: No (Optional)
- **Backend Parameter**: Not directly mapped in the current implementation
- **Processing**: This field appears in the UI but its backend mapping is not explicitly defined in the current implementation. It likely filters export data by transportation mode (sea, air, road, etc.) if implemented in the backend stored procedure.

## Action Buttons

### Preview
- **Function**: Shows a preview of the first 100 records matching your criteria
- **API Endpoint**: `/api/export/preview`
- **Requirements**: From Month and To Month are mandatory
- **Processing**: Executes the stored procedure with preview_only=true and max_records=100

### Export to Excel
- **Function**: Exports all matching records to an Excel file
- **API Endpoint**: `/api/export/excel`
- **Requirements**: None - can be used directly after entering parameters
- **Processing**: Executes the stored procedure with preview_only=false and formats data using the Excel template

### Cancel
- **Function**: Cancels an ongoing preview or export operation
- **Available**: Only when an operation is in progress
- **API Endpoint**: `/api/operations/{operation_id}/cancel`
- **Processing**: Immediately stops the running operation and cleans up resources

### Reset
- **Function**: Clears all form fields to start fresh
- **Available**: When no operation is in progress

## Operation Tracking

During export operations, the system provides real-time progress tracking:

1. A progress bar indicates the percentage of completion
2. Status messages show the current operation stage
3. Estimated time remaining is displayed when available
4. For large exports, a counter shows processed records (e.g., "Processing 5,000 of 15,000 records")
5. The Cancel button is available during this time to abort the operation if needed

## Backend Processing Flow

1. User enters parameters in the Export Configuration form
2. Frontend sends these parameters to the backend API
3. Backend connects to SQL Server using provided credentials
4. Backend executes the stored procedure `ExportData_New1` with parameters
5. Data is filtered according to the parameters
6. For preview: First 100 records are returned to the frontend
7. For export: All matching records are formatted into Excel using the template
8. Excel file is sent back to the frontend for download

## Performance Considerations

When working with large datasets:

1. **Be specific with filters**: The more specific your filters, the faster the query execution and smaller the result set
2. **Consider date ranges carefully**: Very large date ranges (e.g., several years) can result in slow processing
3. **Use multiple filters**: Combining filters (e.g., HS Code + Country) can significantly reduce processing time
4. **Preview first**: Always use Preview before running a full export to verify your filter criteria
5. **Monitor export progress**: Use the progress tracking to estimate completion time
6. **Cancel if needed**: If an export is taking too long, you can cancel and refine your filters

## Excel Output Formatting

The generated Excel file includes:

1. Formatted headers with background colors
2. Appropriate column widths based on content type
3. Date formatting for date fields
4. Proper number formatting for numeric fields
5. The filename follows the pattern: `[Parameters]_[MMMYY]EXP.xlsx` (e.g., `39076000_FEB23-MAR23EXP.xlsx`)

## Tips for Effective Use

- Always use the Preview function before exporting to verify your filter criteria
- For large date ranges, consider using additional filters to reduce the dataset size
- The more specific your filters, the faster the export process will be
- Advanced filters can be combined to create highly targeted exports
- If you encounter "No Data" in preview, try broadening your filter criteria

## Troubleshooting

If you encounter issues with the export process:

1. Verify that your date range (From Month/To Month) contains data
2. Check that your filter criteria aren't too restrictive
3. Ensure you have proper permissions to access the requested data
4. For large exports, allow sufficient time for processing
5. If an export fails, check the error message for specific details
6. For memory-related issues, try a more restricted set of filters
7. If the application becomes unresponsive, refresh the page and try again with different parameters