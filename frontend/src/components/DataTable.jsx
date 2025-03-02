import React, { useState } from 'react';
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
  CircularProgress,
  TablePagination,
  useTheme,
  TextField,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

/**
 * A reusable data table component for displaying tabular data
 * 
 * @param {Object} props - Component props
 * @param {Array} props.data - Array of data objects to display
 * @param {boolean} props.loading - Whether data is currently loading
 * @param {string} props.emptyMessage - Message to display when there's no data
 */
const DataTable = ({ data, loading, emptyMessage = 'No data to display' }) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

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

  const columns = Object.keys(data[0]);

  const filteredData = data.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search across all columns..."
          value={searchQuery}
          onChange={handleSearchChange}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader size="small" aria-label="data table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column}
                  sx={{
                    backgroundColor: '#f8f9fa',
                    color: 'rgb(15, 23, 42)',
                    fontWeight: 600,
                    borderBottom: '1px solid rgba(37, 99, 235, 0.1)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
                    letterSpacing: '0.01em',
                    padding: '1rem',
                    transition: 'background-color 0.2s ease',
                    fontSize: '0.875rem',
                    '&:hover': {
                      backgroundColor: 'rgba(37, 99, 235, 0.05)'
                    }
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {column}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  hover
                  sx={{
                    '&:nth-of-type(even)': {
                      backgroundColor: '#f8f9fa'
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(37, 99, 235, 0.05)'
                    }
                  }}
                >
                  {columns.map((column) => (
                    <TableCell 
                      key={`${rowIndex}-${column}`}
                      sx={{
                        border: '1px solid rgba(37, 99, 235, 0.1)',
                        backgroundColor: '#ffffff',
                        color: 'rgb(55, 65, 81)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
                        fontSize: '0.875rem',
                        padding: '1rem',
                        lineHeight: '1.25rem'
                      }}
                    >
                      {row[column] !== null ? String(row[column]) : ''}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          borderTop: 1,
          borderColor: 'divider',
        }}
      />
    </Paper>
  );
};

export default DataTable;