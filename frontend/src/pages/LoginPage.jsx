import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  useTheme
} from '@mui/material';
import { Storage, Computer } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../App';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const theme = useTheme();
  
  const [formData, setFormData] = useState({
    server: '',
    database: '',
    username: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:8000/api/login', formData);
      
      if (response.data.status === 'success') {
        const completeConnectionDetails = {
          ...response.data.connection_details,
          password: formData.password
        };
        login(completeConnectionDetails);
        navigate('/export');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Connection failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: `linear-gradient(45deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 35%, ${theme.palette.secondary.main} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
          opacity: 0.6,
        }
      }}
    >
      <Card sx={{ maxWidth: 500, width: '90%', position: 'relative', zIndex: 1 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
            <Storage sx={{ fontSize: 40, color: theme.palette.primary.main, mr: 2 }} />
            <Typography variant="h4" component="h1">
              DBExportHub
            </Typography>
          </Box>
          
          <Typography variant="subtitle1" sx={{ mb: 4, textAlign: 'center', color: 'text.secondary' }}>
            Connect to your database to export data
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <TextField
              label="Server"
              name="server"
              value={formData.server}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              placeholder="e.g., localhost\\SQLEXPRESS"
              InputProps={{
                startAdornment: <Computer sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
            
            <TextField
              label="Database"
              name="database"
              value={formData.database}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              placeholder="e.g., ExportDB"
              InputProps={{
                startAdornment: <Storage sx={{ mr: 1, color: 'action.active' }} />
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
              placeholder="e.g., sa"
            />
            
            <TextField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{
                mt: 3,
                mb: 2,
                height: 48,
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                }
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Connect'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;