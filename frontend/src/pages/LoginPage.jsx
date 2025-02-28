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
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../App';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
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
        // Store complete connection details including password
        const completeConnectionDetails = {
          ...response.data.connection_details,
          password: formData.password // Add password to connection details
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
        minHeight: '80vh'
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        DBExportHub
      </Typography>
      
      <Typography variant="subtitle1" sx={{ mb: 3 }}>
        Connect to your database to export data
      </Typography>
      
      <Card sx={{ maxWidth: 500, width: '100%' }}>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Database Connection
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
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
              helperText="SQL Server name or address"
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
              helperText="Database name"
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
              helperText="Database username"
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
              helperText="Database password"
            />
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 2 }}
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