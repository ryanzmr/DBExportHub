# Excel Templates Directory

This directory contains Excel template files used by the DBExportHub application for formatted data exports.

## Template Files

- **EXDPORT_Tamplate_JNPT.xlsx**: Main Excel template used for shipping/trade data exports
  
## How Templates Work

The application uses these templates to generate professionally formatted Excel files by:

1. Loading the template file as a base
2. Populating headers and data from the SQL Server query results
3. Applying styles and formats specified in the application
4. Adjusting column widths based on content
5. Adding metadata like export date and parameters

## Customizing Templates

If you need to customize the export format:

1. Modify the existing template or create a new one with your desired styling
2. Update the `excel_utils.py` file to reference your template
3. Ensure column mappings in the code match your template structure

## Important Notes

- Do not delete or rename templates without updating the corresponding code
- Templates should maintain consistent structure for proper data mapping
- Font styles, colors, and other formatting are preserved from the template