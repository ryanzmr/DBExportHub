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
 * PreviewTable component for displaying data preview
 * @param {Object} props - Component props
 * @param {Array} props.previewData - Data to display in the table
 * @param {number} props.previewCount - Total count of records
 * @param {boolean} props.loading - Loading state
 * @returns {JSX.Element} - Rendered component
 */
const PreviewTable = ({ previewData, previewCount, loading }) => {
  const theme = useTheme();
  
  // Get table headers from the first row of preview data
  const tableHeaders = previewData.length > 0 ? Object.keys(previewData[0]) : [];
  
  // Styles
  const styles = {
    tableContainer: { 
      maxHeight: 'calc(100vh - 400px)',
      overflowY: 'auto',
      overflowX: 'auto',
      '&::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: '4px',
      }
    },
    tableHeaderCell: {
      fontWeight: 700,
      backgroundColor: '#8bc1f7 !important', // Force the background color with !important
      color: '#000000 !important', // Force black text with !important
      position: 'sticky',
      top: 0,
      zIndex: 2,
      padding: '12px 16px',
      textAlign: 'center',
      fontSize: '0.875rem',
      whiteSpace: 'nowrap',
      minWidth: '150px',
      borderBottom: '2px solid #1565c0',
      borderRight: '1px solid rgba(0, 0, 0, 0.1)',
      '&.MuiTableCell-head': { // Target specifically the table header cells
        color: '#000000 !important',
        backgroundColor: '#8bc1f7 !important',
        fontWeight: 700
      }
    },
    tableRow: {
      '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover
      },
      '&:hover': {
        backgroundColor: theme.palette.action.selected
      }
    },
    tableCell: (isNumeric) => ({
      padding: '8px 16px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '300px',
      borderRight: '1px solid rgba(224, 224, 224, 0.5)',
      textAlign: isNumeric ? 'right' : 'left',
      fontSize: '0.875rem',
      color: '#000000', // Ensuring text is black
      '&:last-child': {
        borderRight: 'none'
      }
    }),
    sectionHeader: { 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      mb: 3,
      borderBottom: `2px solid ${theme.palette.primary.main}`,
      p: 2,
      color: '#1a365d'
    },
    sectionTitle: {
      fontWeight: 600,
      fontSize: '1.25rem',
      letterSpacing: '0.3px',
      color: '#1a365d'
    },
    emptyTableMessage: { 
      p: 3, 
      textAlign: 'center' 
    }
  };

  return (
    <Box>
      <Box sx={styles.sectionHeader}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TableView sx={{ color: theme.palette.primary.main, mr: 2, fontSize: 26 }} />
          <Typography 
            variant="h6"
            sx={styles.sectionTitle}
          >
            Data Preview
          </Typography>
        </Box>
        {previewCount > 0 && (
          <Chip
            label={`Total Records: ${previewCount}`}
            color="primary"
            variant="outlined"
            sx={{ 
              fontWeight: 500,
              fontSize: '0.875rem',
              '& .MuiChip-label': {
                padding: '0 12px'
              }
            }}
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
        <Box sx={styles.emptyTableMessage}>
          <Typography color="textSecondary">
            {loading ? 'Loading preview data...' : 'No preview data available. Click Preview to load data.'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PreviewTable;