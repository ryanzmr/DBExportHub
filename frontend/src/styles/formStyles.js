/**
 * Shared form styles for the application
 * This file contains common styling patterns used across multiple components
 */

// Common text field style used in forms
export const commonTextFieldStyle = {
  '& .MuiInputBase-root': { 
    height: '56px',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: '#f8f9fa'
    },
    '&.Mui-focused': {
      backgroundColor: '#ffffff',
      boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
    }
  },
  '& .MuiInputLabel-root': { 
    fontSize: '1.1rem',
    color: '#1a365d',
    fontWeight: 600,
    fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
    letterSpacing: '0.3px',
    transform: 'translate(14px, -12px) scale(0.75)',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -12px) scale(0.75)',
    }
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(0, 0, 0, 0.23)',
    borderRadius: '8px',
    legend: {
      marginLeft: '4px'
    }
  },
  '& .MuiInputBase-input': {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#000000',
    fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
    letterSpacing: '0.2px',
    padding: '16px 14px 16px 14px',
    '&::placeholder': {
      color: 'rgba(0, 0, 0, 0.6)',
      fontSize: '1.05rem',
      fontWeight: 500,
      opacity: 0.8
    }
  },
  '& .MuiInputAdornment-root': {
    marginTop: '0 !important',
    marginLeft: '8px'
  }
};

// Login form text field style
export const loginTextFieldStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 1.5,
    '&:hover fieldset': {
      borderColor: 'primary.main',
    },
  },
};

// Button styles
export const primaryButtonStyle = {
  py: 1,
  borderRadius: 1.5,
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '0.9rem',
  background: 'linear-gradient(45deg, #1e40af, #3b82f6)',
  boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)',
  '&:hover': {
    background: 'linear-gradient(45deg, #1e3a8a, #3b82f6)',
    boxShadow: '0 6px 15px rgba(59, 130, 246, 0.4)',
  },
};

// Card container styles
export const cardContainerStyle = { 
  width: '90%', 
  mx: 'auto', 
  mb: 2,
  p: 3,
  borderRadius: 2,
  background: 'white',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  border: '1px solid',
  borderColor: 'transparent',
  backgroundOrigin: 'border-box',
  backgroundClip: 'padding-box, border-box',
};

// Section header styles
export const sectionHeaderStyle = {
  display: 'flex', 
  alignItems: 'center', 
  mb: 3, 
  p: 2,
  color: '#1a365d'
};

// Typography styles
export const headerTypographyStyle = {
  fontWeight: 600,
  fontSize: '1.35rem',
  letterSpacing: '0.3px',
  color: '#1a365d'
};

export const subHeaderTypographyStyle = {
  fontWeight: 600,
  fontSize: '1rem',
  letterSpacing: '0.3px',
  color: '#1a365d'
};