import React from 'react';
import { AppBar, Toolbar, Box, Typography, Button, Chip, useTheme } from '@mui/material';
import { LogoutOutlined, Storage } from '@mui/icons-material';
import { headerStyles } from '../pages/styles/ExportPageStyles';

/**
 * Header component for the Export page
 * @param {Object} props - Component props
 * @param {Object} props.connectionDetails - Database connection details
 * @param {Function} props.onLogout - Logout handler function
 */
const ExportHeader = ({ connectionDetails, onLogout }) => {
  const theme = useTheme();
  const styles = headerStyles(theme);

  return (
    <AppBar position="static" sx={styles.appBar}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Storage sx={{ mr: 2, fontSize: 28 }} />
          <Typography variant="h5" component="div" sx={styles.headerTitle}>
            DBExportHub
          </Typography>
          <Chip
            label={`${connectionDetails?.database} @ ${connectionDetails?.server}`}
            sx={styles.headerChip}
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