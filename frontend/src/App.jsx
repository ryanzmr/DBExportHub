<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
=======
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
>>>>>>> parent of 3449f4b (Implemented_enhancements (#5))
import { Box, CssBaseline } from '@mui/material';
import axios from 'axios';

// Pages
import LoginPage from './pages/LoginPage';
import ExportPage from './pages/ExportPage';

<<<<<<< HEAD
// App component with routes protected by authentication
=======
// Context for managing authentication state
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

>>>>>>> parent of 3449f4b (Implemented_enhancements (#5))
function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    connectionDetails: null,
    token: null,
    tokenExpiry: null
  });
  const location = useLocation();
<<<<<<< HEAD
  
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
=======
  const navigate = useNavigate();

  // Check for token on initial load and set up refresh timer
>>>>>>> parent of 3449f4b (Implemented_enhancements (#5))
  useEffect(() => {
    const checkAuth = () => {
      const token = sessionStorage.getItem('authToken');
      const tokenExpiry = sessionStorage.getItem('tokenExpiry');
      const connectionDetails = JSON.parse(sessionStorage.getItem('connectionDetails') || 'null');
      
      if (token && tokenExpiry && connectionDetails) {
        // Check if token is still valid
        if (new Date(tokenExpiry) > new Date()) {
          console.log('Found valid token, restoring session');
          
<<<<<<< HEAD
          // Setup axios interceptor
          setupAxiosInterceptor(token);
          
          // Update auth state
=======
          // Set up axios interceptor for adding token to requests
          axios.interceptors.request.use(
            config => {
              config.headers['Authorization'] = `Bearer ${token}`;
              return config;
            },
            error => Promise.reject(error)
          );
          
>>>>>>> parent of 3449f4b (Implemented_enhancements (#5))
          setAuthState({
            isAuthenticated: true,
            connectionDetails,
            token,
<<<<<<< HEAD
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
=======
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
>>>>>>> parent of 3449f4b (Implemented_enhancements (#5))
      }
    };
    
    checkAuth();
<<<<<<< HEAD
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
=======
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
>>>>>>> parent of 3449f4b (Implemented_enhancements (#5))
    try {
      console.log('Login called with:', connectionDetails);
      
      // Request JWT token from backend
<<<<<<< HEAD
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${API_URL}/api/auth/login`, connectionDetails);
      
      if (response.data.token) {
        const token = response.data.token;
        // Set token expiry to 30 minutes from now
=======
      const response = await axios.post('http://localhost:8000/api/auth/login', connectionDetails);
      
      if (response.data.token) {
        const token = response.data.token;
        // Set token expiry to 30 minutes from now instead of 5 minutes
>>>>>>> parent of 3449f4b (Implemented_enhancements (#5))
        const tokenExpiry = new Date(new Date().getTime() + 30 * 60000).toISOString();
        
        // Store in session storage
        sessionStorage.setItem('authToken', token);
        sessionStorage.setItem('tokenExpiry', tokenExpiry);
        sessionStorage.setItem('connectionDetails', JSON.stringify(connectionDetails));
        
<<<<<<< HEAD
        // Setup axios interceptor
        setupAxiosInterceptor(token);
=======
        // Set up axios interceptor for adding token to requests
        axios.interceptors.request.use(
          config => {
            config.headers['Authorization'] = `Bearer ${token}`;
            return config;
          },
          error => Promise.reject(error)
        );
>>>>>>> parent of 3449f4b (Implemented_enhancements (#5))
        
        // Update auth state - ensure this is the last operation
        await new Promise(resolve => {
          setAuthState({
            isAuthenticated: true,
            connectionDetails,
            token,
<<<<<<< HEAD
            tokenExpiry,
            isLoading: false
=======
            tokenExpiry
>>>>>>> parent of 3449f4b (Implemented_enhancements (#5))
          });
          // Give React time to process the state update
          setTimeout(resolve, 50);
        });
        
<<<<<<< HEAD
        // Setup token expiry handler
        setupTokenExpiryHandler(tokenExpiry);
        
=======
>>>>>>> parent of 3449f4b (Implemented_enhancements (#5))
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
<<<<<<< HEAD
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
=======
  };
  const logout = () => {
    // Clear session storage
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('tokenExpiry');
    sessionStorage.removeItem('connectionDetails');
    
>>>>>>> parent of 3449f4b (Implemented_enhancements (#5))
    setAuthState({
      isAuthenticated: false,
      connectionDetails: null,
      token: null,
<<<<<<< HEAD
      tokenExpiry: null,
      isLoading: false
    });
  }, [clearAuthData]);
=======
      tokenExpiry: null
    });
  };

  console.log('Auth state:', authState);
>>>>>>> parent of 3449f4b (Implemented_enhancements (#5))

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
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
<<<<<<< HEAD
              <ExportPage 
                connectionDetails={authState.connectionDetails}
                logout={logout}
                token={authState.token}
                tokenExpiry={authState.tokenExpiry}
              /> : 
=======
              <ExportPage /> : 
>>>>>>> parent of 3449f4b (Implemented_enhancements (#5))
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