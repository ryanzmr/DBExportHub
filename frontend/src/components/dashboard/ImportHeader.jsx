import React, { useState } from 'react';
import { AppBar, Toolbar, Box, Typography, Button, Chip, Badge, Avatar, Tooltip, useTheme, Popover, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { LogoutOutlined, Storage, Notifications, Help, AccountCircle, Computer, Person } from '@mui/icons-material';
import { headerStyles } from '../../pages/Dashboard/styles/DashboardStyles';

/**
 * Enhanced header component for the Import page
 * @param {Object} props - Component props
 * @param {Object} props.connectionDetails - Database connection details
 * @param {Function} props.onLogout - Logout handler function
 */
const ImportHeader = ({ connectionDetails, onLogout }) => {
  const theme = useTheme();
  const styles = headerStyles(theme);
  
  // State for account tooltip
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Get current date for display
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const [notificationCount, setNotificationCount] = useState(0);

  return (
    <AppBar position="static" sx={{
      background: 'linear-gradient(90deg, #5C6BC0 0%, #3F51B5 100%)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      mb: 0
    }}>
      <Toolbar sx={{ minHeight: '64px', py: 0.5, px: {xs: 1, sm: 2} }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Storage sx={{ mr: 1.5, fontSize: 26, color: 'white' }} />
          <Typography variant="h5" component="div" sx={{
            fontWeight: 700,
            letterSpacing: '0.01em',
            color: 'white',
            fontSize: {xs: '1.2rem', sm: '1.4rem'},
            mr: 2
          }}>
            DBExportHub
          </Typography>
          
          <Chip
            label={`${connectionDetails?.database} @ ${connectionDetails?.server}`}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 500,
              fontSize: '0.8rem',
              height: 28,
              '& .MuiChip-label': {
                px: 1.5
              }
            }}
          />
          
          <Typography variant="body2" sx={{ 
            ml: 2, 
            color: 'rgba(255,255,255,0.9)', 
            display: { xs: 'none', md: 'block' },
            fontWeight: 500,
            letterSpacing: '0.01em',
            fontSize: '0.9rem'
          }}>
            {currentDate}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Help Center">
            <Button 
              color="inherit" 
              sx={{ minWidth: 'auto', mr: 1, color: 'white' }}
            >
              <Help />
            </Button>
          </Tooltip>
          
          <Tooltip title="Notifications">
            <Button 
              color="inherit" 
              sx={{ minWidth: 'auto', mr: 1, color: 'white' }}
            >
              <Badge badgeContent={notificationCount} color="error" invisible={notificationCount === 0}>
                <Notifications />
              </Badge>
            </Button>
          </Tooltip>
          
          <Tooltip
            title={
              <Box sx={{ p: 1, width: 300 }}>
                <Typography variant="h6" sx={{ 
                  mb: 1,
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  color: '#1a2b4a',
                  letterSpacing: '0.01em'
                }}>
                  Account Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Computer fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Server" 
                      secondary={connectionDetails?.server || 'Not available'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Storage fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Database" 
                      secondary={connectionDetails?.database || 'Not available'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Person fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Username" 
                      secondary={connectionDetails?.username || 'Not available'} 
                    />
                  </ListItem>
                </List>
              </Box>
            }
            open={showTooltip}
            onOpen={() => setShowTooltip(true)}
            onClose={() => setShowTooltip(false)}
            arrow
            placement="bottom-end"
            PopperProps={{
              sx: { 
                '& .MuiTooltip-tooltip': {
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  boxShadow: theme.shadows[4],
                  maxWidth: 'none',
                  p: 0
                },
                '& .MuiTooltip-arrow': {
                  color: theme.palette.background.paper
                }
              }
            }}
          >
            <Button 
              color="inherit" 
              sx={{ 
                minWidth: 'auto', 
                mr: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'white'
              }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
                {connectionDetails?.username ? connectionDetails.username.charAt(0).toUpperCase() : <AccountCircle />}
              </Avatar>
              <Typography 
                variant="body2" 
                sx={{ 
                  display: { xs: 'none', sm: 'block' },
                  color: 'white',
                  fontWeight: 500
                }}
              >
                {connectionDetails?.username || 'Account'}
              </Typography>
            </Button>
          </Tooltip>
          
          <Button 
            variant="contained"
            color="secondary"
            onClick={onLogout}
            startIcon={<LogoutOutlined />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
              px: 2,
              py: 0.5,
              bgcolor: 'rgba(255,255,255,0.15)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.25)'
              }
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default ImportHeader;
