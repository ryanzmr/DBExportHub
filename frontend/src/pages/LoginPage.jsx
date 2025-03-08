import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid } from '@mui/material';
import { 
  FlashOn,
  Visibility,
  ShieldOutlined,
  TableRows,
  Storage,
  ArrowDownward,
  StarOutline
} from '@mui/icons-material';

// Custom components
import LoginBackground from '../components/login/LoginBackground';
import LoginForm from '../components/login/LoginForm';
import LoginHeader from '../components/login/LoginHeader';
import LoginFooter from '../components/login/LoginFooter';
import useAuth from '../hooks/useAuth';

const FeatureCard = ({ icon, title, description }) => (
  <Box
    sx={{
      p: 2.5,
      background: "rgba(255, 255, 255, 0.03)",
      borderRadius: 2.5,
      border: "1px solid rgba(255, 255, 255, 0.1)",
      transition: "all 0.2s ease-in-out",
      "&:hover": {
        transform: "translateY(-2px)",
        background: "rgba(255, 255, 255, 0.05)",
      },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
      <Box
        sx={{
          p: 1,
          borderRadius: 1.5,
          background: "rgba(90, 79, 255, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mr: 1.5,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" sx={{ color: "white", fontSize: "0.95rem", fontWeight: 500 }}>
        {title}
      </Typography>
    </Box>
    <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.85rem" }}>
      {description}
    </Typography>
  </Box>
);

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
        background: "linear-gradient(135deg, #0D0D2B 0%, #13132A 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <LoginHeader />
      <LoginBackground />
      
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          width: "100%",
          height: "100%",
          zIndex: 1,
          px: { xs: 2, sm: 4, md: 6 },
          py: { xs: 8, md: 12 }, // Increased vertical padding
          mt: { xs: 4, md: 6 }, // Added top margin for header spacing
          mb: { xs: 6, md: 8 }, // Added bottom margin for footer spacing
          maxWidth: "1600px", // Added max width
          mx: "auto", // Center the content
        }}
      >
        {/* Left side: Features */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            pr: { md: 8 }, // Increased right padding
            mb: { xs: 6, md: 0 },
            mt: { xs: 2, md: 0 }, // Added top margin for mobile
          }}
        >
          {/* Add the icon above the title */}
          <Box
            sx={{
              width: 80,
              height: 80,
              position: "relative",
              mb: 3,
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
              <Box
                sx={{
                  position: "absolute",
                  right: -6,
                  top: -6,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #4A3FEF, #5A4FFF)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowDownward 
                  sx={{ 
                    fontSize: 14,
                    color: "#FFFFFF",
                  }} 
                />
              </Box>
            </Box>
          </Box>

          <Typography
            variant="h3"
            sx={{
              color: "white",
              fontWeight: 700,
              mb: 1,
              fontSize: { xs: "2rem", sm: "2.5rem" },
            }}
          >
            Database Export Made Simple
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "rgba(255, 255, 255, 0.7)",
              mb: 4,
              maxWidth: "600px",
            }}
          >
            Connect to your SQL Server database and export data to Excel with just a few clicks.
          </Typography>

          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <FeatureCard
                icon={<FlashOn sx={{ color: "#5A4FFF", fontSize: 22 }} />}
                title="Fast Export"
                description="Optimized for large datasets"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FeatureCard
                icon={<Visibility sx={{ color: "#5A4FFF", fontSize: 22 }} />}
                title="Data Preview"
                description="See data before exporting"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FeatureCard
                icon={<ShieldOutlined sx={{ color: "#5A4FFF", fontSize: 22 }} />}
                title="Secure"
                description="Token-based authentication"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FeatureCard
                icon={<TableRows sx={{ color: "#5A4FFF", fontSize: 22 }} />}
                title="Formatted"
                description="Excel with proper styling"
              />
            </Grid>
          </Grid>
        </Box>

        {/* Right side: Login form */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: { xs: "flex-start", md: "center" }, // Align to top on mobile
            pt: { xs: 0, md: 4 }, // Added top padding
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