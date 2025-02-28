import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';

/**
 * A reusable data table component for displaying tabular data
 * 
 * @param {Object} props - Component props
 * @param {Array} props.data - Array of data objects to display
 * @param {boolean} props.loading - Whether data is currently loading
 * @param {string} props.emptyMessage - Message to display when there's no data
 */
const DataTable = ({ data, loading, emptyMessage = 'No data to display' }) => {
  // If there's no data and not loading, show empty message
  if (!data || data.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary">
            {emptyMessage}
          </Typography>
        )}
      </Paper>
    );
  }

  // Extract column headers from the first data item
  const columns = Object.keys(data[0]);

  return (
    <TableContainer component={Paper} className="data-table-container">
      <Table className="preview-table" size="small" aria-label="data table">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {column}
                </Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column) => (
                <TableCell key={`${rowIndex}-${column}`}>
                  {row[column] !== null ? String(row[column]) : ''}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DataTable;