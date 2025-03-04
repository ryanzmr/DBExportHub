import axios from 'axios';

// Get the API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Simple in-memory cache for API responses
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor for logging and token handling
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage if it exists
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // Server responded with a status code outside of 2xx range
      if (error.response.status === 401) {
        // Unauthorized - clear auth data and redirect to login
        localStorage.removeItem('auth_token');
        // If we have access to router, we could redirect here
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Cache helper functions
const getCachedData = (cacheKey) => {
  if (apiCache.has(cacheKey)) {
    const { data, timestamp } = apiCache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
    // Cache expired, remove it
    apiCache.delete(cacheKey);
  }
  return null;
};

const setCacheData = (cacheKey, data) => {
  apiCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
};

const clearCache = () => {
  apiCache.clear();
};

const generateCacheKey = (endpoint, params) => {
  return `${endpoint}:${JSON.stringify(params)}`;
};

// API service functions
const apiService = {
  // Authentication
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/api/auth/login', credentials);
      // Store token in localStorage for interceptor to use
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error.response?.data || error.message;
    }
  },
  
  // Logout - clear token and cache
  logout: async () => {
    localStorage.removeItem('auth_token');
    clearCache();
    return { success: true };
  },
  
  // Data preview with caching
  previewData: async (params) => {
    try {
      // Generate cache key
      const cacheKey = generateCacheKey('/api/export/preview', params);
      
      // Check cache first
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log('Using cached preview data');
        return cachedData;
      }
      
      // If not in cache, make the API call
      const response = await apiClient.post('/api/export/preview', params);
      
      // Cache the response
      setCacheData(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error('Preview data error:', error);
      throw error.response?.data || error.message;
    }
  },
  
  // Data export
  exportData: async (params) => {
    try {
      // Create an AbortController for cancellation
      const controller = new AbortController();
      const signal = controller.signal;
      
      // For file downloads, we need to set responseType to blob
      const response = await apiClient.post('/api/export', params, {
        responseType: 'blob',
        signal: signal
      });
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from content-disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'export.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=([^;]+)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/"/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url);
      
      return { 
        status: 'success', 
        message: 'Export completed successfully',
        controller: controller // Return controller for cancellation
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { status: 'cancelled', message: 'Export was cancelled' };
      }
      console.error('Export error:', error);
      throw error.response?.data || error.message;
    }
  },
  
  // Cancel export
  cancelExport: (controller) => {
    if (controller) {
      controller.abort();
      return true;
    }
    return false;
  },
  
  // Health check with caching
  healthCheck: async () => {
    try {
      const cacheKey = 'health_check';
      
      // Check cache first with shorter duration for health checks
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      const response = await apiClient.get('/api/health');
      
      // Cache the response
      setCacheData(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error('Health check error:', error);
      throw error.response?.data || error.message;
    }
  },
  
  // Cleanup connection
  cleanupConnection: async (sessionId) => {
    try {
      const response = await apiClient.post('/api/cleanup', { sessionId });
      return response.data;
    } catch (error) {
      console.error('Cleanup error:', error);
      // Don't throw error for cleanup operations
      return { status: 'error', message: error.response?.data || error.message };
    }
  },
  
  // Utility to clear the cache
  clearCache
};

export default apiService;

// Export cache utilities for direct use
export { clearCache, apiClient };