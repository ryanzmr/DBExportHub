// Common styles for login components
export const commonTextFieldStyles = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    color: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    height: '48px',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    '&:hover fieldset': {
      borderColor: '#5A4FFF',
    },
    '& input': {
      backgroundColor: 'transparent',
      color: 'white',
      padding: '12px 14px',
      '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active': {
        '-webkit-box-shadow': '0 0 0 30px rgba(19, 19, 42, 0.8) inset !important',
        '-webkit-text-fill-color': 'white !important',
        'border-radius': '8px',
        'transition': 'background-color 5000s ease-in-out 0s'
      }
    },
    '& input::placeholder': {
      color: 'rgba(255, 255, 255, 0.5)',
      opacity: 0.7,
      fontSize: '0.95rem'
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      boxShadow: '0 0 0 2px rgba(90, 79, 255, 0.25)'
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
    fontWeight: 600,
    transform: 'translate(14px, -9px) scale(0.75)',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.75)',
    }
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: '1px',
    borderRadius: '8px'
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(90, 79, 255, 0.5)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#5A4FFF',
    borderWidth: '1.5px',
  },
  '& .MuiInputAdornment-root': {
    marginLeft: '8px',
  }
};

export const featureCardStyles = {
  card: {
    p: 1.5,
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 2,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-2px)',
      background: 'rgba(255, 255, 255, 0.05)',
    },
  },
  iconContainer: {
    p: 0.8,
    borderRadius: 1.2,
    background: 'rgba(90, 79, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    mr: 1.2,
  },
  title: {
    color: 'white',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '0.8rem',
  },
};

export const loginContainerStyles = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(135deg, #0D0D2B 0%, #13132A 100%)',
  position: 'relative',
  overflow: 'hidden',
  alignItems: 'center',
};

export const loginFormStyles = {
  paper: {
    maxWidth: { xs: 360, sm: 450 },
    width: '100%',
    position: 'relative',
    zIndex: 1,
    background: 'rgba(19, 19, 42, 0.75)',
    backdropFilter: 'blur(16px)',
    borderRadius: 3,
    overflow: 'hidden',
    p: { xs: 3, sm: 4 },
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(90, 79, 255, 0.2)',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
      transform: 'translateY(-2px)'
    }
  },
  title: {
    fontWeight: 700,
    background: 'linear-gradient(45deg, #5A4FFF, #7A70FF)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    mb: 1,
    fontFamily: '"Inter", sans-serif',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.85rem',
    fontFamily: '"Inter", sans-serif',
  },
  connectButton: {
    py: 1.2,
    fontSize: '0.95rem',
    fontWeight: 600,
    textTransform: 'none',
    borderRadius: 2,
    background: 'linear-gradient(45deg, #5A4FFF 30%, #6C63FF 90%)',
    boxShadow: '0 4px 10px rgba(90, 79, 255, 0.3)',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      background: 'linear-gradient(45deg, #4A3FEF 30%, #5A4FFF 90%)',
      boxShadow: '0 6px 15px rgba(90, 79, 255, 0.4)',
      transform: 'translateY(-1px)'
    }
  }
};