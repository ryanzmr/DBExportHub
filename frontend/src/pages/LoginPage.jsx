import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Paper,
  Container
} from '@mui/material';
import { Storage, Computer, AccountCircle, Key, ErrorOutline, Login, Dns, DataObject, Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';
<<<<<<< HEAD
// Import shared styles
import { loginTextFieldStyle, primaryButtonStyle } from '../styles/formStyles';
=======
import { useAuth } from '../App';
>>>>>>> parent of 3449f4b (Implemented_enhancements (#5))

const FloatingText = ({ text, style }) => (
  <Box
    sx={{
      position: "absolute",
      fontFamily: "monospace",
      color: "rgba(255, 255, 255, 0.1)",
      fontSize: "14px",
      whiteSpace: "nowrap",
      animation: "float 10s ease-in-out infinite",
      ...style,
    }}
  >
    {text}
  </Box>
);

// Database-themed decorative components
const DatabaseIcon = ({ style }) => (
  <Box
    component="div"
    sx={{
      position: "absolute",
      width: "40px",
      height: "40px",
      borderRadius: "6px",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      animation: "float 15s ease-in-out infinite",
      ...style,
    }}
  >
    <Storage sx={{ fontSize: 20, color: "rgba(255, 255, 255, 0.2)" }} />
  </Box>
);

const DataFlow = ({ style }) => (
  <Box
    sx={{
      position: "absolute",
      height: "2px",
      background: "linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.1))",
      animation: "dataFlow 4s linear infinite",
      "@keyframes dataFlow": {
        "0%": { backgroundPosition: "0% 0%" },
        "100%": { backgroundPosition: "200% 0%" },
      },
      backgroundSize: "200% 100%",
      ...style,
    }}
  />
);

const TableIcon = ({ style }) => (
  <Box
    sx={{
      position: "absolute",
      width: "50px",
      height: "30px",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      borderRadius: "4px",
      display: "flex",
      flexDirection: "column",
      padding: "2px",
      animation: "float 12s ease-in-out infinite",
      ...style,
    }}
  >
    <Box sx={{ height: "6px", width: "100%", borderBottom: "1px solid rgba(255, 255, 255, 0.15)" }}></Box>
    <Box sx={{ height: "6px", width: "100%", borderBottom: "1px solid rgba(255, 255, 255, 0.15)" }}></Box>
    <Box sx={{ height: "6px", width: "100%" }}></Box>
  </Box>
);

const CircleDecoration = ({ style }) => (
  <Box
    sx={{
      position: "absolute",
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)",
      animation: "pulse 8s ease-in-out infinite",
      ...style,
    }}
  />
);

const GlowingDot = ({ style }) => (
  <Box
    sx={{
      position: "absolute",
      width: "4px",
      height: "4px",
      borderRadius: "50%",
      background: "rgba(255, 255, 255, 0.6)",
      boxShadow: "0 0 8px 2px rgba(255, 255, 255, 0.3)",
      animation: "pulse 4s ease-in-out infinite",
      ...style,
    }}
  />
);

const LoginPage = ({ login }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  const [formData, setFormData] = useState({
    server: '',
    database: '',
    username: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const handleTogglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };
  
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
      const response = await axios.post('http://localhost:8000/api/auth/login', formData);
      
      console.log('Login response:', response.data);
      
      // Check if token exists in the response
      if (response.data.token) {
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
      } else {
        setError('Invalid response from server. Token not received.');
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
      {/* DBExportHub Logo in top-left corner */}
      <Box
        sx={{
          position: "absolute",
          top: { xs: 12, sm: 20 },
          left: { xs: 12, sm: 20 },
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          zIndex: 1,
          transform: { xs: "scale(0.9)", sm: "scale(1)" },
          transformOrigin: "left center",
        }}
      >
        <Box
          sx={{
            p: 0.7,
            borderRadius: 1.5,
            background: "linear-gradient(45deg, #1e40af, #3b82f6)",
            boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <DataObject
            sx={{
              fontSize: 18,
              color: "white",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
            }}
          />
        </Box>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            background: "linear-gradient(45deg, #fff, rgba(255,255,255,0.9))",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "0.02em",
            textShadow: "0 2px 10px rgba(59, 130, 246, 0.2)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "1.1rem",
          }}
        >
          DBExportHub
        </Typography>
      </Box>

      {/* Decorative Background Elements */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
          zIndex: 0,
          "&::before": {
            content: '""',
            position: "absolute",
            width: "200%",
            height: "200%",
            background: "radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 40%, rgba(30, 64, 175, 0.08) 0%, transparent 50%), linear-gradient(45deg, rgba(59, 130, 246, 0.03) 0%, transparent 75%)",
            animation: "rotate 30s linear infinite, wave 15s ease-in-out infinite",
          },
          "@keyframes rotate": {
            "0%": {
              transform: "translate(-50%, -50%) rotate(0deg)"
            },
            "100%": {
              transform: "translate(-50%, -50%) rotate(360deg)"
            }
          },
          "@keyframes wave": {
            "0%, 100%": {
              transform: "translate(-50%, -50%) scale(1)"
            },
            "50%": {
              transform: "translate(-50%, -50%) scale(1.1)"
            }
          },
          "@keyframes float": {
            "0%, 100%": {
              transform: "translateY(0px) rotate(0deg)"
            },
            "50%": {
              transform: "translateY(-20px) rotate(5deg)"
            }
          },
          "@keyframes pulse": {
            "0%, 100%": {
              opacity: 0.3
            },
            "50%": {
              opacity: 0.6
            }
          },
          "@keyframes dataFlow": {
            "0%": { backgroundPosition: "0% 0%" },
            "100%": { backgroundPosition: "200% 0%" }
          }
        }}
      >
        {/* Enhanced database visualization elements */}
        
        {/* Cloud Database Visualization */}
        <Box
          sx={{
            position: "absolute",
            top: "8%",
            right: "12%",
            width: "140px",
            height: "90px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            animation: "float 18s ease-in-out infinite",
          }}
        >
          {/* Cloud shape */}
          <Box
            sx={{
              width: "120px",
              height: "60px",
              borderRadius: "30px",
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(59, 130, 246, 0.15) 100%)",
              boxShadow: "0 0 20px rgba(59, 130, 246, 0.2)",
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(59, 130, 246, 0.15) 100%)",
                top: "-20px",
                left: "15px",
              },
              "&::after": {
                content: '""',
                position: "absolute",
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(59, 130, 246, 0.15) 100%)",
                top: "-25px",
                right: "15px",
              },
            }}
          />
          
          {/* Database cylinders under cloud */}
          <Box
            sx={{
              width: "80px",
              height: "15px",
              borderRadius: "5px 5px 0 0",
              background: "rgba(59, 130, 246, 0.2)",
              marginTop: "-5px",
              position: "relative",
              zIndex: 1,
              "&::after": {
                content: '""',
                position: "absolute",
                width: "80px",
                height: "15px",
                borderRadius: "0 0 5px 5px",
                background: "rgba(59, 130, 246, 0.15)",
                bottom: "-15px",
                left: 0
              }
            }}
          />
        </Box>

        {/* Add more decorative elements */}
        <FloatingText text="SELECT * FROM" style={{ top: "15%", left: "10%" }} />
        <FloatingText text="JOIN tables ON" style={{ top: "25%", left: "65%" }} />
        <FloatingText text="WHERE condition" style={{ top: "40%", left: "20%" }} />
        <FloatingText text="GROUP BY column" style={{ top: "60%", left: "75%" }} />
        <FloatingText text="ORDER BY column" style={{ top: "75%", left: "15%" }} />

        <DatabaseIcon style={{ top: "20%", left: "25%" }} />
        <DatabaseIcon style={{ top: "65%", left: "30%" }} />
        <DatabaseIcon style={{ top: "35%", left: "80%" }} />
        
        <TableIcon style={{ top: "30%", left: "15%" }} />
        <TableIcon style={{ top: "70%", left: "70%" }} />
        
        <DataFlow style={{ top: "25%", left: "35%", width: "100px" }} />
        <DataFlow style={{ top: "45%", left: "60%", width: "120px", transform: "rotate(45deg)" }} />
        <DataFlow style={{ top: "65%", left: "40%", width: "80px", transform: "rotate(-30deg)" }} />
        
        <CircleDecoration style={{ top: "40%", left: "50%", width: "300px", height: "300px" }} />
        <CircleDecoration style={{ top: "20%", left: "70%", width: "150px", height: "150px" }} />
        
        <GlowingDot style={{ top: "30%", left: "40%" }} />
        <GlowingDot style={{ top: "60%", left: "25%" }} />
        <GlowingDot style={{ top: "25%", left: "85%" }} />
        <GlowingDot style={{ top: "70%", left: "60%" }} />
      </Box>

      {/* Login Form */}
      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
        <Paper
          elevation={8}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 2,
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            overflow: "hidden",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "5px",
              background: "linear-gradient(90deg, #1e40af, #3b82f6)",
            },
          }}
        >
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Box sx={{ mb: 3, textAlign: "center" }}>
              <Typography
                variant="h5"
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: "#1a365d",
                  mb: 1,
                  letterSpacing: "0.5px",
                }}
              >
                Database Connection
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mb: 2 }}
              >
                Enter your database credentials to access export functionality
              </Typography>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{ mb: 3 }}
                icon={<ErrorOutline />}
              >
                {error}
              </Alert>
            )}

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                id="server"
                name="server"
                label="Server"
                placeholder="Enter server address"
                value={formData.server}
                onChange={handleChange}
                required
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Dns sx={{ color: theme.palette.primary.main }} />
                    </InputAdornment>
                  ),
                }}
                sx={loginTextFieldStyle}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                id="database"
                name="database"
                label="Database"
                placeholder="Enter database name"
                value={formData.database}
                onChange={handleChange}
                required
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Storage sx={{ color: theme.palette.primary.main }} />
                    </InputAdornment>
                  ),
                }}
                sx={loginTextFieldStyle}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                id="username"
                name="username"
                label="Username"
                placeholder="Enter username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircle sx={{ color: theme.palette.primary.main }} />
                    </InputAdornment>
                  ),
                }}
                sx={loginTextFieldStyle}
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <TextField
                fullWidth
                id="password"
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Key sx={{ color: theme.palette.primary.main }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        sx={{ minWidth: 'auto', p: 0.5 }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </Button>
                    </InputAdornment>
                  ),
                }}
                sx={loginTextFieldStyle}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              startIcon={loading ? null : <Login />}
              sx={{
                ...primaryButtonStyle,
                py: 1.2,
                fontSize: "1rem",
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                "&:hover": {
                  boxShadow: "0 6px 16px rgba(59, 130, 246, 0.4)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease",
              }}
            >
<<<<<<< HEAD
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Connect"
              )}
            </Button>
          </Box>
        </Paper>
      </Container>
=======
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
>>>>>>> parent of 3449f4b (Implemented_enhancements (#5))
    </Box>
  );
};

export default LoginPage;