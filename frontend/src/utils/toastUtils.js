/**
 * Utility functions for displaying toast notifications
 */

/**
 * Display a toast notification with the given message
 * 
 * @param {string} message - The message to display
 * @param {Object} options - Configuration options
 * @param {string} options.type - The type of notification ('success', 'error', 'warning', 'info')
 * @param {number} options.duration - Duration in milliseconds (default: 3000)
 */
export const showToast = (message, options = {}) => {
  const { 
    type = 'success', 
    duration = 3000 
  } = options;
  
  // Set background color based on notification type
  let backgroundColor;
  switch (type) {
    case 'error':
      backgroundColor = '#F44336'; // Red
      break;
    case 'warning':
      backgroundColor = '#FF9800'; // Orange
      break;
    case 'info':
      backgroundColor = '#2196F3'; // Blue
      break;
    case 'success':
    default:
      backgroundColor = '#4CAF50'; // Green
      break;
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.backgroundColor = backgroundColor;
  toast.style.color = 'white';
  toast.style.padding = '16px';
  toast.style.borderRadius = '8px';
  toast.style.zIndex = '1000';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  toast.style.transition = 'opacity 0.3s';
  toast.style.fontWeight = '500';
  toast.textContent = message;
  
  // Add to DOM
  document.body.appendChild(toast);
  
  // Remove toast after specified duration
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, duration);
  
  return toast;
};
