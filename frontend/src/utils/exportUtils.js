// exportUtils.js - Contains API calls and helper functions for the export functionality

import axios from 'axios';

/**
 * Fetches preview data based on the provided parameters
 * @param {Object} connectionDetails - Database connection details
 * @param {Object} formData - Form data with export parameters
 * @param {AbortSignal} signal - AbortController signal for cancellation
 * @returns {Promise} - Promise with preview data
 */
export const fetchPreviewData = async (connectionDetails, signal) => {
  try {
    const requestData = {
      ...connectionDetails,
      preview_only: true,
      fromMonth: parseInt(connectionDetails.fromMonth),
      toMonth: parseInt(connectionDetails.toMonth)
    };
    
    console.log('Preview request data:', requestData);
    
    // Get API URL from environment or use default
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    // Get token from sessionStorage
    const token = sessionStorage.getItem('authToken');
    
    // Include token in the request headers if available
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.post(`${API_URL}/api/export/preview`, requestData, {
      headers,
      signal: signal
    });
    
    // Validate response data format
    if (response.data && Array.isArray(response.data.data)) {
      return {
        data: response.data.data,
        count: response.data.count || response.data.data.length,
        error: null
      };
    } else {
      console.error('Invalid preview data format:', response.data);
      return {
        data: [],
        count: 0,
        error: 'Invalid data format received from server'
      };
    }
  } catch (err) {
    console.error('Preview error:', err);
    let errorMessage = 'Error generating preview';
    
    if (err.name === 'AbortError' || err.name === 'CanceledError' || axios.isCancel(err)) {
      errorMessage = 'Process canceled';
    } else if (err.response?.status === 401) {
      errorMessage = 'Authentication failed';
    } else if (typeof err.response?.data?.detail === 'string') {
      errorMessage = err.response.data.detail;
    }
    
    return {
      data: [],
      count: 0,
      error: errorMessage,
      authError: err.response?.status === 401
    };
  }
};

/**
 * Exports data based on the provided parameters
 * @param {Object} connectionDetails - Database connection details
 * @param {Object} formData - Form data with export parameters
 * @param {AbortSignal} signal - AbortController signal for cancellation
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise} - Promise with export result
 */
export const exportData = async (connectionDetails, signal, onProgress) => {
  try {
    // Create progress indicator
    const progressIndicator = document.createElement('div');
    progressIndicator.style.position = 'fixed';
    progressIndicator.style.top = '50%';
    progressIndicator.style.left = '50%';
    progressIndicator.style.transform = 'translate(-50%, -50%)';
    progressIndicator.style.padding = '20px';
    progressIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    progressIndicator.style.color = 'white';
    progressIndicator.style.borderRadius = '5px';
    progressIndicator.style.zIndex = '9999';
    progressIndicator.textContent = 'Preparing export...';
    document.body.appendChild(progressIndicator);
    
    // Request data with pagination or chunking hint
    const requestData = {
      ...connectionDetails,
      ...formData,
      preview_only: false,
      fromMonth: parseInt(formData.fromMonth),
      toMonth: parseInt(formData.toMonth),
      useChunking: true,
      chunkSize: 5000,
      // Add cleanup flag
      cleanupConnection: true,
      sessionTimeout: 300, // 5 minutes in seconds
      excelFormat: {
        font: {
          name: "Times New Roman",
          size: 10,
          bold: false
        },
        headerStyle: {
          font: {
            name: "Times New Roman",
            size: 10,
            bold: true,
            color: "#FFFFFF"
          },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: "#4472C4"  // Blue header background from template
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true
          },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
          }
        },
        columnWidths: {
          autoFit: true,
          minWidth: 10
        }
      }
    };
    
    const response = await axios.post('http://localhost:8000/api/export', requestData, {
      responseType: 'blob',
      signal: signal,
      timeout: 300000, // 5 minute timeout
      onDownloadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || progressEvent.loaded + 1000000));
        progressIndicator.textContent = `Downloading: ${percentCompleted}%`;
        if (onProgress) onProgress(percentCompleted);
      }
    });
    
    // Remove progress indicator
    document.body.removeChild(progressIndicator);
    
    return { response, progressIndicator };
  } catch (err) {
    console.error('Export error:', err);
    let errorMessage = 'Error exporting data. The dataset might be too large.';
    
    if (err.name === 'AbortError' || err.name === 'CanceledError' || axios.isCancel(err)) {
      errorMessage = 'Process canceled';
    } else if (err.code === 'ECONNABORTED') {
      errorMessage = 'Export timed out. Try narrowing your search criteria for a smaller dataset.';
    } else if (err.response?.data?.detail) {
      errorMessage = err.response.data.detail;
    }
    
    // Remove progress indicator if it still exists
    const progressIndicator = document.querySelector('div[style*="position: fixed"][style*="top: 50%"]');
    if (progressIndicator) {
      document.body.removeChild(progressIndicator);
    }
    
    return { error: errorMessage };
  }
};

/**
 * Handles the download of exported data
 * @param {Blob} data - The blob data to download
 * @param {Object} headers - Response headers
 * @param {Object} formData - Form data with export parameters
 * @returns {void}
 */
export const handleDownload = (data, headers, formData) => {
  // Create a download link
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  
  // Get filename from content-disposition header or use default
  const contentDisposition = headers['content-disposition'];
  let filename = `export_${formData.fromMonth}_to_${formData.toMonth}.xlsx`;
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="([^"]+)"/i);
    if (filenameMatch && filenameMatch.length === 2) {
      filename = filenameMatch[1];
    }
  }
  
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  window.URL.revokeObjectURL(url);
  document.body.removeChild(link);
};

/**
 * Cleans up the database connection
 * @param {Object} connectionDetails - Database connection details
 * @returns {Promise} - Promise with cleanup result
 */
export const cleanupConnection = async (connectionDetails) => {
  try {
    await axios.post('http://localhost:8000/api/cleanup', {
      ...connectionDetails,
      sessionId: connectionDetails.sessionId || Date.now().toString()
    });
    return { success: true };
  } catch (err) {
    console.error('Cleanup error:', err);
    return { success: false, error: err };
  }
};

/**
 * Creates a fresh form state with current year values
 * @param {Object} initialState - The initial form state
 * @returns {Object} - Fresh form state with current year values
 */
export const createFreshFormState = (initialState) => {
  const currentYear = new Date().getFullYear();
  return {
    ...initialState,
    fromMonth: currentYear * 100 + 1,  // January of current year (YYYYMM format)
    toMonth: currentYear * 100 + 12    // December of current year (YYYYMM format)
  };
};