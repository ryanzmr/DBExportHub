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

/**
 * Preview table component for displaying export data preview
 * @param {Object} props - Component props
 * @param {Array} props.previewData - Preview data to display
 * @param {number} props.previewCount - Total count of preview records
 * @param {boolean} props.loading - Loading state
 */
const PreviewTable = ({ previewData, previewCount, loading }) => {
  const theme = useTheme();
  
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
        color: theme.palette.text.primary
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TableView sx={{ color: theme.palette.primary.main, mr: 2, fontSize: 26 }} />
          <Typography variant="h6">
            Data Preview
          </Typography>
        </Box>
        {previewCount > 0 && (
          <Chip
            label={`Total Records: ${previewCount}`}
            color="primary"
            variant="outlined"
          />
        )}
      </Box>
      
      {previewData.length > 0 ? (
        <TableContainer component={Paper}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {tableHeaders.map((header) => (
                  <TableCell key={header}>
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {previewData.map((row, index) => (
                <TableRow key={index}>
                  {tableHeaders.map((header) => {
                    const value = row[header];
                    const isNumeric = !isNaN(value) && value !== '' && value !== null;
                    
                    return (
                      <TableCell 
                        key={`${index}-${header}`}
                        align={isNumeric ? 'right' : 'left'}
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