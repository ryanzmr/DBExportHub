import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { LogoutOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Header = ({ title, isAuthenticated, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  return (
    <AppBar position="static" sx={{ mb: 3 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title || 'DBExportHub'}
        </Typography>
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
    </AppBar>
  );
};

export default Header;