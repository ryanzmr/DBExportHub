import React, { useState } from 'react';
import {
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  Box,
  Typography,
  Paper
} from '@mui/material';
import { Computer, Storage, AccountCircle, Key, ErrorOutline, Login, Visibility, VisibilityOff } from '@mui/icons-material';

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
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  return (
    <Paper
      elevation={24}
      sx={{
        maxWidth: { xs: 340, sm: 380 },
        width: "90%",
        position: "relative",
        zIndex: 1,
        background: "rgba(255, 255, 255, 0.98)",
        backdropFilter: "blur(12px)",
        borderRadius: 2.5,
        overflow: "hidden",
        p: { xs: 2, sm: 2.5 },
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Box sx={{ textAlign: "center", mb: 2.5 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            background: "linear-gradient(45deg, #1e40af, #3b82f6)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 1,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Login
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            fontSize: "0.85rem",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Enter your database credentials
        </Typography>
      </Box>
      
      <form onSubmit={handleSubmit}>
        <TextField
          label="Server"
          name="server"
          value={formData.server}
          onChange={handleChange}
          fullWidth
          margin="dense"
          required
          placeholder="e.g., localhost\\SQLEXPRESS"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Computer sx={{ color: "action.active", fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              "&:hover fieldset": {
                borderColor: "primary.main",
              },
            },
          }}
        />
        <TextField
          label="Database"
          name="database"
          value={formData.database}
          onChange={handleChange}
          fullWidth
          margin="dense"
          required
          placeholder="e.g., ExportDB"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Storage sx={{ color: "action.active", fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              "&:hover fieldset": {
                borderColor: "primary.main",
              },
            },
          }}
        />
        <TextField
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          fullWidth
          margin="dense"
          required
          placeholder="e.g., sa"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AccountCircle sx={{ color: "action.active", fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              "&:hover fieldset": {
                borderColor: "primary.main",
              },
            },
          }}
        />
        <TextField
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          value={formData.password}
          onChange={handleChange}
          fullWidth
          margin="dense"
          required
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Key sx={{ color: "action.active", fontSize: 18 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Box
                  component="button"
                  type="button"
                  onClick={handleTogglePasswordVisibility}
                  sx={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    p: 0,
                    display: "flex",
                    alignItems: "center",
                    color: "action.active",
                  }}
                >
                  {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </Box>
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              "&:hover fieldset": {
                borderColor: "primary.main",
              },
            },
          }}
        />
        
        {error && (
          <Alert
            severity="error"
            icon={<ErrorOutline fontSize="small" />}
            sx={{
              mt: 1.5,
              py: 0.5,
              borderRadius: 1.5,
              alignItems: "center",
              fontSize: "0.8rem",
              "& .MuiAlert-icon": {
                color: "error.main",
                opacity: 0.8,
                fontSize: "1rem",
                mr: 1,
              },
            }}
          >
            {error}
          </Alert>
        )}
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          startIcon={loading ? null : <Login sx={{ fontSize: 18 }} />}
          sx={{
            mt: 2,
            mb: 1,
            py: 1,
            borderRadius: 1.5,
            fontWeight: 600,
            textTransform: "none",
            fontSize: "0.9rem",
            background: "linear-gradient(45deg, #1e40af, #3b82f6)",
            boxShadow: "0 4px 10px rgba(59, 130, 246, 0.3)",
            "&:hover": {
              background: "linear-gradient(45deg, #1e3a8a, #3b82f6)",
              boxShadow: "0 6px 15px rgba(59, 130, 246, 0.4)",
            },
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : "Connect"}
        </Button>
      </form>
    </Paper>
  );
};

export default LoginForm;