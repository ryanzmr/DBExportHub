import axios from 'axios';

// Get the API URL from environment variables or detect based on client location
const detectApiUrl = () => {
  // Use environment variable if available (highest priority)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Check if we're on localhost
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
  
  // If we're on localhost, use localhost backend
  if (isLocalhost) {
    return 'http://localhost:8000';
  }
  
  // If we're accessing from a specific IP, use that same IP for backend
  // This assumes frontend and backend are on same machine
  return `http://${window.location.hostname}:8000`;
};

const API_URL = detectApiUrl();
console.log('Using API URL:', API_URL);

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service functions
const apiService = {
  // Authentication
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/api/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error.response?.data || error.message;
    }
  },
  
  // Data preview
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
  
  // Import Data preview
  previewImportData: async (params) => {
    try {
      const response = await apiClient.post('/api/import/preview', params);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Data import
  importData: async (params) => {
    try {
      // Create an AbortController for cancellation
      const controller = new AbortController();
      const signal = controller.signal;
      
      // For file downloads, we need to set responseType to blob
      const response = await apiClient.post('/api/import/excel', params, {
        responseType: 'blob',
        signal: signal
      });
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from content-disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'import.xlsx';
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
        message: 'Import completed successfully',
        controller: controller // Return controller for cancellation
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { status: 'cancelled', message: 'Import was cancelled' };
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