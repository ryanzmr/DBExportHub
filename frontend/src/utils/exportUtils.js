// exportUtils.js
// Contains utility functions and API calls for the ExportPage component

import axios from 'axios';

/**
 * Generate a preview of the export data based on the provided parameters
 * @param {Object} connectionDetails - Database connection details
 * @param {Object} formData - Form data containing export parameters
 * @param {AbortSignal} signal - AbortSignal for cancellation
 * @returns {Promise} - Promise that resolves to the preview data
 */
export const fetchPreviewData = async (connectionDetails, formData, signal) => {
  try {
    const requestData = {
      ...connectionDetails,
      ...formData,
      preview_only: true,
      fromMonth: parseInt(formData.fromMonth),
      toMonth: parseInt(formData.toMonth)
    };
    
    // Create a sanitized copy for logging (mask password)
    const sanitizedData = { ...requestData, password: '[REDACTED]' };
    console.log('Preview request data:', sanitizedData);
    
    const response = await axios.post('http://localhost:8000/api/export/preview', requestData, {
      signal: signal
    });
    
    return response.data;
  } catch (err) {
    console.error('Preview error:', err);
    throw err;
  }
};

/**
 * Generate and download an Excel export based on the provided parameters
 * @param {Object} connectionDetails - Database connection details
 * @param {Object} formData - Form data containing export parameters
 * @param {AbortSignal} signal - AbortSignal for cancellation
 * @returns {Promise} - Promise that resolves when the export is complete
 */
export const generateExcelExport = async (connectionDetails, formData, signal) => {
  try {
    // Add a progress indicator
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
    
    // Create a sanitized copy for logging (mask password)
    const sanitizedData = { ...requestData, password: '[REDACTED]' };
    console.log('Export request data:', sanitizedData);
    
    const response = await axios.post('http://localhost:8000/api/export', requestData, {
      responseType: 'blob',
      signal: signal,
      timeout: 300000, // 5 minute timeout
      onDownloadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || progressEvent.loaded + 1000000));
        progressIndicator.textContent = `Downloading: ${percentCompleted}%`;
      }
    });
    
    // Remove progress indicator
    document.body.removeChild(progressIndicator);
    
    return response;
  } catch (err) {
    // Remove progress indicator if it still exists
    const progressIndicator = document.querySelector('div[style*="position: fixed"][style*="top: 50%"]');
    if (progressIndicator) {
      document.body.removeChild(progressIndicator);
    }
    
    console.error('Export error:', err);
    throw err;
  }
};

/**
 * Handle the download of the exported Excel file
 * @param {Object} response - Axios response containing the blob data
 * @param {Object} formData - Form data containing export parameters
 */
export const handleExcelDownload = (response, formData) => {
  // Create a download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  
  // Get filename from content-disposition header or use default
  const contentDisposition = response.headers['content-disposition'];
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
 * Clean up database connection after export
 * @param {Object} connectionDetails - Database connection details
 */
export const cleanupConnection = async (connectionDetails) => {
  try {
    await axios.post('http://localhost:8000/api/cleanup', {
      ...connectionDetails,
      sessionId: connectionDetails.sessionId || Date.now().toString()
    });
  } catch (err) {
    console.error('Cleanup error:', err);
  }
};

/**
 * Get the initial form state with default values
 * @returns {Object} - Initial form state
 */
export const getInitialFormState = () => {
  return {
    fromMonth: null,
    toMonth: null,
    hs: '',
    prod: '',
    iec: '',
    expCmp: '',
    forcount: '',
    forname: '',
    port: '',
    preview_only: true,
    max_records: 100
  };
};

/**
 * Get a fresh form state with current year values
 * @returns {Object} - Fresh form state with current year values
 */
export const getFreshFormState = () => {
  const currentYear = new Date().getFullYear();
  return {
    ...getInitialFormState(),
    fromMonth: currentYear * 100 + 1,  // January of current year (YYYYMM format)
    toMonth: currentYear * 100 + 12    // December of current year (YYYYMM format)
  };
};