import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';

// Pages
import LoginPage from './pages/LoginPage';
import ExportPage from './pages/ExportPage';

// Import AuthProvider and useAuth hook
import { AuthProvider, useAuth } from './contexts/AuthContext';

// App component with routes protected by authentication
function App() {
  const location = useLocation();
  // The authentication state is now managed by the AuthProvider
  // We just need to use the useAuth hook to access it

  // Wrap the entire app with the AuthProvider
  return (
    <AuthProvider>
      <AppContent location={location} />
    </AuthProvider>
  );
}

// Separate component for the app content to use the auth context
function AppContent({ location }) {
  const { isAuthenticated } = useAuth();
  
  return (
    <>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? 
            <Navigate to="/export" replace /> : 
            <LoginPage />
          } />
          <Route 
            path="/export" 
            element={
              isAuthenticated ? 
              <ExportPage /> : 
              <Navigate to="/login" replace state={{ from: location }} />
            } 
          />
          <Route path="/" element={
            isAuthenticated ? 
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