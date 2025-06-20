import React, { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { validateViewExists } from '../../utils/viewValidationModule';
import api from '../../services/api';
import { 
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert,
  Paper,
  InputBase,
  Divider,
  Tooltip,
  Chip
} from '@mui/material';
import {
  ViewColumn,
  KeyboardArrowDown,
  CheckCircleOutline,
  ErrorOutline,
  Info
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';

// Styled components for custom select
const StyledFormControl = styled(FormControl)(({ theme }) => ({
  width: '100%',
  maxWidth: '380px',
  '& .MuiInputBase-root': {
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease-in-out',
    border: 'none',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    '&:hover': {
      backgroundColor: '#f8f9fa'
    },
    '&.Mui-focused': {
      backgroundColor: '#ffffff',
      boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
    },
    '&.Mui-error': {
      boxShadow: '0 0 0 2px rgba(211, 47, 47, 0.2)',
    }
  },
  '@media (max-width: 600px)': {
    maxWidth: '100%'
  }
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  '& .MuiSelect-select': {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
    fontSize: '0.85rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  '& .MuiSelect-icon': {
    color: theme.palette.primary.main,
    right: 6,
    fontSize: '1.2rem',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderRadius: '8px',
  },
  '&.MuiOutlinedInput-root': {
    paddingRight: '24px'  // Reduce right padding to make dropdown more compact
  }
}));

const ViewStatusChip = styled(Chip)(({ theme, status }) => ({
  fontSize: '0.6rem',
  height: 16,
  borderRadius: '10px',
  backgroundColor: status === 'valid' 
    ? alpha(theme.palette.success.main, 0.1)
    : status === 'invalid'
      ? alpha(theme.palette.error.main, 0.1)
      : alpha(theme.palette.grey[500], 0.1),
  color: status === 'valid'
    ? theme.palette.success.dark
    : status === 'invalid'
      ? theme.palette.error.dark
      : theme.palette.grey[600],
  '& .MuiChip-icon': {
    fontSize: '0.7rem',
    color: 'inherit',
    marginLeft: 2,
    marginRight: -3
  },
  '& .MuiChip-label': {
    padding: '0 3px',
    fontWeight: 600
  }
}));

const ViewName = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  overflow: 'hidden',
  marginRight: theme.spacing(0.5),
}));

