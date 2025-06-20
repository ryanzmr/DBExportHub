/**
 * Utility functions for date handling in the application
 */

/**
 * Validates if a string is in YYYYMM format
 * @param {string|number} value - The value to validate
 * @returns {boolean} - True if valid YYYYMM format
 */
export const isValidYYYYMM = (value) => {
  // Convert to string if number
  const strValue = String(value);
  
  // Check if it's 6 digits
  if (!/^\d{6}$/.test(strValue)) {
    return false;
  }
  
  // Extract year and month
  const year = parseInt(strValue.substring(0, 4), 10);
  const month = parseInt(strValue.substring(4, 6), 10);
  
  // Validate year and month
  return year >= 1900 && year <= 2100 && month >= 1 && month <= 12;
};

/**
 * Check if fromMonth is less than or equal to toMonth
 * 
 * @param {string} fromMonth - The starting month in YYYYMM format
 * @param {string} toMonth - The ending month in YYYYMM format
 * @returns {boolean} - True if fromMonth is less than or equal to toMonth, or if either value is missing/invalid
 */
export const isValidDateRange = (fromMonth, toMonth) => {
  // If either value is missing or invalid format, return true (validation will be handled elsewhere)
  if (!fromMonth || !toMonth || !isValidYYYYMM(fromMonth) || !isValidYYYYMM(toMonth)) {
    return true;
  }
  
  // Convert to numbers for comparison
  const fromValue = parseInt(fromMonth, 10);
  const toValue = parseInt(toMonth, 10);
  
  // Return true if fromMonth is less than or equal to toMonth
  return fromValue <= toValue;
};

/**
 * Get error message for date range validation
 * 
 * @param {string} fromMonth - The starting month in YYYYMM format
 * @param {string} toMonth - The ending month in YYYYMM format
 * @returns {string} - Error message or empty string if no error
 */
export const getDateRangeErrorMessage = (fromMonth, toMonth) => {
  if (!fromMonth || !toMonth || !isValidYYYYMM(fromMonth) || !isValidYYYYMM(toMonth)) {
    return '';
  }
  
  return isValidDateRange(fromMonth, toMonth) 
    ? '' 
    : 'From Month must be earlier than or equal to To Month';
};

/**
 * Formats a YYYYMM number to a readable date string
 * @param {string|number} yyyymm - The date in YYYYMM format
 * @param {string} format - The output format ('short', 'long', 'numeric')
 * @returns {string} - Formatted date string
 */
export const formatYYYYMM = (yyyymm, format = 'short') => {
  if (!isValidYYYYMM(yyyymm)) {
    return 'Invalid date';
  }
  
  const strValue = String(yyyymm);
  const year = strValue.substring(0, 4);
  const month = parseInt(strValue.substring(4, 6), 10);
  
  switch (format) {
    case 'long':
      return new Date(year, month - 1).toLocaleString('default', { 
        month: 'long', 
        year: 'numeric' 
      });
    case 'numeric':
      return `${month}/${year}`;
    case 'short':
    default:
      return new Date(year, month - 1).toLocaleString('default', { 
        month: 'short', 
        year: 'numeric' 
      });
  }
};

/**
 * Gets the current month in YYYYMM format
 * @returns {number} - Current month in YYYYMM format
 */
export const getCurrentYYYYMM = () => {
  const now = new Date();
  return now.getFullYear() * 100 + (now.getMonth() + 1);
};

/**
 * Gets the first month of the current year in YYYYMM format
 * @returns {number} - First month of current year in YYYYMM format
 */
export const getFirstMonthOfYear = () => {
  const now = new Date();
  return now.getFullYear() * 100 + 1;
};

/**
 * Gets the last month of the current year in YYYYMM format
 * @returns {number} - Last month of current year in YYYYMM format
 */
export const getLastMonthOfYear = () => {
  const now = new Date();
  return now.getFullYear() * 100 + 12;
};