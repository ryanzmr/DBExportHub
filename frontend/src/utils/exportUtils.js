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
    
    // Check for specific database errors
    if (err.response && err.response.data) {
      const errorMessage = err.response.data.detail || '';
      
      // Handle transaction log full error
      if (errorMessage.includes('transaction log') && errorMessage.includes('full')) {
        throw new Error(
          'Database Error: The SQL Server transaction log is full. Please contact your database administrator to backup or truncate the log file.'
        );
      }
      
      // Handle other database errors with better messages
      if (errorMessage.includes('Database')) {
        throw new Error(`Database Error: ${errorMessage}`);
      }
    }
    
    // For network errors
    if (err.message === 'Network Error') {
      throw new Error('Unable to connect to the server. Please check your internet connection or try again later.');
    }
    
    // For timeout errors
    if (err.code === 'ECONNABORTED') {
      throw new Error('The request timed out. The database query may be too complex or the server is under heavy load.');
    }
    
    // For aborted requests (user cancelled)
    if (err.name === 'AbortError' || err.name === 'CanceledError') {
      throw new Error('Operation cancelled by user.');
    }
    
    // Generic error fallback
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
      // Check if the response is a JSON response indicating Excel row limit exceeded
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        // This is a JSON response, not a blob
        // Convert the blob to JSON
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const jsonResponse = JSON.parse(reader.result);
            resolve({ data: jsonResponse, headers: response.headers, isJson: true });
          };
          reader.readAsText(response.data);
        });
      }
      
      // Regular blob response (Excel file)
      return { data: response.data, headers: response.headers, isJson: false };
    });
    
    // Check if we got a JSON response for Excel row limit exceeded
    if (response.isJson && response.data.excel_limit_exceeded) {
      // Remove progress indicator
      document.body.removeChild(progressIndicator);
      
      // Show a confirmation dialog to the user
      const result = await showExcelLimitExceededDialog(
        response.data.message,
        response.data.total_rows,
        response.data.max_rows
      );
      
      if (result.proceed) {
        // User chose to proceed with partial export
        // Call the continue endpoint with the user's choice
        return await continueExcelExport({
          ...connectionDetails,
          ...formData,
          operation_id: response.data.operation_id,
          proceed: true,
          total_rows: response.data.total_rows
        }, signal);
      } else {
        // User chose to cancel the export
        return {
          status: 'cancelled',
          message: `Export cancelled. The data contains ${response.data.total_rows.toLocaleString()} rows which exceeds Excel's limit of ${response.data.max_rows.toLocaleString()} rows.`
        };
      }
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
        } catch (error) {
          console.error('Error polling progress:', error);
        }
      }, 1000); // Poll every second
    }
    
    // Handle the download progress once the file starts downloading
    const fileReader = new FileReader();
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Set up progress tracking for the file reading
    fileReader.onprogress = (event) => {
      if (isGeneratingExcel) {
        // Now we're in download phase
        isGeneratingExcel = false;
        clearInterval(progressInterval);
      }
      
      const percentCompleted = Math.round((event.loaded * 100) / (event.total || event.loaded + 1000000));
      updateProgressUI(
        percentCompleted,
        'Downloading Excel file...',
        `Downloaded ${Math.round(event.loaded / (1024 * 1024))} MB / ${Math.round((event.total || event.loaded + 1000000) / (1024 * 1024))} MB`
      );
    };
    
    fileReader.onloadend = () => {
      // Clean up the intervals when download is complete
      if (progressInterval) clearInterval(progressInterval);
      
      // Remove progress indicator
      document.body.removeChild(progressIndicator);
    };
    
    // Start reading to initiate the progress events
    fileReader.readAsArrayBuffer(blob);
    
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
 * Shows a dialog to the user when Excel row limit is exceeded
 * 
 * @param {string} message - The message to display to the user
 * @param {number} totalRows - Total number of rows in the dataset
 * @param {number} maxRows - Maximum number of rows Excel can handle
 * @returns {Promise<{proceed: boolean}>} - User's choice
 */
