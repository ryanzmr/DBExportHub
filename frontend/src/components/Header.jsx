import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Tabs, 
  Tab, 
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Badge,
  Chip
} from '@mui/material';
import { 
  LogoutOutlined, 
  Menu as MenuIcon, 
  HomeOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined,
  SettingsOutlined,
  AnalyticsOutlined,
  HelpOutlineOutlined,
  Notifications,
  Help,
  Storage,
  AccountCircle
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { useTheme } from '@mui/material/styles';

const Header = ({ title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, connectionDetails } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Get current date for display
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Check if current page is homepage
  const isHomePage = location.pathname === '/home' || location.pathname === '/';

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const getTabValue = () => {
    const path = location.pathname;
    if (path === '/home' || path === '/') return 0;
    if (path === '/export') return 1;
    if (path === '/import') return 2;
    if (path === '/analytics') return 3;
    if (path === '/settings') return 4;
    return false;
  };
  
  const handleTabChange = (event, newValue) => {
    switch (newValue) {
      case 0:
        navigate('/home');
        break;
      case 1:
        navigate('/export');
        break;
      case 2:
        navigate('/import');
        break;
      case 3:
        // Analytics page not yet implemented
        break;
      case 4:
        // Settings page not yet implemented
        break;
      default:
        break;
    }
  };
  
  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const handleNavigate = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };
  
  const navigationItems = [
    { label: 'Home', icon: <HomeOutlined />, path: '/home', disabled: false },
    { label: 'Export', icon: <CloudDownloadOutlined />, path: '/export', disabled: false },
    { label: 'Import', icon: <CloudUploadOutlined />, path: '/import', disabled: false },
    { label: 'Analytics', icon: <AnalyticsOutlined />, path: '/analytics', disabled: true },
    { label: 'Settings', icon: <SettingsOutlined />, path: '/settings', disabled: true },
    { label: 'Help', icon: <HelpOutlineOutlined />, path: '/help', disabled: true }
  ];

  return (
    <AppBar 
      position="static" 
      sx={{ 
        mb: 0,
        background: 'linear-gradient(90deg, #455a64 0%, #37474f 100%)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
      }}
    >
      <Toolbar sx={{ minHeight: '56px', py: 0.5, px: {xs: 1, sm: 2} }}>
        {isMobile && isAuthenticated && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleMobileMenuToggle}
            sx={{ mr: 1, color: 'white' }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Storage sx={{ mr: 1.5, fontSize: 26, color: 'white' }} />
          <Typography 
            variant="h5" 
            component="div" 
            sx={{
              fontWeight: 700,
              letterSpacing: '0.01em',
              color: 'white',
              fontSize: {xs: '1.2rem', sm: '1.4rem'},
              mr: 2
            }}
          >
            {title || 'DBExportHub'}
          </Typography>
          
          {/* Only show connection details if not on homepage */}
          {connectionDetails && !isHomePage && (
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
          )}
          
          {/* Only show date if not on homepage */}
          {!isHomePage && (
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
          )}
        </Box>
        
        {isAuthenticated && !isMobile && (
          <Tabs 
            value={getTabValue()} 
            onChange={handleTabChange}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ 
              mx: 2,
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.8)',
                '&.Mui-selected': {
                  color: 'white'
                }
              }
            }}
          >
            <Tab label="HOME" />
            <Tab label="EXPORT" />
            <Tab label="IMPORT" />
            <Tab label="ANALYTICS" disabled />
            <Tab label="SETTINGS" disabled />
          </Tabs>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton color="inherit" sx={{ color: 'white' }}>
            <Badge badgeContent={notificationCount} color="error" invisible={notificationCount === 0}>
              <Notifications />
            </Badge>
          </IconButton>
          
          <IconButton color="inherit" sx={{ ml: 1, color: 'white' }}>
            <Help />
          </IconButton>
          
          {isAuthenticated && (
            <Button 
              variant="contained"
              color="secondary"
              onClick={handleLogout}
              startIcon={<LogoutOutlined />}
              sx={{
                ml: 2,
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
          )}
        </Box>
      </Toolbar>
      
      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={handleMobileMenuToggle}
      >
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            <ListItem sx={{ bgcolor: theme.palette.primary.main, color: 'white' }}>
              <ListItemIcon sx={{ color: 'white' }}>
                <Storage />
              </ListItemIcon>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                DBExportHub
              </Typography>
            </ListItem>
            <Divider />
            
            {navigationItems.map((item) => (
              <ListItem 
                button 
                key={item.label}
                onClick={() => !item.disabled && handleNavigate(item.path)}
                disabled={item.disabled}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
                {item.disabled && (
                  <Typography variant="caption" color="text.secondary">
                    Soon
                  </Typography>
                )}
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <LogoutOutlined />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Header;