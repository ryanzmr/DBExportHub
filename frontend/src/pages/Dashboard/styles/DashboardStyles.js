// DashboardStyles.js
// Contains all styling for the Dashboard component

// Common text field style used throughout the form
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

// Header styles
export const headerStyles = (theme) => ({
  appBar: {
    mb: 4,
    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
    boxShadow: '0 3px 5px 2px rgba(0, 0, 0, 0.1)'
  },
  headerTitle: {
    fontWeight: 700,
    letterSpacing: '0.01em',
    fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
    textTransform: 'none',
    fontSize: '1.4rem',
    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
  },
  headerChip: {
    ml: 2, 
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    fontWeight: 500,
    fontSize: '0.875rem',
    '& .MuiChip-label': {
      padding: '0 12px'
    }
  },
  logoutButton: {
    borderRadius: 20,
    textTransform: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
    px: 3
  }
});

// Card header styles
export const cardHeaderStyles = (theme) => ({
  cardHeader: {
    display: 'flex', 
    alignItems: 'center', 
    mb: 3, 
    borderBottom: `2px solid ${theme.palette.primary.main}`,
    p: 2,
    color: '#1a365d'
  },
  cardHeaderTitle: {
    fontWeight: 700,
    fontSize: '1.35rem',
    letterSpacing: '0.01em',
    fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
    color: '#1a2b4a'
  },
  advancedOptionsLabel: {
    fontWeight: 500,
    fontSize: '0.95rem',
    color: '#445577',
    letterSpacing: '0.01em'
  },
  cardHeaderIcon: {
    color: theme.palette.primary.main,
    mr: 2,
    fontSize: 28
  }
});

// Form container styles
export const formContainerStyles = {
  formContainer: {
    padding: 2
  },
  actionButtonsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 2,
    mt: 3
  },
  actionButton: {
    textTransform: 'none',
    fontWeight: 500,
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '8px 16px',
    minWidth: '100px'
  }
};

// Table styles
export const tableStyles = (theme) => ({
  tableContainer: {
    maxHeight: '500px',
    overflowY: 'auto',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    '&::-webkit-scrollbar': {
      width: '8px',
      height: '8px'
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: '4px'
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'rgba(0,0,0,0.05)'
    }
  },
  tableHead: {
    backgroundColor: theme.palette.primary.main,
    position: 'sticky',
    top: 0,
    zIndex: 10
  },
  tableHeadCell: {
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '0.95rem',
    padding: '12px 16px',
    textAlign: 'left',
    borderRight: '1px solid rgba(255,255,255,0.15)',
    '&:last-child': {
      borderRight: 'none'
    }
  },
  tableCell: {
    fontSize: '0.9rem',
    padding: '10px 16px',
    borderRight: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
      borderRight: 'none'
    }
  },
  tableRow: {
    '&:nth-of-type(odd)': {
      backgroundColor: 'rgba(0,0,0,0.02)'
    },
    '&:hover': {
      backgroundColor: 'rgba(25, 118, 210, 0.08)'
    }
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 0',
    color: theme.palette.text.secondary
  }
});

// Button styles
export const buttonStyles = {
  primary: {
    borderRadius: '8px',
    textTransform: 'none',
    fontWeight: 600,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '8px 24px',
    fontSize: '0.95rem',
    height: '48px',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
      transform: 'translateY(-1px)'
    }
  },
  secondary: {
    borderRadius: '8px',
    textTransform: 'none',
    fontWeight: 600,
    padding: '8px 24px',
    fontSize: '0.95rem',
    height: '48px',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.08)'
    }
  }
};