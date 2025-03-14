import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import axios from 'axios';

// Pages
import LoginPage from './pages/Login';
import ExportPage from './pages/Dashboard';

// Context for managing authentication state
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    connectionDetails: null,
    token: null,
    tokenExpiry: null
  });
  const location = useLocation();
  const navigate = useNavigate();

  // Check for token on initial load and set up refresh timer
  useEffect(() => {
    const checkAuth = () => {
      const token = sessionStorage.getItem('authToken');
      const tokenExpiry = sessionStorage.getItem('tokenExpiry');
      const connectionDetails = JSON.parse(sessionStorage.getItem('connectionDetails') || 'null');
      
      if (token && tokenExpiry && connectionDetails) {
        // Check if token is still valid
        if (new Date(tokenExpiry) > new Date()) {
          console.log('Found valid token, restoring session');
          
          // Set up axios interceptor for adding token to requests
          axios.interceptors.request.use(
            config => {
              config.headers['Authorization'] = `Bearer ${token}`;
              return config;
            },
            error => Promise.reject(error)
          );
          
          setAuthState({
            isAuthenticated: true,
            connectionDetails,
            token,
            tokenExpiry
          });
          
          // Set up token refresh before expiry
          const timeToExpiry = new Date(tokenExpiry) - new Date();
          if (timeToExpiry > 0) {
            console.log(`Token expires in ${Math.round(timeToExpiry/1000)} seconds`);
            setTimeout(() => {
              console.log('Token expired, logging out');
              // Redirect to login when token expires
              if (location.pathname !== '/login') {
                logout();
                navigate('/login');
              }
            }, timeToExpiry);
          }
        } else {
          console.log('Token expired, clearing session');
          // Token expired, clear storage
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('tokenExpiry');
          sessionStorage.removeItem('connectionDetails');
        }
      }
    };
    
    checkAuth();
  }, [navigate, location.pathname]);
  // Log navigation for debugging
  useEffect(() => {
    console.log('Current path:', location.pathname);
    console.log('Auth state in navigation effect:', authState);
    
    // Redirect to export page if authenticated and on login page
    if (authState.isAuthenticated && location.pathname === '/login') {
      console.log('Redirecting from login to export page due to authenticated state');
      // Add a small delay to ensure state is fully updated before navigation
      setTimeout(() => {
        navigate('/export', { replace: true });
      }, 100);
    }
  }, [location, authState, navigate]);
  const login = async (connectionDetails) => {
    try {
      console.log('Login called with:', connectionDetails);
      
      // Request JWT token from backend
      const response = await axios.post('http://localhost:8000/api/auth/login', connectionDetails);
      
      if (response.data.token) {
        const token = response.data.token;
        // Set token expiry to 60 minutes from now to match backend configuration
        const tokenExpiry = new Date(new Date().getTime() + 60 * 60000).toISOString();
        
        // Store in session storage
        sessionStorage.setItem('authToken', token);
        sessionStorage.setItem('tokenExpiry', tokenExpiry);
        sessionStorage.setItem('connectionDetails', JSON.stringify(connectionDetails));
        
        // Set up axios interceptor for adding token to requests
        axios.interceptors.request.use(
          config => {
            config.headers['Authorization'] = `Bearer ${token}`;
            return config;
          },
          error => Promise.reject(error)
        );
        
        // Update auth state - ensure this is the last operation
        await new Promise(resolve => {
          setAuthState({
            isAuthenticated: true,
            connectionDetails,
            token,
            tokenExpiry
          });
          // Give React time to process the state update
          setTimeout(resolve, 50);
        });
        
        console.log('Auth state updated:', {
          isAuthenticated: true,
          connectionDetails,
          tokenExpiry
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };
  const logout = () => {
    // Clear session storage
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('tokenExpiry');
    sessionStorage.removeItem('connectionDetails');
    
    setAuthState({
      isAuthenticated: false,
      connectionDetails: null,
      token: null,
      tokenExpiry: null
    });
  };

  console.log('Auth state:', authState);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Routes>
          <Route path="/login" element={
            authState.isAuthenticated ? 
            <Navigate to="/export" replace /> : 
            <LoginPage />
          } />
          <Route 
            path="/export" 
            element={
              authState.isAuthenticated ? 
              <ExportPage /> : 
              <Navigate to="/login" replace state={{ from: location }} />
            } 
          />
          <Route path="/" element={
            authState.isAuthenticated ? 
            <Navigate to="/export" replace /> : 
            <Navigate to="/login" replace />
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Box>
    </AuthContext.Provider>
  );
}

export default App;