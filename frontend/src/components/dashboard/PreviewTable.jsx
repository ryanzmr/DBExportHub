import React, { useState, useEffect } from 'react';
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
  useTheme,
  TablePagination,
  TextField,
  InputAdornment
} from '@mui/material';
import { TableView, Search } from '@mui/icons-material';

/**
 * Preview table component for displaying export data preview
 * @param {Object} props - Component props
 * @param {Array} props.previewData - Preview data to display
 * @param {number} props.previewCount - Total count of preview records
 * @param {number} props.totalRecords - Total count of records in database
 * @param {boolean} props.loading - Loading state
 */
const PreviewTable = ({ previewData, previewCount, totalRecords, loading }) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  
  // Get table headers from the first row of preview data
  const tableHeaders = previewData.length > 0 ? Object.keys(previewData[0]) : [];

  // Filter data based on search term
  useEffect(() => {
    if (previewData.length > 0) {
      if (searchTerm.trim() === '') {
        setFilteredData(previewData);
      } else {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = previewData.filter(item => {
          return Object.keys(item).some(key => {
            const value = item[key];
            return value !== null && String(value).toLowerCase().includes(lowercasedFilter);
          });
        });
        setFilteredData(filtered);
      }
    } else {
      setFilteredData([]);
    }
    setPage(0);
  }, [previewData, searchTerm]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Calculate pagination
  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ width: '100%' }}>      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TableView sx={{ color: theme.palette.primary.main, mr: 2, fontSize: 28 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Data Preview
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {totalRecords > 0 && (
            <Chip 
              label={`Total records: ${totalRecords}`}
              color="secondary"
              size="small"
              sx={{ mr: 1 }}
            />
          )}
          <Chip 
            label={`${filteredData.length} of ${previewCount} records shown`}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>
      
      <Box sx={{ borderBottom: `2px solid ${theme.palette.primary.light}`, mb: 2 }} />
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
            placeholder="Search..."
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            disabled={previewData.length === 0}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ width: '100%', maxWidth: '400px', mr: 2 }}
          />
      </Box>

      {loading ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Loading preview data...
          </Typography>
        </Box>
      ) : previewData.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No preview data available. Use the form above to generate a preview.
          </Typography>
        </Box>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="preview table" size="small">
              <TableHead>
                <TableRow>
                  {tableHeaders.map((header) => (
                    <TableCell 
                      key={header}
                      sx={{ 
                        fontWeight: 'bold',
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((row, rowIndex) => (
                  <TableRow 
                    hover 
                    key={rowIndex}
                    sx={{ '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover } }}
                  >
                    {tableHeaders.map((header) => (
                      <TableCell key={`${rowIndex}-${header}`}>
                        {row[header] !== null ? String(row[header]) : ''}
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
          />
        </Paper>
      )}
    </Box>
  );
};

export default PreviewTable;