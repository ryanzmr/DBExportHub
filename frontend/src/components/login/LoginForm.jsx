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
  Typography,  // Add this
  Link        // Add this
} from '@mui/material';
import { Computer, Storage, AccountCircle, Key, ErrorOutline, ArrowForward, Visibility, VisibilityOff } from '@mui/icons-material';

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
    <Paper
      elevation={24}
      sx={{
        maxWidth: { xs: 340, sm: 380 },
        width: "90%",
        position: "relative",
        zIndex: 1,
        background: "#13132A", // Updated to dark background as specified
        borderRadius: 2.5,
        overflow: "hidden",
        p: { xs: 2.5, sm: 3 }, // Increased padding to 20px-25px
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        border: "1px solid rgba(90, 79, 255, 0.2)", // Updated border color to match the purple theme
      }}
    >
      {/* Form title */}
      <Box sx={{ textAlign: "center", mb: 2.5 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            background: "linear-gradient(45deg, #5A4FFF, #7A70FF)", // Updated to match purple theme
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 1,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Database Connection
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: "0.85rem",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Enter your database credentials to connect
        </Typography>
      </Box>
      
      {/* Form fields */}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Server Name"
          name="server"
          value={formData.server}
          onChange={handleChange}
          fullWidth
          margin="dense"
          required
          placeholder="e.g., MATRIX"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Computer sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              color: "white",
              backgroundColor: "rgba(0, 0, 0, 0.2)", // Darker input background
              "&:hover fieldset": {
                borderColor: "#5A4FFF", // Updated to match purple theme
              },
            },
            "& .MuiInputLabel-root": {
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "14px", // Light gray, 14px as specified
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255, 255, 255, 0.2)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(90, 79, 255, 0.5)", // Updated to match purple theme
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#5A4FFF", // Updated to match purple theme
            },
          }}
        />
        <TextField
          label="Database Name"
          name="database"
          value={formData.database}
          onChange={handleChange}
          fullWidth
          margin="dense"
          required
          placeholder="e.g., RAW_PROCESS"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Storage sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              color: "white",
              backgroundColor: "rgba(0, 0, 0, 0.2)", // Darker input background
              "&:hover fieldset": {
                borderColor: "#5A4FFF", // Updated to match purple theme
              },
            },
            "& .MuiInputLabel-root": {
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "14px", // Light gray, 14px as specified
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255, 255, 255, 0.2)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(90, 79, 255, 0.5)", // Updated to match purple theme
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#5A4FFF", // Updated to match purple theme
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
          placeholder="Enter username"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AccountCircle sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              color: "white",
              backgroundColor: "rgba(0, 0, 0, 0.2)", // Darker input background
              "&:hover fieldset": {
                borderColor: "#5A4FFF", // Updated to match purple theme
              },
            },
            "& .MuiInputLabel-root": {
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "14px", // Light gray, 14px as specified
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255, 255, 255, 0.2)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(90, 79, 255, 0.5)", // Updated to match purple theme
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#5A4FFF", // Updated to match purple theme
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
          placeholder="Enter password"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Key sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 18 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleTogglePasswordVisibility}
                  edge="end"
                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              color: "white",
              backgroundColor: "rgba(0, 0, 0, 0.2)", // Darker input background
              "&:hover fieldset": {
                borderColor: "#5A4FFF", // Updated to match purple theme
              },
            },
            "& .MuiInputLabel-root": {
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "14px", // Light gray, 14px as specified
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255, 255, 255, 0.2)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(90, 79, 255, 0.5)", // Updated to match purple theme
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#5A4FFF", // Updated to match purple theme
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
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              color: "#fecaca",
              "& .MuiAlert-icon": {
                color: "#ef4444",
                opacity: 0.8,
                fontSize: "1rem",
                mr: 1,
              },
            }}
          >
            {error}
          </Alert>
        )}
        {/* Updated button style */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          startIcon={loading ? null : <ArrowForward />}
          sx={{
            mt: 2,
            mb: 1,
            py: 1.2,
            borderRadius: 1.5,
            fontWeight: 600,
            textTransform: "none",
            fontSize: "0.9rem",
            backgroundColor: "#5A4FFF",
            boxShadow: "0 4px 10px rgba(90, 79, 255, 0.3)",
            "&:hover": {
              backgroundColor: "#6A5FFF",
              boxShadow: "0 6px 15px rgba(90, 79, 255, 0.4)",
              transform: "translateY(-1px)",
            },
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : "Connect"}
        </Button>
        {/* Help link */}
        <Box sx={{ textAlign: "center", mt: 1 }}>
          <Link
            href="#"
            underline="hover"
            sx={{
              color: "rgba(90, 79, 255, 0.8)",
              fontSize: "12px",
              fontStyle: "italic",
              "&:hover": {
                color: "#5A4FFF"
              }
            }}
          >
            Having trouble connecting? View Documentation
          </Link>
        </Box>
      </form>
    </Paper>
  );
};

export default LoginForm;