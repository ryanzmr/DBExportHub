import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import axios from 'axios';
import apiService from './services/api';

// Pages
import LoginPage from './pages/Login';
import ExportPage from './pages/Dashboard';
import ImportPage from './pages/Dashboard/Import';
import HomePage from './pages/HomePage';

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
  
  // Log navigation for debugging and save current path
  useEffect(() => {
    console.log('Current path:', location.pathname);
    console.log('Auth state in navigation effect:', authState);
    
    // Store the current path in sessionStorage if authenticated
    // This will be used to restore the page after refresh
    if (authState.isAuthenticated && 
        location.pathname !== '/login' && 
        location.pathname !== '/') {
      sessionStorage.setItem('lastPath', location.pathname);
      console.log('Saved current path to session storage:', location.pathname);
    }
    
    // Redirect to home page if authenticated and on login page
    if (authState.isAuthenticated && location.pathname === '/login') {
      console.log('Redirecting from login to home page due to authenticated state');
      
      // Check if there's a saved path to restore
      const lastPath = sessionStorage.getItem('lastPath');
      const redirectTo = lastPath || '/home';
      
      // Add a small delay to ensure state is fully updated before navigation
      setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, 100);
    }
  }, [location, authState, navigate]);
  
  const login = async (connectionDetails) => {
    try {
      console.log('Login called with:', connectionDetails);
      
      // Request JWT token from backend using the configured API service
      const response = await apiService.login(connectionDetails);
      
      if (response.token) {
        const token = response.token;
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
            <Navigate to="/home" replace /> : 
            <LoginPage />
          } />
          <Route 
            path="/home" 
            element={
              authState.isAuthenticated ? 
              <HomePage /> : 
              <Navigate to="/login" replace state={{ from: location }} />
            } 
          />
          <Route 
            path="/export" 
            element={
              authState.isAuthenticated ? 
              <ExportPage /> : 
              <Navigate to="/login" replace state={{ from: location }} />
            } 
          />
          <Route 
            path="/import" 
            element={
              authState.isAuthenticated ? 
              <ImportPage /> : 
              <Navigate to="/login" replace state={{ from: location }} />
            } 
          />
          <Route path="/" element={
            authState.isAuthenticated ? 
            <Navigate to="/home" replace /> : 
            <Navigate to="/login" replace />
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Box>
    </AuthContext.Provider>
  );
}

export default App;