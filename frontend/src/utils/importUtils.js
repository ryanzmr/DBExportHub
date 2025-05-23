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
  // Add a progress indicator for long-running preview requests
  const progressIndicator = document.createElement('div');
  let progressInterval = null;
  let indicatorTimeout = null;
  
  try {
    progressIndicator.style.position = 'fixed';
    progressIndicator.style.top = '50%';
    progressIndicator.style.left = '50%';
    progressIndicator.style.transform = 'translate(-50%, -50%)';
    progressIndicator.style.padding = '20px';
    progressIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    progressIndicator.style.color = 'white';
    progressIndicator.style.borderRadius = '8px';
    progressIndicator.style.zIndex = '9999';
    progressIndicator.style.textAlign = 'center';
    progressIndicator.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    progressIndicator.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold;">Preparing Data Preview</div>
      <div id="preview-status">Retrieving data...</div>
      <div style="margin-top: 15px;">
        <div class="spinner" style="display: inline-block; width: 24px; height: 24px; border: 3px solid rgba(255,255,255,.3); border-radius: 50%; border-top-color: #fff; animation: spin 1s ease-in-out infinite;"></div>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;
    
    // Wait 1 second before showing the indicator to avoid flashing for fast responses
    indicatorTimeout = setTimeout(() => {
      document.body.appendChild(progressIndicator);
      
      // After 5 seconds, update the message to indicate it might take longer
      setTimeout(() => {
        const statusElement = progressIndicator.querySelector('#preview-status');
        if (statusElement) {
          statusElement.textContent = 'Processing large dataset. This may take several minutes...';
        }
      }, 5000);
    }, 1000);
    
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
    
    // Use client-side caching to avoid redundant heavy queries
    const cacheKey = `import-preview-${JSON.stringify(sanitizedData).replace(/[^a-zA-Z0-9]/g, '')}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    
    // If we have valid cached data and it's less than 5 minutes old, use it
    if (cachedData) {
      try {
        const parsedCache = JSON.parse(cachedData);
        const cacheAge = Date.now() - parsedCache.timestamp;
        
        // Cache valid for 5 minutes (300,000ms)
        if (cacheAge < 300000) {
          console.log('Using cached preview data');
          clearTimeout(indicatorTimeout);
          if (document.body.contains(progressIndicator)) {
            document.body.removeChild(progressIndicator);
          }
          return parsedCache.data;
        }
      } catch (e) {
        console.warn('Failed to parse cached preview data:', e);
        // Continue with the request if cache parsing fails
      }
    }
    
    const response = await axios.post('http://localhost:8000/api/import/preview', requestData, {
      signal: signal,
      timeout: 600000, // 10 minute timeout
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    // Cache the successful response
    if (response.data) {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: response.data
        }));
      } catch (e) {
        console.warn('Failed to cache preview data:', e);
        // Continue even if caching fails
      }
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching import preview data:', error);
    
    // Enhanced error handling with user-friendly messages
    if (error.code === 'ECONNABORTED') {
      throw new Error('The preview request timed out. The dataset may be too large. Try narrowing your search criteria.');
    } else if (error.response) {
      // Server responded with an error
      const status = error.response.status;
      if (status === 422) {
        throw new Error('Invalid parameters provided. Please check your input values.');
      } else if (status === 500) {
        throw new Error('Server encountered an error. Please try again or contact support.');
      }
    }
    
    throw error;
  } finally {
    // Always clean up the progress indicator
    clearTimeout(indicatorTimeout);
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    if (document.body.contains(progressIndicator)) {
      document.body.removeChild(progressIndicator);
    }
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
    <div id="import-details" style="margin-top: 10px; font-size: 0.8em;">Processing data...</div>
  `;
  
  progressIndicator.appendChild(progressContent);
  document.body.appendChild(progressIndicator);
  
  // Update status to inform user this might take time for large datasets
  setTimeout(() => {
    const statusElement = progressIndicator.querySelector('#import-status');
    if (statusElement && statusElement.textContent === 'Initializing import process...') {
      statusElement.textContent = 'Processing large dataset. This may take several minutes...';
    }
  }, 5000);
  
  // Set up a progress tracker similar to export system
  let progressInterval = null;
  let operationId = null;
  
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
  
  // Function to clean up the progress indicator
  const cleanupProgressIndicator = (delay = 2000) => {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    
    setTimeout(() => {
      if (document.body.contains(progressIndicator)) {
        document.body.removeChild(progressIndicator);
      }
    }, delay);
  };
  
  try {
    // Request data with pagination or chunking hint
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
      max_records: parseInt(formData.max_records || 1048576), // Default to Excel row limit
      force_continue_despite_limit: forceContinue // Flag to override row limit warning
    };
    
    // Create a sanitized copy for logging (mask password)
    const sanitizedData = { ...requestData, password: '[REDACTED]' };
    console.log('Import request data:', sanitizedData);
    
    // Use axios with responseType 'arraybuffer' which works better with FastAPI's StreamingResponse
    console.log('Sending Excel generation request to server...');
    const response = await axios.post('http://localhost:8000/api/import/excel', requestData, {
      responseType: 'arraybuffer',  // Use arraybuffer instead of blob for better handling
      signal: signal,
      timeout: 7200000, // 120 minute timeout for large datasets
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        'X-Client-Request-ID': `import-${Date.now()}`
      },
      onDownloadProgress: (progressEvent) => {
        // Handle any download progress info available
        if (progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          updateProgressUI(percentage, 'Downloading Excel file...', 
            `${Math.round(progressEvent.loaded / 1024 / 1024)} MB of ${Math.round(progressEvent.total / 1024 / 1024)} MB`);
        }
      }
    });
    
    // Check for JSON response (might be a row limit exceeded message)
    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('application/json')) {
      try {
        // Try to read the blob as text
        const text = await response.data.text();
        const jsonData = JSON.parse(text);
        
        if (jsonData.status === 'limit_exceeded') {
          operationId = jsonData.operation_id;
          
          // Update progress UI to show the warning
          updateProgressUI(100, 'Warning: Excel Row Limit Exceeded',
            `Total records (${jsonData.total_records.toLocaleString()}) exceed Excel row limit (${jsonData.limit.toLocaleString()}).`);
          
          // Ask user if they want to continue
          const confirmContinue = window.confirm(
            `Warning: Your query returned ${jsonData.total_records.toLocaleString()} records, which exceeds the Excel row limit of ${jsonData.limit.toLocaleString()} rows.\n\n` +
            `If you continue, only the first ${jsonData.limit.toLocaleString()} rows will be included in the Excel file.\n\n` +
            `Do you want to continue with the partial data?`
          );
          
          if (confirmContinue) {
            // User wants to continue despite the limit
            requestData.force_continue_despite_limit = true;
            
            // Clean up current progress indicator
            cleanupProgressIndicator(0);
            
            // Make a second request with the updated parameter
            return await generateImportExcel(connectionDetails, formData, signal, true);
          } else {
            // User cancelled, clean up and exit
            updateProgressUI(0, 'Operation cancelled', 'Please modify your query parameters to reduce the result size');
            cleanupProgressIndicator(3000);
            return { status: 'cancelled', message: 'Operation cancelled by user' };
          }
        }
      } catch (parseError) {
        console.log('Response appears to be JSON but couldn\'t parse:', parseError);
      }
    }
    
    // If we get here, we have a successful Excel file response from server
    updateProgressUI(100, 'Excel file generated successfully', 'Preparing file for download...');
    
    // Process the response data to ensure it's a proper Blob
    let responseData = response.data;
    
    // Always create a fresh Blob from the response data to ensure proper handling
    let blob;
    
    // Handle ArrayBuffer responses (what we should typically get)
    if (responseData instanceof ArrayBuffer) {
      console.log('Processing ArrayBuffer response of size:', responseData.byteLength);
      blob = new Blob([responseData], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
    } 
    // Handle existing Blob responses
    else if (responseData instanceof Blob) {
      console.log('Response is already a Blob of size:', responseData.size);
      blob = responseData;
    } 
    // Handle other object types as a fallback
    else if (typeof responseData === 'object') {
      console.log('Converting object to Blob');
      try {
        blob = new Blob([JSON.stringify(responseData)], { 
          type: 'application/json' 
        });
      } catch (e) {
        console.error('Failed to convert object to Blob:', e);
        throw new Error('Failed to process response data');
      }
    } 
    // Handle unexpected data types
    else {
      console.error('Unexpected response data type:', typeof responseData);
      throw new Error(`Unexpected response data type: ${typeof responseData}`);
    }
    
    // Use the new blob for the download
    responseData = blob;
    
    // Check if we have an actual blob or array buffer response
    if (!(responseData instanceof Blob) && !(responseData instanceof ArrayBuffer)) {
      console.error('Response is not a valid Blob or ArrayBuffer:', typeof responseData);
      throw new Error('Invalid response format received from server');
    }
    
    // Show completion message in progress indicator
    updateProgressUI(100, 'Excel Generation Complete', 'Initiating download now...');
    
    // Keep the progress indicator visible while processing the download
    // We'll clean it up after initiating the download in handleExcelDownload
    
    // Return the response object with the correct format for the download handler
    return {
      data: responseData, // This should be a proper Blob
      status: 'success',
      message: 'Excel file generated successfully',
      headers: response.headers,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    
  } catch (error) {
    console.error('Error generating import Excel:', error);
    
    // Enhanced error handling with user-friendly messages
    if (error.code === 'ECONNABORTED') {
      updateProgressUI(0, 'Request Timeout', 'The request timed out. Try narrowing your search criteria.');
    } else if (error.response) {
      const status = error.response.status;
      if (status === 422) {
        updateProgressUI(0, 'Invalid Parameters', 'Please check your input values.');
      } else if (status === 500) {
        updateProgressUI(0, 'Server Error', 'The server encountered an error. Please try again later.');
      } else {
        updateProgressUI(0, 'Error', `Error ${status}: ${error.message || 'Unknown error'}`);
      }
    } else {
      updateProgressUI(0, 'Error', error.message || 'An unexpected error occurred');
    }
    
    // Clean up progress indicator after showing error
    cleanupProgressIndicator(5000);
    
    throw error;
  }
};

