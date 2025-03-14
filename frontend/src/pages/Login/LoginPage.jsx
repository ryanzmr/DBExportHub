import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid } from '@mui/material';

// Custom components
import LoginBackground from '../../components/login/LoginBackground';
import LoginForm from '../../components/login/LoginForm';
import LoginHeader from '../../components/login/LoginHeader';
import LoginFooter from '../../components/login/LoginFooter';
import FeatureSection from '../../components/login/FeatureSection';
import useAuth from '../../hooks/useAuth';
import { loginContainerStyles } from './styles/LoginPageStyles';

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
      const loginSuccess = await login(formData);
      
      if (loginSuccess) {
        setTimeout(() => {
          navigate('/export', { replace: true });
          
          // Fallback navigation
          setTimeout(() => {
            if (window.location.pathname !== '/export') {
              window.location.href = '/export';
            }
          }, 1500);
        }, 200);
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Connection failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={loginContainerStyles}>
      <LoginHeader />
      <LoginBackground />
      
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          width: "92%",
          minHeight: "calc(100vh - 120px)",
          zIndex: 1,
          px: { xs: 2, sm: 2.5, md: 3 },
          py: { xs: 4, md: 5 },
          maxWidth: "1200px",
          mx: "auto",
          alignItems: "center",
          justifyContent: "center",
          gap: { xs: 3, md: 4 },
          mt: { xs: 8, sm: 10 } // Add top margin to prevent overlap with header
        }}>

        {/* Left side: Features */}
        <FeatureSection />
        
        {/* Right side: Login Form */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <LoginForm
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            loading={loading}
            error={error}
          />
        </Box>
      </Box>
      
      <LoginFooter />
    </Box>
  );
};

export default LoginPage;