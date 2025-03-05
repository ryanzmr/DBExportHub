// ExportPageStyles.js
// Contains all styling for the ExportPage component

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
    fontWeight: 600,
    letterSpacing: '0.5px',
    fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
    textTransform: 'none'
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
    fontWeight: 600,
    fontSize: '1.35rem',
    letterSpacing: '0.3px',
    color: '#1a365d'
  },
  advancedOptionsLabel: {
    fontWeight: 600,
    fontSize: '1rem',
    letterSpacing: '0.3px',
    color: '#1a365d'
  }
});

// Form container styles
export const formContainerStyles = (theme) => ({
  formContainer: {
    width: '90%', 
    mx: 'auto', 
    mb: 2,
    p: 3,
    borderRadius: 2,
    background: 'white',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    border: '1px solid',
    borderColor: 'transparent',
    backgroundImage: `linear-gradient(white, white), linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
    backgroundOrigin: 'border-box',
    backgroundClip: 'padding-box, border-box',
  }
});

// Table styles
export const tableStyles = (theme) => ({
  tableContainer: {
    maxHeight: 'calc(100vh - 400px)',
    overflowY: 'auto',
    overflowX: 'auto',
    '&::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: '4px',
    }
  },
  tableHeaderCell: {
    fontWeight: 700,
    backgroundColor: '#8bc1f7 !important',
    color: '#000000 !important',
    position: 'sticky',
    top: 0,
    zIndex: 2,
    padding: '12px 16px',
    textAlign: 'center',
    fontSize: '0.875rem',
    whiteSpace: 'nowrap',
    minWidth: '150px',
    borderBottom: '2px solid #1565c0',
    borderRight: '1px solid rgba(0, 0, 0, 0.1)',
    '&.MuiTableCell-head': {
      color: '#000000 !important',
      backgroundColor: '#8bc1f7 !important',
      fontWeight: 700
    }
  },
  tableRow: {
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.action.hover
    },
    '&:hover': {
      backgroundColor: theme.palette.action.selected
    }
  },
  tableCell: (isNumeric) => ({
    padding: '8px 16px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '300px',
    borderRight: '1px solid rgba(224, 224, 224, 0.5)',
    textAlign: isNumeric ? 'right' : 'left',
    fontSize: '0.875rem',
    color: '#000000',
    '&:last-child': {
      borderRight: 'none'
    }
  }),
  recordCountChip: {
    fontWeight: 500,
    fontSize: '0.875rem',
    '& .MuiChip-label': {
      padding: '0 12px'
    }
  }
});