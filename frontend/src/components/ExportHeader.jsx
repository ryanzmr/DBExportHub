import React from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  Chip,
  useTheme
} from '@mui/material';
import { LogoutOutlined, Storage } from '@mui/icons-material';

/**
 * ExportHeader component for displaying the application header
 * @param {Object} props - Component props
 * @param {Object} props.connectionDetails - Database connection details
 * @param {Function} props.onLogout - Logout handler function
 * @returns {JSX.Element} - Rendered component
 */
const ExportHeader = ({ connectionDetails, onLogout }) => {
  const theme = useTheme();
  
  // Styles
  const styles = {
    appBar: {
      mb: 4,
      background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
      boxShadow: '0 3px 5px 2px rgba(0, 0, 0, 0.1)'
    },
    appTitle: {
      fontWeight: 600,
      letterSpacing: '0.5px',
      fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
      textTransform: 'none'
    },
    connectionChip: { 
      ml: 2, 
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      fontWeight: 500,
      fontSize: '0.875rem',
      '& .MuiChip-label': {
        padding: '0 12px'
      }
    },
    logoutButton: { 
      borderRadius: 20,
      textTransform: 'none',
      fontSize: '0.9rem',
      fontWeight: 500,
      px: 3
    }
  };

  return (
    <AppBar position="static" sx={styles.appBar}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Storage sx={{ mr: 2, fontSize: 28 }} />
          <Typography 
            variant="h5" 
            component="div"
            sx={styles.appTitle}
          >
            DBExportHub
          </Typography>
          <Chip
            label={`${connectionDetails?.database} @ ${connectionDetails?.server}`}
            sx={styles.connectionChip}
          />
        </Box>
        <Button 
          color="inherit" 
          onClick={onLogout} 
          startIcon={<LogoutOutlined />}
          sx={styles.logoutButton}
        >
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default ExportHeader;