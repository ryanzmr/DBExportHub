import React from 'react';
import { Box, Typography, Link, Divider, useTheme } from '@mui/material';
import { Info, Help, Security, Code } from '@mui/icons-material';

/**
 * Footer component for the Dashboard page
 * Displays copyright information, version details, and helpful links
 */
const DashboardFooter = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();
  
  return (
    <Box
      sx={{
        width: '100%',
        mt: 4,
        pt: 2,
        pb: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: { xs: 1, sm: 2 },
          mb: 2,
          px: 2,
          width: '100%',
          maxWidth: '800px'
        }}
      >
        <Link
          href="#"
          underline="hover"
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: theme.palette.text.secondary,
            fontSize: '0.875rem',
            '&:hover': { color: theme.palette.primary.main }
          }}
        >
          <Info fontSize="small" sx={{ mr: 0.5 }} />
          About
        </Link>
        
        <Link
          href="#"
          underline="hover"
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: theme.palette.text.secondary,
            fontSize: '0.875rem',
            '&:hover': { color: theme.palette.primary.main }
          }}
        >
          <Help fontSize="small" sx={{ mr: 0.5 }} />
          Help & Support
        </Link>
        
        <Link
          href="#"
          underline="hover"
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: theme.palette.text.secondary,
            fontSize: '0.875rem',
            '&:hover': { color: theme.palette.primary.main }
          }}
        >
          <Security fontSize="small" sx={{ mr: 0.5 }} />
          Privacy Policy
        </Link>
        
        <Link
          href="#"
          underline="hover"
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: theme.palette.text.secondary,
            fontSize: '0.875rem',
            '&:hover': { color: theme.palette.primary.main }
          }}
        >
          <Code fontSize="small" sx={{ mr: 0.5 }} />
          API Documentation
        </Link>
      </Box>
      
      <Divider sx={{ width: '100%', maxWidth: '800px', mb: 2 }} />
      
      <Typography variant="body2" color="text.secondary" align="center">
        &copy; {currentYear} DBExportHub. All rights reserved.
      </Typography>
      
      <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 0.5 }}>
        Version 1.0.0 | Database Export Tool
      </Typography>
    </Box>
  );
};

export default DashboardFooter;