const ViewDisplayName = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '0.82rem',
  color: theme.palette.text.primary,
  lineHeight: 1.2,
  paddingLeft: 1,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const ViewDbName = styled(Typography)(({ theme }) => ({
  fontSize: '0.68rem',
  fontWeight: 500,
  color: theme.palette.text.secondary,
  lineHeight: 1.1,
  marginTop: 2,
  paddingLeft: 1,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

/**
 * A modern component for selecting database views in the export workflow
 * 
 * @param {Object} props - Component props
 * @param {string} props.value - Selected view ID
 * @param {Function} props.onChange - Function to call when selection changes
 * @param {string} props.label - Label for the select input (default: "Select Export View")
 * @param {Function} props.onValidationChange - Optional callback for when validation status changes
 */
const ExportViewSelector = ({ 
  value, 
  onChange, 
  label = "Select Export View",
  onValidationChange 
}) => {
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationStatus, setValidationStatus] = useState('pending'); // 'pending', 'valid', 'invalid'
  const [validationError, setValidationError] = useState(null);
  const [validating, setValidating] = useState(false);
  const { connectionDetails } = useAuth();
  
  // Fetch available views
  useEffect(() => {
    const fetchViews = async () => {
      setLoading(true);
      try {
        const response = await api.getViews();
        setViews(response.export || []);
        setError(null);
        
        // If no view is selected and views are available, select the first one
        if (!value && response.export && response.export.length > 0) {
          onChange(response.export[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch views:', err);
        setError('Failed to load available views');
      } finally {
        setLoading(false);
      }
    };

    fetchViews();
  }, [onChange, value]);

  // Validate view when selected
  useEffect(() => {
    const validateView = async () => {
      if (!value || !connectionDetails) {
        setValidationStatus('pending');
        return;
      }
      
      setValidating(true);
      setValidationError(null);
      setValidationStatus('pending');
        try {
        // Validate view exists in database
        const result = await validateViewExists(connectionDetails, value, 'export');
        
        if (result.success) {
          setValidationStatus('valid');
        } else {
          setValidationStatus('invalid');
          setValidationError(result.message);
        }
        
        // Notify parent component about validation status change if callback provided
        if (onValidationChange) {
          onValidationChange(result.success ? 'valid' : 'invalid');
        }
      } catch (err) {
        console.error('View validation error:', err);
        setValidationStatus('invalid');
        setValidationError('Error validating view existence');
        
        // Notify parent component about validation status change if callback provided
        if (onValidationChange) {
          onValidationChange('invalid');
        }
      } finally {
        setValidating(false);
      }
    };

    validateView();
  }, [value, connectionDetails]);

  // Render validation chip based on status
  const renderStatusChip = () => {
    if (validating) {
      return <CircularProgress size={12} />;
    }
    
    switch(validationStatus) {
      case 'valid':
        return (
          <ViewStatusChip 
            status="valid" 
            label="Valid" 
            size="small" 
            icon={<CheckCircleOutline style={{ fontSize: '0.75rem' }} />}
          />
        );
      case 'invalid':
        return (
          <ViewStatusChip 
            status="invalid" 
            label="Invalid" 
            size="small" 
            icon={<ErrorOutline style={{ fontSize: '0.75rem' }} />}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', height: 44, pl: 1.5, maxWidth: '380px' }}>
        <CircularProgress size={14} sx={{ mr: 1.5 }} />
        <Typography variant="body2" fontSize="0.8rem">Loading views...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const selectedView = views.find(v => v.id === value);

  return (
    <Box sx={{ width: '100%', maxWidth: '380px' }}>      
      <Box sx={{ mb: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center',
            fontSize: '0.9rem',
            color: '#1a365d',
            fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
            letterSpacing: '0.3px',
          }}
        >
          {label}
          <Tooltip title="Select a database view to export data from">
            <Info sx={{ fontSize: 14, ml: 0.5, color: 'text.secondary', opacity: 0.7 }} />
          </Tooltip>
        </Typography>
        
        {!loading && selectedView && !validating && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.75 }}>
            {renderStatusChip()}
          </Box>
        )}
        {validating && (
          <CircularProgress size={10} sx={{ ml: 0.75 }} />
        )}
      </Box>
      
      <StyledFormControl error={validationStatus === 'invalid'}>
        <StyledSelect
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          displayEmpty
          IconComponent={KeyboardArrowDown}
          startAdornment={
            <ViewColumn 
              sx={{ 
                color: 'primary.main', 
                mr: 0.75, 
                ml: 0.5, 
                opacity: 0.8,
                fontSize: '0.9rem' 
              }} 
            />
          }
          endAdornment={validating && <CircularProgress size={12} sx={{ mr: 1 }} />}
          renderValue={() => (
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
              {selectedView ? (
                <ViewName sx={{ overflow: 'hidden', width: '100%' }}>
                  <ViewDisplayName sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedView.name}
                  </ViewDisplayName>
                  <ViewDbName sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    View: {selectedView.value}
                  </ViewDbName>
                </ViewName>
              ) : (
                <Typography sx={{ color: 'text.secondary', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  Select a view
                </Typography>
              )}
            </Box>
          )}
          MenuProps={{
            PaperProps: {
              sx: {
                maxHeight: 260,
                maxWidth: '380px',
                width: '100%',
                mt: 0.5,
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                '& .MuiMenuItem-root': {
                  py: 1,
                  px: 1.5,
                  minHeight: 'auto',
                  transition: 'background-color 0.15s ease-in-out',
                  borderBottom: '1px solid rgba(0,0,0,0.03)',
                  '&:last-child': {
                    borderBottom: 'none'
                  },
                  '&:hover': {
                    backgroundColor: alpha('#2196f3', 0.05)
                  },
                  '&.Mui-selected': {
                    backgroundColor: alpha('#2196f3', 0.08),
                    '&:hover': {
                      backgroundColor: alpha('#2196f3', 0.12)
                    },
                  }
                }
              }
            },
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: 'left',
            },
            transformOrigin: {
              vertical: 'top',
              horizontal: 'left',
            }
          }}
        >
          {views.map((view) => (
            <MenuItem key={view.id} value={view.id} sx={{ 
              overflow: 'hidden',
              py: 0.75
            }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                width: '100%', 
                overflow: 'hidden',
                pl: 1
              }}>
                <Typography variant="body2" sx={{ 
                  fontWeight: 700, 
                  lineHeight: 1.3, 
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  mb: 0.75
                }}>
                  {view.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ 
                  fontSize: '0.65rem', 
                  fontWeight: 500,
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  borderLeft: '2px solid',
                  borderColor: 'rgba(25, 118, 210, 0.4)',
                  pl: 1.5,
                  letterSpacing: '0.2px'
                }}>
                  {view.value}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </StyledSelect>
      </StyledFormControl>
      
      {validationError && (
        <Alert 
          severity="error"
          icon={<ErrorOutline sx={{ fontSize: '0.75rem' }} />}
          sx={{ 
            mt: 0.5, 
            alignItems: 'center',
            fontSize: '0.7rem',
            py: 0.25,
            px: 1,
            maxWidth: '380px',
            border: '1px solid',
            borderColor: 'error.light',
            borderRadius: '4px',
            '& .MuiAlert-icon': {
              paddingTop: '2px',
              paddingBottom: '2px',
              marginRight: '4px'
            },
            '& .MuiAlert-message': {
              padding: '2px 0',
              fontWeight: 500
            }
          }}
        >
          {validationError}
        </Alert>
      )}
    </Box>
  );
};

export default ExportViewSelector;
