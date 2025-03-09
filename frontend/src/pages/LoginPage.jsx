import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid } from '@mui/material';
import { 
  FlashOn,
  ShieldOutlined,
  TableRows,
  Storage,
  ArrowDownward,
  PreviewOutlined
} from '@mui/icons-material';

// Custom components
import LoginBackground from '../components/login/LoginBackground';
import LoginForm from '../components/login/LoginForm';
import LoginHeader from '../components/login/LoginHeader';
import LoginFooter from '../components/login/LoginFooter';
import FeatureCard from '../components/login/FeatureCard';
import useAuth from '../hooks/useAuth';
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
          width: "75%",
          minHeight: "calc(100vh - 140px)",
          zIndex: 1,
          px: { xs: 1.5, sm: 2, md: 3 },
          py: { xs: 2, md: 3 },
          maxWidth: "1200px",
          mx: "auto",
          alignItems: "center",
          justifyContent: "center",
          gap: { xs: 2, md: 4 }
        }}>

        {/* Left side: Features */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            pr: { md: 4 },
            mb: { xs: 3, md: 0 },
            mt: { xs: 1, md: 0 },
          }}
        >
          <Box
            sx={{
              width: 60,
              height: 60,
              position: "relative",
              mb: 2,
              "&:hover": {
                transform: "scale(1.05)",
                transition: "transform 0.2s ease-in-out",
              },
            }}
          >
            <Box
              sx={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: 3,
                background: "linear-gradient(135deg, rgba(90, 79, 255, 0.2), rgba(90, 79, 255, 0.1))",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Storage 
                sx={{ 
                  fontSize: 32,
                  color: "#FFFFFF",
                  mb: 1,
                }} 
              />
            </Box>
          </Box>
          
          <Typography
            variant="h4"
            sx={{
              color: "white",
              fontWeight: 700,
              mb: 1.5,
              fontSize: { xs: "1.5rem", sm: "1.8rem" },
            }}
          >
            Database Export Made Simple
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              color: "rgba(255, 255, 255, 0.7)",
              mb: 3,
              fontSize: { xs: "0.85rem", sm: "0.95rem" },
              maxWidth: 320,
            }}
          >
            Connect to your database and export data with ease. Our intuitive interface makes database management accessible to everyone.
          </Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6}>
              <FeatureCard
                icon={<FlashOn sx={{ color: "#5A4FFF", fontSize: 20 }} />}
                title="Fast Export"
                description="Export your data quickly with optimized SQL queries."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FeatureCard
                icon={<PreviewOutlined sx={{ color: "#5A4FFF", fontSize: 20 }} />}
                title="Data Preview"
                description="Preview your data before exporting to ensure accuracy."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FeatureCard
                icon={<ShieldOutlined sx={{ color: "#5A4FFF", fontSize: 20 }} />}
                title="Secure"
                description="Token-based authentication for secure database access."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FeatureCard
                icon={<TableRows sx={{ color: "#5A4FFF", fontSize: 20 }} />}
                title="Formatted"
                description="Export to Excel with proper styling and formatting."
              />
            </Grid>
          </Grid>
        </Box>
        
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