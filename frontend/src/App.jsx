import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container, Box } from '@mui/material';

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

  const login = (connectionDetails) => {
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

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
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
          </Routes>
        </Box>
      </Container>
    </AuthContext.Provider>
  );
}

export default App;