import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';

// Custom components
import LoginBackground from '../components/login/LoginBackground';
import LoginForm from '../components/login/LoginForm';

// Custom hooks and services
import useAuth from '../hooks/useAuth';

/**
 * Login page component for database connection
 * Handles user authentication and navigation
 */
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
      console.log('Sending login request with:', formData);
      
      // Login with the connection details
      const loginSuccess = await login(formData);
      
      if (loginSuccess) {
        console.log('Login successful, navigating to /export');
        // Use navigate with replace option to ensure proper navigation
        // Adding a small delay to ensure auth state is fully updated
        setTimeout(() => {
          console.log('Executing navigation to /export');
          navigate('/export', { replace: true });
          
          // Only use window.location as a last resort fallback
          setTimeout(() => {
            if (window.location.pathname !== '/export') {
              console.log('Fallback navigation to /export');
              window.location.href = '/export';
            }
          }, 1500);
        }, 200);
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Connection failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e40af 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background with decorative elements */}
      <LoginBackground />
      
      {/* Login Form */}
      <LoginForm 
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        loading={loading}
        error={error}
      />
    </Box>
  );
};

export default LoginPage;