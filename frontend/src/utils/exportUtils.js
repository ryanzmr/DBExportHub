// exportUtils.js
// Contains utility functions and API calls for the ExportPage component

import axios from 'axios';
import { showToast } from './toastUtils';

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
 * @param {boolean} [forceContinue=false] - Whether to continue despite Excel limit
 * @returns {Promise} - Promise that resolves when the export is complete
 */
export const generateExcelExport = async (connectionDetails, formData, signal, forceContinue = false) => {
  try {
    // Add an enhanced progress indicator with more detailed information
    const progressIndicator = document.createElement('div');
    progressIndicator.style.position = 'fixed';
    progressIndicator.style.top = '50%';
    progressIndicator.style.left = '50%';
    progressIndicator.style.transform = 'translate(-50%, -50%)';
    progressIndicator.style.padding = '20px';
    progressIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    progressIndicator.style.color = 'white';
    progressIndicator.style.borderRadius = '8px';
    progressIndicator.style.zIndex = '9999';
    progressIndicator.style.minWidth = '300px';
    progressIndicator.style.textAlign = 'center';
    progressIndicator.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    
    // Create a container for the progress information
    const progressContent = document.createElement('div');
    progressContent.innerHTML = `
      <div style="margin-bottom: 15px; font-weight: bold;">Preparing Large Dataset Export</div>
      <div id="export-status">Initializing export process...</div>
      <div style="margin-top: 15px; height: 20px; background-color: rgba(255, 255, 255, 0.2); border-radius: 10px; overflow: hidden;">
        <div id="export-progress-bar" style="height: 100%; width: 0%; background-color: #4CAF50; transition: width 0.3s;"></div>
      </div>
      <div id="export-percentage" style="margin-top: 5px;">0%</div>
      <div id="export-details" style="margin-top: 10px; font-size: 0.8em;">Starting export...</div>
    `;
    
    progressIndicator.appendChild(progressContent);
    document.body.appendChild(progressIndicator);
    
    // Update status to inform user this might take time for large datasets
    setTimeout(() => {
      const statusElement = progressIndicator.querySelector('#export-status');
      if (statusElement && statusElement.textContent === 'Initializing export process...') {
        statusElement.textContent = 'Processing large dataset. This may take several minutes...';
      }
    }, 5000);
    
    // Request data with pagination or chunking hint
    const requestData = {
      ...connectionDetails,
      ...formData,
      preview_only: false,
      fromMonth: parseInt(formData.fromMonth),
      toMonth: parseInt(formData.toMonth),
      useChunking: true,
      chunkSize: 10000, // Increased chunk size for better performance
      useStreaming: true, // Enable streaming for large datasets
      // Add force continue flag
      force_continue_despite_limit: forceContinue,
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
    
    // Function to update the progress UI
    const updateProgressUI = (percentage, status, details) => {
      const progressBar = progressIndicator.querySelector('#export-progress-bar');
      const percentageText = progressIndicator.querySelector('#export-percentage');
      const statusElement = progressIndicator.querySelector('#export-status');
      const detailsElement = progressIndicator.querySelector('#export-details');
      
      if (progressBar) progressBar.style.width = `${percentage}%`;
      if (percentageText) percentageText.textContent = `${percentage}%`;
      if (statusElement && status) statusElement.textContent = status;
      if (detailsElement && details) detailsElement.textContent = details;
    };
    
    // Setup for progress polling
    let operationId = null;
    let progressInterval = null;
    let isGeneratingExcel = true;
    
    // Make the request
    const response = await axios.post('http://localhost:8000/api/export', requestData, {
      responseType: 'blob',
      signal: signal,
      timeout: 3600000, // 60 minute timeout for large datasets
      maxContentLength: Infinity, // Remove content length limit
      maxBodyLength: Infinity, // Remove body length limit
      headers: {
        'X-Client-Request-ID': `export-${Date.now()}`
      }
    }).then(response => {
      // Check if the response is a JSON object (which would indicate an error or special message)
      // We need to check this because we expect a blob for successful downloads
      const contentType = response.headers['content-type'];
      
      if (contentType && contentType.includes('application/json')) {
        // It's a JSON response, so convert blob to JSON
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const jsonResponse = JSON.parse(reader.result);
              resolve({
                data: jsonResponse,
                headers: response.headers,
                isJson: true
              });
            } catch (e) {
              resolve(response); // Fallback to the original response
            }
          };
          reader.readAsText(response.data);
        });
      }
      
      // Extract operation ID from response headers if available
      operationId = response.headers['x-operation-id'];
      console.log('Export operation ID:', operationId);
      
      // Start progress polling if we have an operation ID
      if (operationId) {
        progressInterval = setInterval(async () => {
          if (!isGeneratingExcel) {
            clearInterval(progressInterval);
            return;
          }
          
          try {
            const progressResponse = await axios.get(`http://localhost:8000/api/progress/${operationId}`);
            const { progress, status } = progressResponse.data;
            
            if (status === 'completed') {
              // Excel file is ready, waiting for download to start
              isGeneratingExcel = false;
              clearInterval(progressInterval);
              updateProgressUI(
                100, 
                'Excel file generated, preparing download...', 
                `Processed ${progress.total} records successfully!`
              );
            } else {
              // Update progress during generation
              updateProgressUI(
                progress.percentage,
                'Generating Excel file...',
                `Processed ${progress.current} of ${progress.total} records (${progress.percentage}%)`
              );
            }
          } catch (err) {
            console.error('Error fetching progress:', err);
          }
        }, 1000); // Poll every second
      }
      
      return response;
    }).catch(error => {
      throw error;
    }).finally(() => {
      // Clean up progress indicator after response is received
      setTimeout(() => {
        if (document.body.contains(progressIndicator)) {
          document.body.removeChild(progressIndicator);
        }
      }, 1000); // Allow time for the user to see the final state
      
      // Clear the progress interval if it's still running
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    });
    
    // Check if we received a JSON response indicating a limit exceeded status
    if (response.isJson && response.data && response.data.status === 'limit_exceeded') {
      // Return the limit_exceeded data for the component to handle
      return {
        status: 'limit_exceeded',
        message: response.data.message,
        operation_id: response.data.operation_id,
        total_records: response.data.total_records,
        limit: response.data.limit
      };
    }
    
    return response;
  } catch (err) {
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
  try {
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
      // Show a non-blocking toast notification
    showToast('Export Excel file download started successfully!', {
      type: 'success',
      duration: 3000
    });
    
    // Clean up any progress indicators immediately
    const progressIndicator = document.getElementById('export-progress-indicator');
    if (progressIndicator && document.body.contains(progressIndicator)) {
      document.body.removeChild(progressIndicator);
    }
  } catch (error) {
    console.error('Error handling Excel download:', error);
  }
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
 * Get a fresh form state with empty month values
 * @returns {Object} - Fresh form state with empty month values
 */
export const getFreshFormState = () => {
  return {
    ...getInitialFormState(),
    fromMonth: "",  // Empty string instead of default month
    toMonth: ""     // Empty string instead of default month
  };
};

/**
 * Cancel an ongoing export operation
 * @param {string} operationId - The ID of the operation to cancel
 * @returns {Promise} - Promise that resolves when the cancellation is complete
 */
export const cancelExportOperation = async (operationId) => {
  try {
    const response = await axios.post('http://localhost:8000/api/exports/cancel-export', {
      operation_id: operationId
    });
    return response.data;
  } catch (err) {
    console.error('Cancel export error:', err);
    throw err;
  }
};