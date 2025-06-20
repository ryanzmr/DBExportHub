// importUtils.js
// Contains utility functions and API calls for the ImportPage component

import axios from 'axios';
import { showToast } from './toastUtils';

/**
 * Generate a preview of the import data based on the provided parameters
 * @param {Object} connectionDetails - Database connection details
 * @param {Object} formData - Form data containing import parameters
 * @param {AbortSignal} signal - AbortSignal for cancellation
 * @returns {Promise} - Promise that resolves to the preview data
 */
export const fetchImportPreviewData = async (connectionDetails, formData, signal) => {
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
    console.log('Import preview request data:', sanitizedData);
    
    const response = await axios.post('http://localhost:8000/api/import/preview', requestData, {
      signal: signal,
      timeout: 600000 // 10 minute timeout
    });
    
    return response.data;
  } catch (err) {
    console.error('Import preview error:', err);
    throw err;
  }
};

/**
 * Generate and download an Excel import based on the provided parameters
 * @param {Object} connectionDetails - Database connection details
 * @param {Object} formData - Form data containing import parameters
 * @param {AbortSignal} signal - AbortSignal for cancellation
 * @param {boolean} [forceContinue=false] - Whether to continue despite Excel limit
 * @returns {Promise} - Promise that resolves when the import is complete
 */
export const generateImportExcel = async (connectionDetails, formData, signal, forceContinue = false) => {
  try {
    // Add an enhanced progress indicator with more detailed information
    const progressIndicator = document.createElement('div');
    progressIndicator.id = 'import-progress-indicator';
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
      <div style="margin-bottom: 15px; font-weight: bold;">Preparing Import Excel</div>
      <div id="export-status">Initializing import process...</div>
      <div style="margin-top: 15px; height: 20px; background-color: rgba(255, 255, 255, 0.2); border-radius: 10px; overflow: hidden;">
        <div id="export-progress-bar" style="height: 100%; width: 0%; background-color: #4CAF50; transition: width 0.3s;"></div>
      </div>
      <div id="export-percentage" style="margin-top: 5px;">0%</div>
      <div id="export-details" style="margin-top: 10px; font-size: 0.8em;">Starting import...</div>
    `;
    
    progressIndicator.appendChild(progressContent);
    document.body.appendChild(progressIndicator);
    
    // Update status to inform user this might take time for large datasets
    setTimeout(() => {
      const statusElement = progressIndicator.querySelector('#export-status');
      if (statusElement && statusElement.textContent === 'Initializing import process...') {
        statusElement.textContent = 'Processing large dataset. This may take several minutes...';
      }
    }, 5000);
    
    // Function to update the progress UI
    const updateProgressUI = (percentage, status, details) => {
      const progressBar = document.getElementById('export-progress-bar');
      const percentageText = document.getElementById('export-percentage');
      const statusElement = document.getElementById('export-status');
      const detailsElement = document.getElementById('export-details');
      
      if (progressBar && percentageText && statusElement && detailsElement) {
        progressBar.style.width = `${percentage}%`;
        percentageText.textContent = `${percentage}%`;
        statusElement.textContent = status;
        detailsElement.textContent = details;
      }
    };
    
    // Request data with pagination or chunking hint
    const requestData = {
      ...connectionDetails,
      ...formData,
      preview_only: false,
      fromMonth: parseInt(formData.fromMonth),
      toMonth: parseInt(formData.toMonth),
      force_continue_despite_limit: forceContinue
    };
    
    // Create a sanitized copy for logging (mask password)
    const sanitizedData = { ...requestData, password: '[REDACTED]' };
    console.log('Import request data:', sanitizedData);
    
    let progressInterval = null;
    
    // Make the request to generate the Excel file
    const response = await axios.post('http://localhost:8000/api/import/excel', requestData, {
      responseType: 'arraybuffer',
      signal: signal,
      timeout: 7200000, // 120 minute timeout
      headers: {
        'X-Client-Request-ID': `import-${Date.now()}`
      },
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          updateProgressUI(
            percentage, 
            'Downloading Excel file...', 
            `${Math.round(progressEvent.loaded / 1024 / 1024)} MB of ${Math.round(progressEvent.total / 1024 / 1024)} MB`
          );
        }
      }
    }).then(response => {
      // Get operation ID from headers if available
      const operationId = response.headers['x-operation-id'];
      if (operationId) {
        console.log(`Operation ID: ${operationId}`);
        
        // Check content type to see if we got a JSON response (might be limit exceeded message)
        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('application/json')) {
          // Convert ArrayBuffer to text
          const decoder = new TextDecoder('utf-8');
          const jsonText = decoder.decode(response.data);
          try {
            const jsonData = JSON.parse(jsonText);
            
            // Mark this response as being JSON data
            response.isJson = true;
            response.data = jsonData;
            
            // If it's a limit exceeded message, update the UI
            if (jsonData.status === 'limit_exceeded') {
              updateProgressUI(
                100, 
                'Warning: Excel Row Limit Exceeded', 
                `Total records (${jsonData.total_records.toLocaleString()}) exceed Excel limit (${jsonData.limit.toLocaleString()}).`
              );
            }
          } catch (e) {
            console.error('Failed to parse JSON response:', e);
          }
        } else {
          // Start polling for progress if we got a binary response
          progressInterval = setInterval(async () => {
            try {
              // Check for progress updates
              const progressResponse = await axios.get(`http://localhost:8000/api/operation/${operationId}/progress`);
              const progress = progressResponse.data;
              
              if (progress.status === 'completed') {
                // Operation is complete, show completion message
                clearInterval(progressInterval);
                progressInterval = null;
                
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
    console.error('Import error:', err);
    throw err;
  }
};

/**
 * Handle the download of the imported Excel file
 * @param {Object} response - Axios response containing the blob data
 * @param {Object} formData - Form data containing import parameters
 */
export const handleExcelDownload = (response, formData) => {
  try {
    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Get filename from content-disposition header or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = `import_${formData.fromMonth}_to_${formData.toMonth}.xlsx`;
    
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
    showToast('Import Excel file download started successfully!', {
      type: 'success',
      duration: 3000
    });
    
    // Clean up any progress indicators immediately
    const progressIndicator = document.getElementById('import-progress-indicator');
    if (progressIndicator && document.body.contains(progressIndicator)) {
      document.body.removeChild(progressIndicator);
    }
  } catch (error) {
    console.error('Error handling Excel download:', error);
  }
};

/**
 * Clean up database connection after import
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
 * Get a fresh form state object with default values
 * @returns {Object} Fresh form state
 */
export const getFreshImportFormState = () => ({
  fromMonth: '',
  toMonth: '',
  hs: '',
  prod: '',
  impCmp: '',
  iec: '',
  forcount: '',
  forname: '',
  port: '',
  shipper: ''
});

/**
 * Cancel an ongoing import operation
 * @param {string} operationId - The ID of the operation to cancel
 * @returns {Promise} - Promise that resolves when the cancellation is complete
 */
export const cancelImportOperation = async (operationId) => {
  try {
    const response = await axios.post('http://localhost:8000/api/imports/cancel-import', {
      operation_id: operationId
    });
    return response.data;
  } catch (err) {
    console.error('Cancel import error:', err);
    throw err;
  }
};
