import axios from 'axios';

// Get the API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

<<<<<<< HEAD
// Request interceptor for logging and token handling
apiClient.interceptors.request.use(
  (config) => {
    // Get token from sessionStorage if it exists
    const token = sessionStorage.getItem('authToken');
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
        sessionStorage.removeItem('authToken');
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

=======
>>>>>>> parent of 3449f4b (Implemented_enhancements (#5))
// API service functions
const apiService = {
  // Authentication
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/api/auth/login', credentials);
<<<<<<< HEAD
      // Store token in localStorage for interceptor to use
      if (response.data.token) {
        sessionStorage.setItem('authToken', response.data.token);
      }
=======
>>>>>>> parent of 3449f4b (Implemented_enhancements (#5))
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
<<<<<<< HEAD
  // Logout - clear token and cache
  logout: async () => {
    sessionStorage.removeItem('authToken');
    clearCache();
    return { success: true };
  },
  
  // Data preview with caching
=======
  // Data preview
>>>>>>> parent of 3449f4b (Implemented_enhancements (#5))
  previewData: async (params) => {
    try {
      const response = await apiClient.post('/api/export/preview', params);
      return response.data;
    } catch (error) {
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
      
      return { 
        status: 'success', 
        message: 'Export completed successfully',
        controller: controller // Return controller for cancellation
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { status: 'cancelled', message: 'Export was cancelled' };
      }
      throw error.response?.data || error.message;
    }
  },
  
  // Health check
  healthCheck: async () => {
    try {
      const response = await apiClient.get('/api/health');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default apiService;