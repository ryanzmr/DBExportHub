import React, { useState } from 'react';
import {
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  Box,
  Paper,
  IconButton,
  Typography,
  Link
} from '@mui/material';
import { Computer, Storage, AccountCircle, Key, Visibility, VisibilityOff } from '@mui/icons-material';
import { commonTextFieldStyles, loginFormStyles } from '../../pages/Login/styles/LoginPageStyles';

/**
 * Login form component for the login page
 * @param {Object} props - Component props
 * @param {Object} props.formData - Form data state
 * @param {Function} props.handleChange - Form change handler
 * @param {Function} props.handleSubmit - Form submit handler
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 */
const LoginForm = ({ formData, handleChange, handleSubmit, loading, error }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Paper elevation={24} sx={{
      ...loginFormStyles.paper,
      width: '100%',
      maxWidth: '450px',
      p: { xs: 2.5, sm: 3 },
      mx: 2,
      borderRadius: 3
    }}>
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography variant="h4" sx={{
          fontWeight: 700,
          color: "#fff",
          mb: 0.8,
          fontSize: "1.5rem",
          letterSpacing: "-0.01em",
          fontFamily: '"Inter", sans-serif'
        }}>
          Database Connection
        </Typography>
        <Typography variant="body1" sx={{
          color: "rgba(255, 255, 255, 0.8)",
          fontSize: "1rem",
          fontWeight: 400,
          lineHeight: 1.5,
          fontFamily: '"Inter", sans-serif'
        }}>
          Enter your database credentials to connect
        </Typography>
      </Box>
      
      <form onSubmit={handleSubmit}>
        <TextField
          label="Server Name"
          name="server"
          value={formData.server}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          placeholder="ServerName"
          size="medium"
          InputLabelProps={{
            sx: {
              fontWeight: 600,
              fontSize: '0.9rem'
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Computer sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 22 }} />
              </InputAdornment>
            ),
            sx: {
              fontSize: '0.95rem',
              '& input::placeholder': {
                fontSize: '0.95rem',
                opacity: 0.7
              }
            }
          }}
          sx={{
            ...commonTextFieldStyles,
            mb: 2
          }}
        />
        <TextField
          label="Database Name"
          name="database"
          value={formData.database}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          placeholder="DatabaseName"
          size="medium"
          InputLabelProps={{
            sx: {
              fontWeight: 600,
              fontSize: '0.9rem'
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Storage sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 22 }} />
              </InputAdornment>
            ),
            sx: {
              fontSize: '0.95rem',
              '& input::placeholder': {
                fontSize: '0.95rem',
                opacity: 0.7
              }
            }
          }}
          sx={{
            ...commonTextFieldStyles,
            mb: 2
          }}
        />
        <TextField
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          placeholder="Enter username"
          size="medium"
          InputLabelProps={{
            sx: {
              fontWeight: 600,
              fontSize: '0.9rem'
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AccountCircle sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 22 }} />
              </InputAdornment>
            ),
            sx: {
              fontSize: '0.95rem',
              '& input::placeholder': {
                fontSize: '0.95rem',
                opacity: 0.7
              }
            }
          }}
          sx={{
            ...commonTextFieldStyles,
            mb: 2
          }}
        />
        <TextField
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          value={formData.password}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          placeholder="Enter password"
          size="medium"
          InputLabelProps={{
            sx: {
              fontWeight: 600,
              fontSize: '0.9rem'
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Key sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 22 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleTogglePasswordVisibility}
                  edge="end"
                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              fontSize: '0.95rem',
              '& input::placeholder': {
                fontSize: '0.95rem',
                opacity: 0.7
              }
            }
          }}
          sx={{
            ...commonTextFieldStyles,
            mb: 2
          }}
        />
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mt: 2, 
              backgroundColor: "rgba(211, 47, 47, 0.1)",
              color: "#ff4444",
              '& .MuiAlert-icon': {
                color: "#ff4444"
              }
            }}
          >
            {error}
          </Alert>
        )}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{
            mt: 4,
            mb: 2,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: 2,
            background: 'linear-gradient(45deg, #5A4FFF 30%, #6C63FF 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #4A3FEF 30%, #5A4FFF 90%)',
              boxShadow: '0 6px 15px rgba(90, 79, 255, 0.4)',
              transform: 'translateY(-1px)'
            },
            boxShadow: '0 4px 10px rgba(90, 79, 255, 0.3)',
            transition: 'all 0.2s ease-in-out'
          }}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Connecting...' : 'Connect'}
        </Button>
        
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', fontFamily: '"Inter", sans-serif' }}>
            Having trouble connecting? <Link href="#" sx={{ color: '#7A70FF', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>View Documentation</Link>
          </Typography>
        </Box>
      </form>
    </Paper>
  );
};

export default LoginForm;