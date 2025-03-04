import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import axios from 'axios';

// Pages
import LoginPage from './pages/LoginPage';
import ExportPage from './pages/ExportPage';

// App component with routes protected by authentication
function App() {
  const location = useLocation();
  
  // Authentication state
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    connectionDetails: null,
    token: null,
    tokenExpiry: null,
    isLoading: true // Add loading state to prevent flashes during initial load
  });
  
  // Timer reference for cleanup
  const tokenExpiryTimerRef = React.useRef(null);

  // Clear the expiry timer when component unmounts
  useEffect(() => {
    return () => {
      if (tokenExpiryTimerRef.current) {
        clearTimeout(tokenExpiryTimerRef.current);
      }
    };
  }, []);

  // Setup axios interceptor for authentication
  const setupAxiosInterceptor = useCallback((token) => {
    // Remove any existing interceptors to prevent duplicates
    axios.interceptors.request.handlers = [];
    
    // Add the authorization header to all requests
    axios.interceptors.request.use(
      config => {
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );
  }, []);

  // Check authentication status on initial load
  useEffect(() => {
    const checkAuth = () => {
      const token = sessionStorage.getItem('authToken');
      const tokenExpiry = sessionStorage.getItem('tokenExpiry');
      const connectionDetails = JSON.parse(sessionStorage.getItem('connectionDetails') || 'null');
      
      if (token && tokenExpiry && connectionDetails) {
        // Check if token is still valid
        if (new Date(tokenExpiry) > new Date()) {
          console.log('Found valid token, restoring session');
          
          // Setup axios interceptor
          setupAxiosInterceptor(token);
          
          // Update auth state
          setAuthState({
            isAuthenticated: true,
            connectionDetails,
            token,
            tokenExpiry,
            isLoading: false
          });
          
          // Set up token expiry handler
          setupTokenExpiryHandler(tokenExpiry);
        } else {
          console.log('Token expired, clearing session');
          // Token expired, clear storage
          clearAuthData();
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        // No token found, ensure state reflects this
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    checkAuth();
  }, [setupAxiosInterceptor]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!authState.isLoading) {
      console.log('Current path:', location.pathname);
      console.log('Auth state in navigation effect:', authState);
      
      // Redirect to export page if authenticated and on login page
      if (authState.isAuthenticated && location.pathname === '/login') {
        console.log('Redirecting from login to export page due to authenticated state');
        // Add a small delay to ensure state is fully updated before navigation
      }
    }
  }, [location, authState]);

  // Setup token expiry handler
  const setupTokenExpiryHandler = useCallback((tokenExpiry) => {
    // Clear any existing timer
    if (tokenExpiryTimerRef.current) {
      clearTimeout(tokenExpiryTimerRef.current);
    }
    
    const timeToExpiry = new Date(tokenExpiry) - new Date();
    if (timeToExpiry > 0) {
      console.log(`Token expires in ${Math.round(timeToExpiry/1000)} seconds`);
      
      // Set timer to handle token expiry
      tokenExpiryTimerRef.current = setTimeout(() => {
        console.log('Token expired, logging out');
        // Redirect to login when token expires
        if (location.pathname !== '/login') {
          logout();
        }
      }, timeToExpiry);
    }
  }, [location.pathname]);

  // Clear authentication data from session storage
  const clearAuthData = useCallback(() => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('tokenExpiry');
    sessionStorage.removeItem('connectionDetails');
  }, []);

  // Login function
  const login = useCallback(async (connectionDetails) => {
    try {
      console.log('Login called with:', connectionDetails);
      
      // Request JWT token from backend
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${API_URL}/api/auth/login`, connectionDetails);
      
      if (response.data.token) {
        const token = response.data.token;
        // Set token expiry to 30 minutes from now
        const tokenExpiry = new Date(new Date().getTime() + 30 * 60000).toISOString();
        
        // Store in session storage
        sessionStorage.setItem('authToken', token);
        sessionStorage.setItem('tokenExpiry', tokenExpiry);
        sessionStorage.setItem('connectionDetails', JSON.stringify(connectionDetails));
        
        // Setup axios interceptor
        setupAxiosInterceptor(token);
        
        // Update auth state - ensure this is the last operation
        await new Promise(resolve => {
          setAuthState({
            isAuthenticated: true,
            connectionDetails,
            token,
            tokenExpiry,
            isLoading: false
          });
          // Give React time to process the state update
          setTimeout(resolve, 50);
        });
        
        // Setup token expiry handler
        setupTokenExpiryHandler(tokenExpiry);
        
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
  }, [setupAxiosInterceptor, setupTokenExpiryHandler]);

  // Logout function
  const logout = useCallback(() => {
    // Clear any token expiry timer
    if (tokenExpiryTimerRef.current) {
      clearTimeout(tokenExpiryTimerRef.current);
      tokenExpiryTimerRef.current = null;
    }
    
    // Clear session storage
    clearAuthData();
    
    // Reset auth state
    setAuthState({
      isAuthenticated: false,
      connectionDetails: null,
      token: null,
      tokenExpiry: null,
      isLoading: false
    });
  }, [clearAuthData]);

  return (
    <>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Routes>
          <Route path="/login" element={
            authState.isAuthenticated ? 
            <Navigate to="/export" replace /> : 
            <LoginPage login={login} />
          } />
          <Route 
            path="/export" 
            element={
              authState.isAuthenticated ? 
              <ExportPage 
                connectionDetails={authState.connectionDetails}
                logout={logout}
                token={authState.token}
                tokenExpiry={authState.tokenExpiry}
              /> : 
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
    </>
  );
}

export default App;