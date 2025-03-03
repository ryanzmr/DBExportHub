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
    <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' }}>
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search..."
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
          sx={{ maxWidth: 200 }}
        />
      </Box>
      <TableContainer sx={{ maxHeight: { xs: 400, sm: 500, md: 600 }, width: '100%', backgroundColor: '#fff', borderRadius: 0 }}>
        <Table stickyHeader size="small" aria-label="data table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column}
                  sx={{
                    backgroundColor: '#0d47a1',
                    color: '#ffffff',
                    fontWeight: 600,
                    borderBottom: 'none',
                    position: 'sticky',
                    top: 0,
                    zIndex: 999,
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    minHeight: '36px',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                    '&:not(:last-child)': {
                      borderRight: '1px solid rgba(255, 255, 255, 0.3)'
                    },
                    '&:hover': {
                      backgroundColor: '#1565c0'
                    }
                  }}
                >
                  {column}
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
                    '&:nth-of-type(odd)': {
                      backgroundColor: '#ffffff'
                    },
                    '&:nth-of-type(even)': {
                      backgroundColor: '#f5f5f5'
                    },
                    '&:hover': {
                      backgroundColor: '#e3f2fd'
                    },
                    '& td': {
                      borderBottom: '1px solid #e0e0e0',
                      borderRight: '1px solid #e0e0e0',
                      padding: '4px 12px',
                      '&:last-child': {
                        borderRight: 'none'
                      }
                    }
                  }}
                >
                  {columns.map((column) => (
                    <TableCell 
                      key={`${rowIndex}-${column}`}
                      sx={{
                        fontSize: '0.8125rem',
                        color: '#424242',
                        fontFamily: '"Segoe UI", "Roboto", "Helvetica", sans-serif',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '200px'
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
          '& .MuiTablePagination-toolbar': {
            minHeight: '48px',
            padding: '0 12px'
          },
          '& .MuiTablePagination-select': {
            fontSize: '0.8125rem'
          },
          '& .MuiTablePagination-displayedRows': {
            fontSize: '0.8125rem'
          }
        }}
      />
    </Paper>
  );
};

export default DataTable;