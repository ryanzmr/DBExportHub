import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';

// Pages
import LoginPage from './pages/LoginPage';
import ExportPage from './pages/ExportPage';

// Context for managing authentication state
const AuthContext = React.createContext(null);

export const useAuth = () => React.useContext(AuthContext);

function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    connectionDetails: null,
  });
  const location = useLocation();

  // Log navigation for debugging
  useEffect(() => {
    console.log('Current path:', location.pathname);
  }, [location]);

  const login = (connectionDetails) => {
    console.log('Login called with:', connectionDetails);
    setAuthState({
      isAuthenticated: true,
      connectionDetails,
    });
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      connectionDetails: null,
    });
  };

  console.log('Auth state:', authState);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/export" 
            element={
              authState.isAuthenticated ? 
              <ExportPage /> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Box>
    </AuthContext.Provider>
  );
}

export default App;