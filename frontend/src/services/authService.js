import apiService from './api';

/**
 * Authentication service for handling login and token management
 */
const authService = {
  /**
   * Login with database credentials
   * @param {Object} credentials - Database connection credentials
   * @param {string} credentials.server - Database server
   * @param {string} credentials.database - Database name
   * @param {string} credentials.username - Database username
   * @param {string} credentials.password - Database password
   * @returns {Promise<Object>} Login response with token
   */
  login: async (credentials) => {
    try {
      // Use the apiService to make the login request
      const response = await apiService.login(credentials);
      return response;
    } catch (error) {
      console.error('Login error in authService:', error);
      throw error;
    }
  },

  /**
   * Store authentication data in session storage
   * @param {string} token - JWT token
   * @param {Object} connectionDetails - Database connection details
   * @param {number} expiryMinutes - Token expiry time in minutes
   */
  storeAuthData: (token, connectionDetails, expiryMinutes = 60) => {
    // Calculate expiry time
    const tokenExpiry = new Date(new Date().getTime() + expiryMinutes * 60000).toISOString();
    
    // Store in session storage
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('tokenExpiry', tokenExpiry);
    sessionStorage.setItem('connectionDetails', JSON.stringify(connectionDetails));
    
    return { token, tokenExpiry };
  },

  /**
   * Clear authentication data from session storage
   */
  clearAuthData: () => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('tokenExpiry');
    sessionStorage.removeItem('connectionDetails');
  },

  /**
   * Check if token is valid
   * @returns {boolean} True if token is valid
   */
  isTokenValid: () => {
    const tokenExpiry = sessionStorage.getItem('tokenExpiry');
    return tokenExpiry && new Date(tokenExpiry) > new Date();
  },

  /**
   * Get stored authentication data
   * @returns {Object} Authentication data
   */
  getAuthData: () => {
    const token = sessionStorage.getItem('authToken');
    const tokenExpiry = sessionStorage.getItem('tokenExpiry');
    const connectionDetails = JSON.parse(sessionStorage.getItem('connectionDetails') || 'null');
    
    return { token, tokenExpiry, connectionDetails };
  }
};

export default authService;