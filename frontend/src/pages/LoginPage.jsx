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
import { useAuth } from '../App';

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

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
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
                bottom: "-18px",
                left: 0,
              },
              "&::before": {
                content: '""',
                position: "absolute",
                width: "80px",
                height: "15px",
                background: "rgba(30, 64, 175, 0.2)",
                bottom: "-9px",
                left: 0,
              },
            }}
          />
          
          {/* Data transfer lines */}
          <Box
            sx={{
              position: "absolute",
              width: "100px",
              height: "2px",
              background: "linear-gradient(90deg, rgba(59, 130, 246, 0), rgba(59, 130, 246, 0.4), rgba(59, 130, 246, 0))",
              backgroundSize: "200% 100%",
              animation: "dataFlow 3s linear infinite",
              bottom: "10px",
              left: "-80px",
              transform: "rotate(15deg)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              width: "120px",
              height: "2px",
              background: "linear-gradient(90deg, rgba(59, 130, 246, 0), rgba(59, 130, 246, 0.4), rgba(59, 130, 246, 0))",
              backgroundSize: "200% 100%",
              animation: "dataFlow 4s linear infinite",
              bottom: "25px",
              right: "-100px",
              transform: "rotate(-20deg)",
            }}
          />
        </Box>
        
        {/* Server Rack Visualization */}
        <Box
          sx={{
            position: "absolute",
            bottom: "12%",
            left: "8%",
            width: "100px",
            height: "140px",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            borderRadius: "5px",
            background: "rgba(15, 23, 42, 0.3)",
            display: "flex",
            flexDirection: "column",
            padding: "5px",
            gap: "5px",
            animation: "float 15s ease-in-out infinite",
            boxShadow: "0 0 15px rgba(59, 130, 246, 0.1)",
          }}
        >
          {/* Server units */}
          {Array.from({ length: 5 }).map((_, i) => (
            <Box
              key={i}
              sx={{
                height: "20px",
                width: "100%",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "3px",
                background: "rgba(30, 64, 175, 0.2)",
                display: "flex",
                alignItems: "center",
                padding: "0 5px",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ 
                width: "5px", 
                height: "5px", 
                borderRadius: "50%", 
                background: i % 2 === 0 ? "rgba(59, 130, 246, 0.5)" : "rgba(74, 222, 128, 0.5)",
                boxShadow: i % 2 === 0 ? "0 0 5px rgba(59, 130, 246, 0.5)" : "0 0 5px rgba(74, 222, 128, 0.5)",
              }} />
              <Box sx={{ display: "flex", gap: "3px" }}>
                {Array.from({ length: 3 }).map((_, j) => (
                  <Box 
                    key={j}
                    sx={{ 
                      width: "3px", 
                      height: "8px", 
                      background: "rgba(255, 255, 255, 0.2)",
                    }} 
                  />
                ))}
              </Box>
            </Box>
          ))}
          
          {/* Connection to cloud */}
          <Box
            sx={{
              position: "absolute",
              width: "150px",
              height: "2px",
              background: "linear-gradient(90deg, rgba(59, 130, 246, 0), rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0))",
              backgroundSize: "200% 100%",
              animation: "dataFlow 5s linear infinite",
              top: "30%",
              right: "-130px",
              transform: "rotate(-10deg)",
            }}
          />
        </Box>
        
        {/* API Gateway Visualization */}
        <Box
          sx={{
            position: "absolute",
            top: "35%",
            right: "25%",
            width: "80px",
            height: "80px",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            borderRadius: "10px",
            background: "rgba(15, 23, 42, 0.4)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            animation: "float 12s ease-in-out infinite",
            boxShadow: "0 0 15px rgba(59, 130, 246, 0.1)",
            "&::before": {
              content: '""',
              position: "absolute",
              width: "70%",
              height: "70%",
              border: "1px dashed rgba(59, 130, 246, 0.3)",
              borderRadius: "50%",
              animation: "rotate 20s linear infinite",
            }
          }}
        >
          <Typography sx={{ fontSize: "8px", color: "rgba(255, 255, 255, 0.5)", mb: 0.5 }}>API</Typography>
          <Box sx={{ 
            width: "40px", 
            height: "40px", 
            display: "flex", 
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "3px" 
          }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Box 
                key={i}
                sx={{ 
                  width: "25px", 
                  height: "4px", 
                  background: "rgba(59, 130, 246, 0.3)",
                  borderRadius: "2px",
                }} 
              />
            ))}
          </Box>
        </Box>
        
        {/* Data Warehouse */}
        <Box
          sx={{
            position: "absolute",
            top: "60%",
            left: "20%",
            width: "100px",
            height: "70px",
            perspective: "500px",
            animation: "float 16s ease-in-out infinite",
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: "100%",
              position: "relative",
              transformStyle: "preserve-3d",
              transform: "rotateX(15deg) rotateY(15deg)",
            }}
          >
            {/* Front face */}
            <Box
              sx={{
                position: "absolute",
                width: "100%",
                height: "100%",
                background: "rgba(30, 64, 175, 0.2)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "5px",
                display: "flex",
                flexDirection: "column",
                padding: "5px",
                gap: "3px",
              }}
            >
              <Typography sx={{ fontSize: "7px", color: "rgba(255, 255, 255, 0.5)", textAlign: "center" }}>DATA WAREHOUSE</Typography>
              {Array.from({ length: 4 }).map((_, i) => (
                <Box 
                  key={i}
                  sx={{ 
                    height: "5px", 
                    width: `${70 + Math.random() * 20}%`, 
                    background: "rgba(59, 130, 246, 0.2)",
                    borderRadius: "2px",
                  }} 
                />
              ))}
            </Box>
            
            {/* Side face */}
            <Box
              sx={{
                position: "absolute",
                width: "15px",
                height: "100%",
                background: "rgba(15, 23, 42, 0.3)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "0 5px 5px 0",
                transform: "rotateY(90deg) translateZ(100px) translateX(-7.5px)",
              }}
            />
            
            {/* Top face */}
            <Box
              sx={{
                position: "absolute",
                width: "100%",
                height: "15px",
                background: "rgba(59, 130, 246, 0.15)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "5px 5px 0 0",
                transform: "rotateX(90deg) translateZ(7.5px) translateY(-7.5px)",
              }}
            />
          </Box>
        </Box>
        
        {/* Keep existing elements */}
        {/* Large database server icon */}
        <Box
          sx={{
            position: "absolute",
            width: "120px",
            height: "160px",
            border: "2px solid rgba(59, 130, 246, 0.2)",
            borderRadius: "10px",
            background: "linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 64, 175, 0.3) 100%)",
            backdropFilter: "blur(4px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            top: "15%",
            left: "10%",
            animation: "float 20s ease-in-out infinite",
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.15)",
          }}
        >
          <Dns sx={{ fontSize: 40, color: "rgba(255, 255, 255, 0.3)", mb: 1 }} />
          <Box sx={{ width: "80%", height: "4px", background: "rgba(59, 130, 246, 0.3)", mb: 1, borderRadius: "2px" }} />
          <Box sx={{ width: "60%", height: "4px", background: "rgba(59, 130, 246, 0.2)", mb: 1, borderRadius: "2px" }} />
          <Box sx={{ width: "70%", height: "4px", background: "rgba(59, 130, 246, 0.2)", borderRadius: "2px" }} />
        </Box>
        
        {/* Database cluster visualization */}
        <Box
          sx={{
            position: "absolute",
            bottom: "15%",
            right: "10%",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            border: "2px dashed rgba(59, 130, 246, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "rotate 40s linear infinite",
          }}
        >
          {/* Keep existing content */}
        </Box>
        
        {/* Keep other existing elements */}
      </Box>

      {/* Login Form Paper */}
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
    </Box>
  );
};

export default LoginPage;