/**
 * Handle Excel download
 * @param {Object} response - Export response
 * @param {Object} formData - Form data used for the export
 */
export const handleExcelDownload = (response, formData) => {
  console.log('handleExcelDownload called with response:', {
    status: response.status,
    headers: response.headers,
    dataType: response.data ? (typeof response.data) : 'none',
    dataSize: response.data ? (response.data.byteLength || 'unknown size') : 'no data'
  });
  
  // Create a function to clean up any lingering progress indicators
  const cleanupRemainingIndicators = () => {
    // Find and remove any progress indicators that might still be present
    const progressIndicators = document.querySelectorAll('div[style*="position: fixed"][style*="z-index: 9999"]');
    progressIndicators.forEach(indicator => {
      if (document.body.contains(indicator)) {
        document.body.removeChild(indicator);
      }
    });
  };
  
  try {
    // Clean up any existing progress indicators to prevent UI clutter
    cleanupRemainingIndicators();
    // Ensure we have data to download
    if (!response || !response.data) {
      console.error('No data to download');
      alert('No data available for download. Please try again.');
      return;
    }
    
    let blobData = response.data;
    
    // If response.data is not already a Blob, convert it
    if (!(blobData instanceof Blob)) {
      console.log('Response data is not a Blob, converting to Blob:', typeof blobData);
      
      // Handle ArrayBuffer
      if (blobData instanceof ArrayBuffer) {
        blobData = new Blob([blobData], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
      } 
      // Handle other object types
      else if (typeof blobData === 'object') {
        try {
          blobData = new Blob([JSON.stringify(blobData)], { type: 'application/json' });
        } catch (e) {
          console.error('Failed to convert object to Blob:', e);
          alert('Error preparing file for download. Please try again.');
          return;
        }
      }
      else {
        console.error('Unsupported data type for download:', typeof blobData);
        alert('Error preparing file for download. Please try again.');
        return;
      }
    }
    
    // Create a download link
    const url = window.URL.createObjectURL(blobData);
    const link = document.createElement('a');
    link.href = url;
    
    // Get filename from content-disposition header or create a default one
    const contentDisposition = response.headers?.['content-disposition'];
    let filename = `import_${formData.fromMonth}_to_${formData.toMonth}.xlsx`;
    
    if (contentDisposition) {
      console.log('Content-Disposition header:', contentDisposition);
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/i);
      if (filenameMatch && filenameMatch.length === 2) {
        filename = filenameMatch[1];
        console.log('Extracted filename from header:', filename);
      }
    }
    
    // Log operation ID if present
    const operationId = response.headers?.['x-operation-id'];
    if (operationId) {
      console.log('Excel generation operation ID:', operationId);
    }
    
    console.log('Downloading file with name:', filename);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    
    // Trigger the download
    link.click();
    
    // Clean up with a small delay to ensure the download starts
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      console.log('Download cleanup completed');
    
    // Show a success notification to the user
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.style.zIndex = '9999';
    notification.innerHTML = 'Excel file downloaded successfully!';
    document.body.appendChild(notification);
    
    // Remove the notification after 5 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 5000);
  }, 100);
  } catch (error) {
    console.error('Error handling Excel download:', error);
    alert('Error downloading file. Please try again.');
  }
};

/**
 * Cleanup database connection
 * @param {Object} connectionDetails - Database connection details
 * @returns {Promise<Object>} - Cleanup response
 */
export const cleanupConnection = async (connectionDetails) => {
  try {
    // Match the cleanup structure in exportUtils.js
    const response = await axios.post('http://localhost:8000/api/cleanup', {
      ...connectionDetails,
      sessionId: connectionDetails.sessionId || Date.now().toString()
    });
    
    return response.data;
  } catch (error) {
    // Log but don't throw - make cleanup more resilient
    console.error('Error cleaning up connection:', error);
    // Return a generic success response so the UI flow isn't interrupted
    return { success: false, message: 'Failed to cleanup connection' };
  }
};
