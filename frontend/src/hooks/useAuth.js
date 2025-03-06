import { useState, useCallback } from 'react';
import authService from '../services/authService';

/**
 * Custom hook for authentication functionality
 * @returns {Object} Authentication methods and state
 */
const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionDetails, setConnectionDetails] = useState(null);

  /**
   * Initialize authentication state from session storage
   */
  const initAuth = useCallback(() => {
    const { token, tokenExpiry, connectionDetails } = authService.getAuthData();
    
    if (token && tokenExpiry && connectionDetails) {
      // Check if token is still valid
      if (new Date(tokenExpiry) > new Date()) {
        setIsAuthenticated(true);
        setConnectionDetails(connectionDetails);
        return true;
      } else {
        // Token expired, clear storage
        authService.clearAuthData();
      }
    }
    
    return false;
  }, []);

  /**
   * Login with database credentials
   * @param {Object} credentials - Database connection credentials
   * @returns {Promise<boolean>} Login success status
   */
  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await authService.login(credentials);
      
      if (response && response.token) {
        // Store auth data
        const { token, tokenExpiry } = authService.storeAuthData(response.token, credentials);
        
        // Update state
        setIsAuthenticated(true);
        setConnectionDetails(credentials);
        
        return true;
      } else {
        setError('Invalid response from server');
        return false;
      }
    } catch (err) {
      setError(err.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout and clear authentication data
   */
  const logout = useCallback(() => {
    authService.clearAuthData();
    setIsAuthenticated(false);
    setConnectionDetails(null);
  }, []);

  return {
    loading,
    error,
    isAuthenticated,
    connectionDetails,
    login,
    logout,
    initAuth
  };
};

export default useAuth;