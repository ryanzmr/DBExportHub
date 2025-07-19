import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
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
  Chip,
  Tooltip,
  Stack,
  ListItemButton
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
  NotificationsOutlined,
  HelpOutline,
  Storage,
  AccountCircle,
  KeyboardArrowDown
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
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
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

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate('/login');
  };

  const isPathActive = (path) => {
    if (path === '/home') {
      return location.pathname === '/home' || location.pathname === '/';
    }
    return location.pathname === path;
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const navigationItems = [
    { label: 'Home', path: '/home', disabled: false },
    { label: 'Export', path: '/export', disabled: false },
    { label: 'Import', path: '/import', disabled: false },
    { label: 'Analytics', path: '/analytics', disabled: true },
    { label: 'Settings', path: '/settings', disabled: true }
  ];

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        mb: 0,
        background: '#1e293b',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      <Toolbar sx={{ minHeight: '64px', px: { xs: 1.5, sm: 2, md: 3 } }}>
        {/* Left section: Logo and hamburger menu */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
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

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.05)',
              py: 0.75,
              px: 1.5,
              borderRadius: 1.5,
              mr: 2
            }}
          >
            <Storage sx={{ mr: 1, fontSize: 22, color: '#5A4FFF' }} />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                letterSpacing: '0.01em',
                color: 'white',
                fontSize: '1.1rem'
              }}
            >
              {title || 'DBExportHub'}
            </Typography>
          </Box>

          {/* Connection details chip */}
          {connectionDetails && (
            <Chip
              icon={<Storage sx={{ color: '#8bc1f7 !important', fontSize: '1rem' }} />}
              label={`${connectionDetails?.database} @ ${connectionDetails?.server || connectionDetails?.hostname}`}
              sx={{
                bgcolor: 'rgba(255,255,255,0.08)',
                color: '#8bc1f7',
                fontWeight: 500,
                fontSize: '0.75rem',
                height: 28,
                border: '1px solid rgba(139, 193, 247, 0.3)',
                '& .MuiChip-label': {
                  px: 1
                },
                '& .MuiChip-icon': {
                  color: '#8bc1f7'
                }
              }}
            />
          )}
        </Box>

        {/* Center section: Navigation */}
        {isAuthenticated && !isMobile && (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            flexGrow: 1,
            mx: 2
          }}>
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                bgcolor: 'rgba(255,255,255,0.03)',
                borderRadius: 1.5,
                p: 0.5
              }}
            >
              {navigationItems.map((item) => (
                <Button
                  key={item.label}
                  disabled={item.disabled}
                  onClick={() => !item.disabled && handleNavigate(item.path)}
                  sx={{
                    color: isPathActive(item.path) ? 'white' : 'rgba(255,255,255,0.7)',
                    px: 2,
                    py: 0.75,
                    minWidth: 'auto',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    textTransform: 'none',
                    borderRadius: 1,
                    bgcolor: isPathActive(item.path) ? 'rgba(90, 79, 255, 0.8)' : 'transparent',
                    '&:hover': {
                      bgcolor: isPathActive(item.path)
                        ? 'rgba(90, 79, 255, 0.9)'
                        : 'rgba(255,255,255,0.1)'
                    },
                    '&.Mui-disabled': {
                      color: 'rgba(255,255,255,0.4)'
                    }
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          </Box>
        )}

        {/* Right section: User controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
          {/* Date display */}
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              display: { xs: 'none', lg: 'block' },
              mr: 3,
              fontSize: '0.8rem'
            }}
          >
            {currentDate}
          </Typography>

          {/* Notification button */}
          <Tooltip title="Notifications">
            <IconButton
              size="small"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                bgcolor: 'rgba(255,255,255,0.05)',
                mr: 1,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              <Badge badgeContent={notificationCount} color="error" invisible={notificationCount === 0}>
                <NotificationsOutlined fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Help button */}
          <Tooltip title="Help">
            <IconButton
              size="small"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                bgcolor: 'rgba(255,255,255,0.05)',
                mr: 2,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              <HelpOutline fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* User menu */}
          {isAuthenticated && (
            <>
              <Button
                onClick={handleUserMenuOpen}
                endIcon={<KeyboardArrowDown />}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.08)',
                  borderRadius: 1.5,
                  px: 1.5,
                  py: 0.75,
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.15)',
                  }
                }}
              >
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    bgcolor: theme.palette.primary.main,
                    fontSize: '0.8rem',
                    mr: 1
                  }}
                >
                  {connectionDetails?.username ? connectionDetails.username.charAt(0).toUpperCase() : 'U'}
                </Avatar>
                {connectionDetails?.username || 'User'}
              </Button>
              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                PaperProps={{
                  elevation: 2,
                  sx: {
                    mt: 1.5,
                    minWidth: 180,
                    borderRadius: 1,
                    border: '1px solid rgba(0,0,0,0.08)',
                    '& .MuiMenuItem-root': {
                      fontSize: '0.875rem',
                      py: 1
                    }
                  }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleUserMenuClose}>
                  <ListItemIcon>
                    <AccountCircle fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <MenuItem onClick={handleUserMenuClose}>
                  <ListItemIcon>
                    <SettingsOutlined fontSize="small" />
                  </ListItemIcon>
                  Settings
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutOutlined fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={handleMobileMenuToggle}
        PaperProps={{
          sx: {
            width: 280,
            bgcolor: '#1e293b',
            color: 'white'
          }
        }}
      >
        <Box sx={{ width: '100%' }} role="presentation">
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <Storage sx={{ mr: 1.5, fontSize: 24, color: theme.palette.primary.main }} />
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              DBExportHub
            </Typography>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

          <List sx={{ pt: 1 }}>
            {navigationItems.map((item) => (
              <ListItem
                key={item.label}
                disablePadding
                sx={{ mb: 0.5 }}
              >
                <ListItemButton
                  onClick={() => !item.disabled && handleNavigate(item.path)}
                  disabled={item.disabled}
                  selected={isPathActive(item.path)}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(90, 79, 255, 0.15)',
                      '&:hover': {
                        bgcolor: 'rgba(90, 79, 255, 0.2)',
                      }
                    }
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: isPathActive(item.path) ? 600 : 400
                    }}
                  />
                  {item.disabled && (
                    <Chip
                      label="Soon"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        bgcolor: 'rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.7)'
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />

          <Box sx={{ p: 2 }}>
            {connectionDetails && (
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  borderRadius: 1,
                  mb: 2
                }}
              >
                <Typography variant="subtitle2" sx={{ color: '#8bc1f7', mb: 0.5, fontSize: '0.75rem' }}>
                  CONNECTED TO
                </Typography>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                  {connectionDetails.server || connectionDetails.hostname}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                  Database: {connectionDetails.database}
                </Typography>
              </Box>
            )}

            <Button
              variant="outlined"
              fullWidth
              startIcon={<LogoutOutlined />}
              onClick={handleLogout}
              sx={{
                borderColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                textTransform: 'none',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.3)',
                  bgcolor: 'rgba(255,255,255,0.05)'
                }
              }}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Header;