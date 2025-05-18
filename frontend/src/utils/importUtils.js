import axios from 'axios';

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
 * Fetch preview data for the import query
 * @param {Object} connectionDetails - Database connection details
 * @param {Object} formData - Form data for the import query
 * @param {AbortSignal} signal - AbortController signal for cancellation
 * @returns {Promise<Object>} - Preview data response
 */
export const fetchImportPreviewData = async (connectionDetails, formData, signal) => {
  try {
    // Format request params to match backend ImportParameters structure
    const requestData = {
      // Connection details
      server: connectionDetails.server,
      database: connectionDetails.database,
      username: connectionDetails.username,
      password: connectionDetails.password,
      
      // Import parameters
      fromMonth: parseInt(formData.fromMonth),
      toMonth: parseInt(formData.toMonth),
      hs: formData.hs || '',
      prod: formData.prod || '',
      iec: formData.iec || '',
      impCmp: formData.impCmp || '',
      forcount: formData.forcount || '',
      forname: formData.forname || '',
      port: formData.port || '',
      shipper: formData.shipper || '',
      
      // Additional options
      preview_only: true,
      max_records: 100
    };
    
    // Create a sanitized copy for logging (mask password)
    const sanitizedData = { ...requestData, password: '[REDACTED]' };
    console.log('Import Preview request data:', sanitizedData);
    
    const response = await axios.post('http://localhost:8000/api/import/preview', requestData, {
      signal: signal,
      timeout: 60000 // 60 second timeout
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching import preview data:', error);
    throw error;
  }
};

/**
 * Generate Excel export for import data
 * @param {Object} connectionDetails - Database connection details
 * @param {Object} formData - Form data for the export query
 * @param {AbortSignal} signal - AbortController signal for cancellation
 * @param {boolean} forceContinue - Whether to continue despite row limit
 * @returns {Promise<Object>} - Export response
 */
export const generateImportExcel = async (connectionDetails, formData, signal, forceContinue = false) => {
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
      <div style="margin-bottom: 15px; font-weight: bold;">Preparing Large Dataset Import</div>
      <div id="import-status">Initializing import process...</div>
      <div style="margin-top: 15px; height: 20px; background-color: rgba(255, 255, 255, 0.2); border-radius: 10px; overflow: hidden;">
        <div id="import-progress-bar" style="height: 100%; width: 0%; background-color: #4CAF50; transition: width 0.3s;"></div>
      </div>
      <div id="import-percentage" style="margin-top: 5px;">0%</div>
      <div id="import-details" style="margin-top: 10px; font-size: 0.8em;">Starting import...</div>
    `;
    
    progressIndicator.appendChild(progressContent);
    document.body.appendChild(progressIndicator);
    
    // Request data matching backend ImportParameters structure
    const requestData = {
      // Connection details
      server: connectionDetails.server,
      database: connectionDetails.database,
      username: connectionDetails.username,
      password: connectionDetails.password,
      
      // Import parameters
      fromMonth: parseInt(formData.fromMonth),
      toMonth: parseInt(formData.toMonth),
      hs: formData.hs || '',
      prod: formData.prod || '',
      iec: formData.iec || '',
      impCmp: formData.impCmp || '',
      forcount: formData.forcount || '',
      forname: formData.forname || '',
      port: formData.port || '',
      shipper: formData.shipper || '',
      
      // Additional options
      preview_only: false,
      max_records: 10000,
      force_continue_despite_limit: forceContinue,
      
      // Custom options for processing
      useChunking: true,
      chunkSize: 10000,
      useStreaming: true,
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
    console.log('Import request data:', sanitizedData);
    
    // Function to update the progress UI
    const updateProgressUI = (percentage, status, details) => {
      const progressBar = progressIndicator.querySelector('#import-progress-bar');
      const percentageText = progressIndicator.querySelector('#import-percentage');
      const statusElement = progressIndicator.querySelector('#import-status');
      const detailsElement = progressIndicator.querySelector('#import-details');
      
      if (progressBar) progressBar.style.width = `${percentage}%`;
      if (percentageText) percentageText.textContent = `${percentage}%`;
      if (statusElement && status) statusElement.textContent = status;
      if (detailsElement && details) detailsElement.textContent = details;
    };
    
    // Make the request to the correct endpoint
    const response = await axios.post('http://localhost:8000/api/import/excel', requestData, {
      responseType: 'blob',
      signal: signal,
      timeout: 3600000, // 60 minute timeout for large datasets
      maxContentLength: Infinity, // Remove content length limit
      maxBodyLength: Infinity, // Remove body length limit
      headers: {
        'X-Client-Request-ID': `import-${Date.now()}`
      }
    }).finally(() => {
      // Clean up progress indicator after response is received
      setTimeout(() => {
        if (document.body.contains(progressIndicator)) {
          document.body.removeChild(progressIndicator);
        }
      }, 1000); // Allow time for the user to see the final state
    });
    
    // Check if we got an array buffer (Excel file)
    if (response.data instanceof Blob || response.data instanceof ArrayBuffer) {
      return {
        data: response.data,
        status: 'success',
        headers: response.headers
      };
    } else {
      // Handle non-binary response
      try {
        // If it's already a string or JSON object
        if (typeof response.data === 'string') {
          return JSON.parse(response.data);
        } else if (typeof response.data === 'object') {
          return response.data;
        } else {
          // Fallback for other data types
          console.warn('Unexpected response type:', typeof response.data);
          return { status: 'error', message: 'Unexpected response format' };
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Failed to parse server response');
      }
    }
  } catch (error) {
    console.error('Error generating import Excel:', error);
    throw error;
  }
};

/**
 * Handle Excel download
 * @param {Object} response - Export response
 * @param {Object} formData - Form data used for the export
 */
export const handleExcelDownload = (response, formData) => {
  // Create a download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  
  // Get filename from content-disposition header or create a default one
  const contentDisposition = response.headers?.['content-disposition'];
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
};

/**
 * Cleanup database connection
 * @param {Object} connectionDetails - Database connection details
 * @returns {Promise<Object>} - Cleanup response
 */
export const cleanupConnection = async (connectionDetails) => {
  try {
    const response = await axios.post('http://localhost:8000/api/cleanup', {
      connection: connectionDetails
    });
    
    return response.data;
  } catch (error) {
    console.error('Error cleaning up connection:', error);
    throw error;
  }
};
