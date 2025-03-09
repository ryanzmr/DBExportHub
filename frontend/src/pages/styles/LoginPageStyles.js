// Common styles for login components
export const commonTextFieldStyles = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 1.5,
    color: 'white',
    backgroundColor: 'transparent',
    backdropFilter: 'blur(8px)',
    '&:hover fieldset': {
      borderColor: '#5A4FFF',
    },
    '& input': {
      backgroundColor: 'transparent',
      color: 'white',
      '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active': {
        '-webkit-box-shadow': '0 0 0 30px rgba(19, 19, 42, 0.8) inset !important',
        '-webkit-text-fill-color': 'white !important',
        'border-radius': '8px',
        'transition': 'background-color 5000s ease-in-out 0s'
      }
    },
    '& input::placeholder': {
      color: 'rgba(255, 255, 255, 0.5)'
    },
    '&.Mui-focused': {
      backgroundColor: 'transparent'
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(90, 79, 255, 0.5)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#5A4FFF',
  },
};

export const featureCardStyles = {
  card: {
    p: 2.5,
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 2.5,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-2px)',
      background: 'rgba(255, 255, 255, 0.05)',
    },
  },
  iconContainer: {
    p: 1,
    borderRadius: 1.5,
    background: 'rgba(90, 79, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    mr: 1.5,
  },
  title: {
    color: 'white',
    fontSize: '0.95rem',
    fontWeight: 500,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '0.85rem',
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
    maxWidth: { xs: 340, sm: 380 },
    width: '100%',
    position: 'relative',
    zIndex: 1,
    background: 'rgba(19, 19, 42, 0.8)',
    backdropFilter: 'blur(12px)',
    borderRadius: 2.5,
    overflow: 'hidden',
    p: { xs: 2.5, sm: 3 },
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(90, 79, 255, 0.2)',
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
};