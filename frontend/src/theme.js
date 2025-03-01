import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
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
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      color: '#1976d2',
    },
    h5: {
      fontWeight: 500,
      color: '#333333',
    },
    h6: {
      fontWeight: 500,
    },
    subtitle1: {
      fontWeight: 400,
      color: '#424242',
    },
    button: {
      fontWeight: 500,
    },
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
        },
        '::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '::-webkit-scrollbar-track': {
          background: '#f1f1f1',
          borderRadius: '4px',
        },
        '::-webkit-scrollbar-thumb': {
          background: '#c1c1c1',
          borderRadius: '4px',
          '&:hover': {
            background: '#a8a8a8',
          },
        },
        a: {
          textDecoration: 'none',
          color: '#1976d2',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
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
          boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.35)',
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
              boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
            },
            '&:hover': {
              borderColor: '#1976d2',
            },
            '& fieldset': {
              borderWidth: '1px',
              transition: 'border-color 0.2s ease-in-out',
            },
          },
          '& .MuiInputLabel-root': {
            transition: 'all 0.2s ease-in-out',
            '&.Mui-focused': {
              color: '#1976d2',
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
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          marginBottom: '24px',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(25, 118, 210, 0.05)',
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: '#1976d2',
            fontSize: '0.875rem',
            padding: '16px',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          },
          '&:nth-of-type(even)': {
            backgroundColor: 'rgba(0, 0, 0, 0.01)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          borderBottom: '1px solid rgba(224, 224, 224, 1)',
          fontSize: '0.875rem',
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          color: '#757575',
        },
        selectIcon: {
          color: '#757575',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          padding: '8px 16px',
        },
        standardSuccess: {
          backgroundColor: 'rgba(46, 125, 50, 0.1)',
          color: '#2e7d32',
        },
        standardInfo: {
          backgroundColor: 'rgba(2, 136, 209, 0.1)',
          color: '#0288d1',
        },
        standardWarning: {
          backgroundColor: 'rgba(237, 108, 2, 0.1)',
          color: '#ed6c02',
        },
        standardError: {
          backgroundColor: 'rgba(211, 47, 47, 0.1)',
          color: '#d32f2f',
        },
        icon: {
          opacity: 0.9,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          padding: '8px',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 600,
          padding: '16px 24px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          margin: '16px 0',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(33, 33, 33, 0.9)',
          borderRadius: 6,
          fontSize: '0.75rem',
          padding: '8px 12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        },
        arrow: {
          color: 'rgba(33, 33, 33, 0.9)',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 42,
          height: 26,
          padding: 0,
          margin: 8,
        },
        switchBase: {
          padding: 1,
          '&.Mui-checked': {
            transform: 'translateX(16px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
              backgroundColor: '#1976d2',
              opacity: 1,
              border: 'none',
            },
          },
          '&.Mui-focusVisible .MuiSwitch-thumb': {
            color: '#1976d2',
            border: '6px solid #fff',
          },
        },
        thumb: {
          width: 24,
          height: 24,
        },
        track: {
          borderRadius: 13,
          border: '1px solid #bdbdbd',
          backgroundColor: '#e0e0e0',
          opacity: 1,
          transition: 'background-color 0.2s ease-in-out',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
        elevation3: {
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
        },
        elevation4: {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.14)',
        },
        elevation8: {
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.16)',
        },
        elevation12: {
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18)',
        },
        elevation16: {
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.2)',
        },
        elevation24: {
          boxShadow: '0 24px 56px rgba(0, 0, 0, 0.22)',
        },
      },
    },
  },
});

export default theme;