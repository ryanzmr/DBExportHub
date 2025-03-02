import React, { useState, FormEvent, ChangeEvent } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Container,
  InputAdornment,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Dns, DataObject, AccountCircle, Key, ErrorOutline, Login, Storage } from '@mui/icons-material';

export default function LoginPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    server: '',
    database: '',
    username: '',
    password: '',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      // Store the token in localStorage
      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
          opacity: 0.5,
        },
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 12, sm: 20 },
          left: { xs: 12, sm: 20 },
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          zIndex: 1,
          transform: { xs: 'scale(0.9)', sm: 'scale(1)' },
          transformOrigin: 'left center',
        }}
      >
        <Storage sx={{ fontSize: 32, color: 'white' }} />
        <Typography
          variant="h6"
          sx={{
            color: 'white',
            fontWeight: 600,
            letterSpacing: '-0.05em',
          }}
        >
          DBExportHub
        </Typography>
      </Box>

      {/* Login Form */}
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                Database Login
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Enter your database credentials to connect
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Server"
              name="server"
              value={formData.server}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Dns />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Database"
              name="database"
              value={formData.database}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DataObject />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircle />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              type="password"
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Key />
                  </InputAdornment>
                ),
              }}
            />

            {error && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                <ErrorOutline fontSize="small" />
                <Typography variant="body2">{error}</Typography>
              </Box>
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Login />}
              sx={{
                mt: 2,
                py: 1.5,
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              {loading ? 'Connecting...' : 'Connect to Database'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}