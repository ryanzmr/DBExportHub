# DBExportHub - Configuration Guide

This document provides a detailed explanation of the Export and Import Configuration in the DBExportHub dashboard.

## Common Features

Both Import and Export operations share these common features:

- Parameter-based filtering
- Data preview capability
- Excel file generation
- Progress tracking
- Operation cancellation
- Comprehensive logging

## Parameters

### Common Parameters (Export & Import)

| Frontend Field | Backend Parameter | Type | Required | Format | Description |
|---------------|-------------------|------|----------|---------|-------------|
| From Month | `fromMonth` | Integer | Yes | YYYYMM | Start month for data extraction (e.g., 202401) |
| To Month | `toMonth` | Integer | Yes | YYYYMM | End month for data extraction (e.g., 202412) |
| HS Code | `hs` | String | No | Numeric | Harmonized System code for product classification |
| Product Description | `prod` | String | No | Text | Filter by product description (partial match) |
| IEC Code | `iec` | String | No | Alphanumeric | Importer/Exporter Code for entity identification |
| Port | `port` | String | No | Text | Filter by port of entry/exit |

### Export Parameters

| Frontend Field | Backend Parameter | Type | Required | Description |
|---------------|-------------------|------|----------|-------------|
| Exporter Company | `expCmp` | String | No | Company name making the export |
| Importing Country | `forcount` | String | No | Destination country for exports |
| Importer Name | `forname` | String | No | Foreign entity receiving the goods |

### Import Parameters

| Frontend Field | Backend Parameter | Type | Required | Description |
|---------------|-------------------|------|----------|-------------|
| Importer Company | `impCmp` | String | No | Local company receiving imports |
| Exporting Country | `forcount` | String | No | Country of origin for imports |
| Foreign Exporter | `forname` | String | No | Foreign entity sending the goods |

### Parameter Validation Rules

1. **Date Range Parameters**:
   - Frontend validates that `fromMonth` ≤ `toMonth`
   - Maximum range span is configurable (default: 12 months)
   - Values must be in format YYYYMM (e.g., 202401)

2. **HS Code Format**:
   - 2-8 digits numeric code
   - Frontend allows multiple codes separated by commas
   - Backend processes as SQL LIKE patterns

3. **Company Names**:
   - Case-insensitive search
   - Supports partial matches
   - Special characters are escaped in backend

4. **Port Names**:
   - Must match predefined port codes
   - Case-insensitive comparison
   - Supports partial matches

### API Parameter Transformation

Frontend to Backend transformation examples:

```javascript
// Frontend Form Data
{
  fromMonth: "2024-01",  // Date picker value
  toMonth: "2024-12",    // Date picker value
  hsCode: "84, 85",      // User input with commas
  productDesc: "Mobile Phone"
}

// Transformed to Backend Format
{
  fromMonth: 202401,     // Integer YYYYMM
  toMonth: 202412,       // Integer YYYYMM
  hs: "84,85",          // Comma-separated string
  prod: "Mobile Phone"   // Text as is
}
```

### Example API Calls

1. **Export Preview Request**:
```json
POST /api/exports/preview
{
  "fromMonth": 202401,
  "toMonth": 202412,
  "hs": "8517",
  "prod": "Mobile Phone",
  "expCmp": "TECH EXPORTS LTD",
  "forcount": "UNITED STATES",
  "forname": "APPLE INC"
}
```

2. **Import Preview Request**:
```json
POST /api/imports/preview
{
  "fromMonth": 202401,
  "toMonth": 202412,
  "hs": "8517",
  "prod": "Mobile Phone",
  "impCmp": "TECH IMPORTS LTD",
  "forcount": "CHINA",
  "forname": "FOXCONN"
}
```

## Backend Processing

1. User submits parameters
2. System validates input
3. Backend executes appropriate stored procedure:
   - Export: `ExportData_New1`
   - Import: `ImportJNPTData_New1`
4. Data is retrieved from corresponding view:
   - Export: `EXPDATA`
   - Import: `IMPDATA`
5. Excel file is generated using the template
6. File is returned for download

## Excel File Naming

Files are named using this convention:
```
[Parameters]_[MonthYearRange][Type].xlsx
```
Where:
- `Parameters`: Combination of filter parameters
- `MonthYearRange`: Format MMMYY (e.g., JAN25-DEC25)
- `Type`: Either 'EXP' or 'IMP'

## Operation Control

Both Import and Export operations support:

1. **Preview**: View first 100 records before proceeding
2. **Progress Tracking**: Real-time progress updates
3. **Cancellation**: Cancel long-running operations
4. **Error Handling**: Graceful error recovery

## Database Stored Procedures

The application uses two main stored procedures for data retrieval:

#### Export Procedure
```sql
EXEC ExportData_New1 
  @fromMonth = 202401,      -- Start month (YYYYMM)
  @ToMonth = 202412,        -- End month (YYYYMM)
  @hs = '8517',            -- HS Code filter
  @prod = 'Mobile Phone',   -- Product description filter
  @Iec = '',               -- IEC code filter
  @ExpCmp = '',            -- Exporter company filter
  @forcount = '',          -- Foreign country filter
  @forname = '',           -- Foreign entity filter
  @port = ''               -- Port filter
```

#### Import Procedure
```sql
EXEC ImportJNPTData_New1
  @fromMonth = 202401,      -- Start month (YYYYMM)
  @ToMonth = 202412,        -- End month (YYYYMM)
  @hs = '8517',            -- HS Code filter
  @prod = 'Mobile Phone',   -- Product description filter
  @Iec = '',               -- IEC code filter
  @ImpCmp = '',            -- Importer company filter
  @forcount = '',          -- Foreign country filter
  @forname = '',           -- Foreign entity filter
  @port = ''               -- Port filter
```

### Database Views

The procedures populate temporary tables that are accessed through views:

1. **Export View** (`EXPDATA`):
   - Contains formatted export data
   - Includes calculated fields and currency conversions
   - Optimized for large dataset retrieval

2. **Import View** (`IMPDATA`):
   - Contains formatted import data
   - Includes additional customs-specific fields
   - Optimized for large dataset retrieval

### Data Processing Pipeline

1. **Parameter Preparation**:
   ```python
   # Backend transformation
   sp_params = {
       "fromMonth": params.fromMonth,
       "ToMonth": params.toMonth,
       "hs": params.hs or "",
       "prod": params.prod or "",
       "Iec": params.iec or "",
       "ExpCmp": params.expCmp or "",  # For export
       "ImpCmp": params.impCmp or "",  # For import
       "forcount": params.forcount or "",
       "forname": params.forname or "",
       "port": params.port or ""
   }
   ```

2. **Data Retrieval**:
   - Parameters are passed to appropriate stored procedure
   - Results are stored in temporary tables
   - Data is accessed through corresponding view
   - Results are processed in chunks for memory efficiency

3. **Excel Generation**:
   - Data is formatted according to templates
   - Currency values are properly formatted
   - Dates are converted to readable format
   - Column headers are standardized
