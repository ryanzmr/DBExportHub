/**
 * View validation utilities for DBExportHub
 * 
 * This module provides functions for validating database views
 * to ensure they exist before attempting to query them.
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
    return { success: false, message: 'No view selected' };
  }
  
  try {
    // Call the backend API to validate the view
    const result = await api.validateView(connectionDetails, viewId, category);
    return result;
  } catch (error) {
    console.error('View validation error:', error);
    return { 
      success: false, 
      message: error.message || 'Error validating view. Please try again.'
    };
  }
};

export default {
  validateViewExists
};
