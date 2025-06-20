/**
 * View Validation Module
 * 
 * This module provides shared functions for validating database views
 * for both Import and Export operations in DBExportHub.
 * 
 * It ensures that selected views exist in the database before attempting
 * to query them, improving error handling and user experience.
 */

import api from '../services/api';

/**
 * Validates that a selected view exists in the database
 * 
 * @param {Object} connectionDetails - The database connection details
 * @param {string} viewId - The ID of the view to validate
 * @param {string} category - The view category ('export' or 'import')
 * @returns {Promise<Object>} - Result with success status and message
 */
export const validateViewExists = async (connectionDetails, viewId, category) => {
  if (!viewId) {
    return { 
      success: false, 
      message: 'No view selected' 
    };
  }
  
  try {
    // Call the backend API to validate the view
    const result = await api.validateView(connectionDetails, viewId, category);
    
    // If the view doesn't exist, return a user-friendly message
    if (!result.success) {
      return { 
        success: false, 
        message: "This view does not exist in the database. Please check with the DBA or select a different view." 
      };
    }
    
    return result;
  } catch (error) {
    console.error('View validation error:', error);
    return { 
      success: false, 
      message: error.message || 'Error validating view. Please try again.'
    };
  }
};

/**
 * Determines if an operation can proceed based on view validation status
 * 
 * @param {string} validationStatus - The current validation status ('pending', 'valid', 'invalid')
 * @returns {boolean} - Whether the operation can proceed
 */
export const canProceedWithOperation = (validationStatus) => {
  // Only allow operations to proceed if the view is valid
  return validationStatus === 'valid';
};

export default {
  validateViewExists,
  canProceedWithOperation
};
