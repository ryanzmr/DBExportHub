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
  Divider
} from '@mui/material';
import { 
  LogoutOutlined, 
  Menu as MenuIcon, 
  HomeOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined,
  SettingsOutlined,
  AnalyticsOutlined,
  HelpOutlineOutlined
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { useTheme } from '@mui/material/styles';

const Header = ({ title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
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
    if (path === '/home') return 0;
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
        // Import page not yet implemented
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
    { label: 'Import', icon: <CloudUploadOutlined />, path: '/import', disabled: true },
    { label: 'Analytics', icon: <AnalyticsOutlined />, path: '/analytics', disabled: true },
    { label: 'Settings', icon: <SettingsOutlined />, path: '/settings', disabled: true },
    { label: 'Help', icon: <HelpOutlineOutlined />, path: '/help', disabled: true }
  ];

  return (
    <AppBar position="static" sx={{ mb: 3 }}>
      <Toolbar>
        {isMobile && isAuthenticated && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleMobileMenuToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: isMobile ? 1 : 0,
            mr: isAuthenticated && !isMobile ? 3 : 0
          }}
        >
          {title || 'DBExportHub'}
        </Typography>
        
        {isAuthenticated && !isMobile && (
          <Tabs 
            value={getTabValue()} 
            onChange={handleTabChange}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ flexGrow: 1 }}
          >
            <Tab label="Home" />
            <Tab label="Export" />
            <Tab label="Import" disabled />
            <Tab label="Analytics" disabled />
            <Tab label="Settings" disabled />
          </Tabs>
        )}
        
        {isAuthenticated && (
          <Box>
            <Button 
              color="inherit" 
              onClick={handleLogout}
              startIcon={<LogoutOutlined />}
            >
              Logout
            </Button>
          </Box>
        )}
      </Toolbar>
      
      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={handleMobileMenuToggle}
      >
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            <ListItem>
              <Typography variant="h6" color="primary">
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