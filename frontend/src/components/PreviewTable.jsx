import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme
} from '@mui/material';
import { TableView } from '@mui/icons-material';
import { tableStyles, cardHeaderStyles } from '../pages/styles/ExportPageStyles';

/**
 * Preview table component for displaying export data preview
 * @param {Object} props - Component props
 * @param {Array} props.previewData - Preview data to display
 * @param {number} props.previewCount - Total count of preview records
 * @param {boolean} props.loading - Loading state
 */
const PreviewTable = ({ previewData, previewCount, loading }) => {
  const theme = useTheme();
  const styles = tableStyles(theme);
  const headerStyles = cardHeaderStyles(theme);
  
  // Get table headers from the first row of preview data
  const tableHeaders = previewData.length > 0 ? Object.keys(previewData[0]) : [];

  return (
    <>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        mb: 3,
        borderBottom: `2px solid ${theme.palette.primary.main}`,
        p: 2,
        color: '#1a365d'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TableView sx={{ color: theme.palette.primary.main, mr: 2, fontSize: 26 }} />
          <Typography 
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '1.25rem',
              letterSpacing: '0.3px',
              color: '#1a365d'
            }}
          >
            Data Preview
          </Typography>
        </Box>
        {previewCount > 0 && (
          <Chip
            label={`Total Records: ${previewCount}`}
            color="primary"
            variant="outlined"
            sx={styles.recordCountChip}
          />
        )}
      </Box>
      
      {previewData.length > 0 ? (
        <TableContainer 
          component={Paper} 
          sx={styles.tableContainer}
        >
          <Table stickyHeader sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                {tableHeaders.map((header) => (
                  <TableCell 
                    key={header}
                    sx={styles.tableHeaderCell}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {previewData.map((row, index) => (
                <TableRow 
                  key={index}
                  sx={styles.tableRow}
                >
                  {tableHeaders.map((header) => {
                    const value = row[header];
                    const isNumeric = !isNaN(value) && value !== '' && value !== null;
                    
                    return (
                      <TableCell 
                        key={`${index}-${header}`}
                        sx={styles.tableCell(isNumeric)}
                      >
                        {value !== null ? String(value) : ''}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            {loading ? 'Loading preview data...' : 'No preview data available. Click Preview to load data.'}
          </Typography>
        </Box>
      )}
    </>
  );
};

export default PreviewTable;