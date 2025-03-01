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

// API service functions
const apiService = {
  // Authentication
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/api/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Data preview
  previewData: async (params) => {
    try {
      const response = await apiClient.post('/api/preview', params);
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