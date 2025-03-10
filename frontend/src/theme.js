import { createTheme } from '@mui/material/styles';
import '@fontsource/inter';
const theme = createTheme({
  palette: {
    primary: {
      main: '#5A4FFF',
      light: '#7A70FF',
      dark: '#4A3FEF',
      contrastText: '#fff',
    },
    secondary: {
      main: '#388e3c',
      light: '#4caf50',
      dark: '#2e7d32',
      contrastText: '#fff',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
      table: '#FFFFFF',
      tableHeader: '#8bc1f7',
      tableHover: 'rgba(0, 0, 0, 0.04)',
      tableSelected: 'rgba(25, 118, 210, 0.08)'
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
      table: '#000000',
      tableSecondary: '#666666'
    },
    divider: {
      main: 'rgba(0, 0, 0, 0.1)'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      color: '#333333',
    },
    h5: {
      fontWeight: 500,
      color: '#333333',
    },
    h6: {
      fontWeight: 500,
      color: '#333333',
    },
    subtitle1: {
      fontWeight: 400,
      color: '#666666',
    },
    button: {
      fontWeight: 500,
    },
    table: {
      fontSize: '0.875rem',
      fontWeight: 400
    }
  },
  shape: {
    borderRadius: 8,
  },
  transitions: {
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
          margin: 0,
          padding: 0,
        },
        html: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          height: '100%',
          width: '100%',
        },
        body: {
          scrollBehavior: 'smooth',
          height: '100%',
          width: '100%',
          fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '::-webkit-scrollbar-track': {
          background: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '4px',
        },
        '::-webkit-scrollbar-thumb': {
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
          '&:hover': {
            background: 'rgba(0, 0, 0, 0.3)',
          },
        },
        a: {
          textDecoration: 'none',
          color: '#5A4FFF',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          background: '#ffffff',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
        },
        containedPrimary: {
          boxShadow: '0 2px 8px rgba(90, 79, 255, 0.25)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(90, 79, 255, 0.35)',
            transform: 'translateY(-1px)',
          },
        },
        containedSecondary: {
          boxShadow: '0 2px 8px rgba(56, 142, 60, 0.25)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(56, 142, 60, 0.35)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          marginBottom: '16px',
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out',
            '&.Mui-focused': {
              boxShadow: '0 0 0 3px rgba(90, 79, 255, 0.2)',
            },
            '&:hover': {
              borderColor: '#5A4FFF',
            },
            '& fieldset': {
              borderWidth: '1px',
              transition: 'border-color 0.2s ease-in-out',
            },
          },
          '& .MuiInputLabel-root': {
            transition: 'all 0.2s ease-in-out',
            '&.Mui-focused': {
              color: '#5A4FFF',
            },
          },
          '& .MuiInputBase-input': {
            padding: '12px 14px',
          },
          '& .MuiFormHelperText-root': {
            marginLeft: 0,
            fontSize: '0.75rem',
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          '& .MuiTableCell-head': {
            backgroundColor: '#8bc1f7',
            color: '#000000',
            fontWeight: 700,
            borderBottom: '2px solid #1565c0',
          },
          '& .MuiTableCell-body': {
            color: '#000000',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          },
          '& .MuiTableRow-root:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          color: '#333333',
        },
        select: {
          color: '#333333',
        },
        selectIcon: {
          color: '#333333',
        },
      },
    },
  },
});

export default theme;