export const showExcelLimitExceededDialog = async (message, totalRows, maxRows) => {
  return new Promise((resolve) => {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '10000';
    
    // Create modal content
    const modal = document.createElement('div');
    modal.style.backgroundColor = 'white';
    modal.style.padding = '25px';
    modal.style.borderRadius = '8px';
    modal.style.width = '500px';
    modal.style.maxWidth = '90%';
    modal.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    
    // Create warning icon
    const icon = document.createElement('div');
    icon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12" y2="16"></line>
      </svg>
    `;
    icon.style.textAlign = 'center';
    icon.style.marginBottom = '15px';
    
    // Create title
    const title = document.createElement('h2');
    title.textContent = 'Excel Row Limit Exceeded';
    title.style.margin = '0 0 15px 0';
    title.style.textAlign = 'center';
    title.style.color = '#e74c3c';
    
    // Create message
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.marginBottom = '20px';
    messageEl.style.lineHeight = '1.5';
    
    // Create warning about data loss
    const warning = document.createElement('p');
    warning.innerHTML = `<strong>Warning:</strong> If you proceed, only the first ${maxRows.toLocaleString()} rows will be exported, and ${(totalRows - maxRows).toLocaleString()} rows will be omitted.`;
    warning.style.marginBottom = '20px';
    warning.style.padding = '10px';
    warning.style.backgroundColor = '#fef5f5';
    warning.style.border = '1px solid #fadbd8';
    warning.style.borderRadius = '4px';
    warning.style.color = '#c0392b';
    
    // Create buttons container
    const buttons = document.createElement('div');
    buttons.style.display = 'flex';
    buttons.style.justifyContent = 'center';
    buttons.style.gap = '15px';
    
    // Create cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel Export';
    cancelButton.style.padding = '10px 15px';
    cancelButton.style.backgroundColor = '#e74c3c';
    cancelButton.style.color = 'white';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '4px';
    cancelButton.style.cursor = 'pointer';
    cancelButton.style.fontWeight = 'bold';
    
    // Create proceed button
    const proceedButton = document.createElement('button');
    proceedButton.textContent = 'Export First 1M Rows';
    proceedButton.style.padding = '10px 15px';
    proceedButton.style.backgroundColor = '#3498db';
    proceedButton.style.color = 'white';
    proceedButton.style.border = 'none';
    proceedButton.style.borderRadius = '4px';
    proceedButton.style.cursor = 'pointer';
    proceedButton.style.fontWeight = 'bold';
    
    // Add event listeners
    cancelButton.addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve({ proceed: false });
    });
    
    proceedButton.addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve({ proceed: true });
    });
    
    // Assemble modal
    buttons.appendChild(cancelButton);
    buttons.appendChild(proceedButton);
    
    modal.appendChild(icon);
    modal.appendChild(title);
    modal.appendChild(messageEl);
    modal.appendChild(warning);
    modal.appendChild(buttons);
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  });
};

/**
 * Continues the Excel export after user confirms proceeding with partial export
 * 
 * @param {Object} params - Export parameters including operation_id and proceed flag
 * @param {AbortSignal} signal - AbortSignal for cancellation
 * @returns {Promise} - Promise that resolves to the export result
 */
export const continueExcelExport = async (params, signal) => {
  try {
    // Check required parameters and log for debugging
    console.log('Continue export parameters:', params);
    
    if (!params.operation_id) {
      throw new Error('Missing operation_id parameter');
    }
    
    if (!params.total_rows) {
      console.warn('Warning: total_rows not provided in params');
    }
    
    // Add a progress indicator
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
    
    // Use a safe value for the row count display
    const displayRowCount = params.total_rows ? Math.min(1048576, params.total_rows).toLocaleString() : '1,048,576';
    
    progressIndicator.innerHTML = `
      <div style="margin-bottom: 15px; font-weight: bold;">Exporting First ${displayRowCount} Rows</div>
      <div id="export-status">Processing export request...</div>
      <div style="margin-top: 15px; height: 20px; background-color: rgba(255, 255, 255, 0.2); border-radius: 10px; overflow: hidden;">
        <div id="export-progress-bar" style="height: 100%; width: 0%; background-color: #4CAF50; transition: width 0.3s;"></div>
      </div>
      <div id="export-percentage" style="margin-top: 5px;">0%</div>
    `;
    
    document.body.appendChild(progressIndicator);
    
    // Make the request
    console.log('Sending continue export request with parameters:', {
      ...params,
      password: '[REDACTED]' // Mask password for security
    });
    
    const response = await axios.post('http://localhost:8000/api/export/continue', params, {
      responseType: 'blob',
      signal: signal,
      timeout: 3600000, // 60 minute timeout
    });
    
    // Handle the download
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    
    // Remove progress indicator
    document.body.removeChild(progressIndicator);
    
    // Create a download link and click it
    const a = document.createElement('a');
    a.href = url;
    
    // Get filename from Content-Disposition header if available
    let filename = 'export.xlsx';
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.includes('attachment')) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }
    }
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return { status: 'completed', filename };
  } catch (error) {
    console.error('Error in continueExcelExport:', error);
    return {
      status: 'error',
      message: error.message || 'Failed to complete export'
    };
  }
};