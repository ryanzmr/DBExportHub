import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  Collapse,
  useTheme
} from '@mui/material';
import { 
  SaveAlt, 
  PreviewOutlined, 
  DownloadOutlined, 
  CancelOutlined, 
  RestartAltOutlined,
  CalendarMonth,
  Category,
  Description,
  Numbers,
  Business,
  Language,
  LocationOn,
  Person,
  LocalShipping
} from '@mui/icons-material';
// Import shared styles
import { commonTextFieldStyle, sectionHeaderStyle, headerTypographyStyle, cardContainerStyle } from '../styles/formStyles';

/**
 * ExportForm component for handling export configuration
 * @param {Object} props - Component props
 * @param {Object} props.formData - Form data state
 * @param {Function} props.setFormData - Function to update form data
 * @param {boolean} props.loading - Loading state for preview
 * @param {boolean} props.exporting - Exporting state
 * @param {boolean} props.isOperationInProgress - Whether any operation is in progress
 * @param {string} props.error - Error message
 * @param {Function} props.handlePreview - Function to handle preview
 * @param {Function} props.handleExport - Function to handle export
 * @param {Function} props.handleCancel - Function to handle cancellation
 * @param {Function} props.handleReset - Function to handle form reset
 * @param {boolean} props.hasPreviewData - Whether preview data exists
 * @returns {JSX.Element} - Rendered component
 */
const ExportForm = ({
  formData,
  setFormData,
  loading,
  exporting,
  isOperationInProgress,
  error,
  handlePreview,
  handleExport,
  handleCancel,
  handleReset,
  hasPreviewData
}) => {
  const theme = useTheme();
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  
  // Using imported commonTextFieldStyle instead of defining inline
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  return (
    <Box>
      <Box sx={{ 
        ...sectionHeaderStyle,
        borderBottom: `2px solid ${theme.palette.primary.main}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SaveAlt sx={{ color: theme.palette.primary.main, mr: 2, fontSize: 28 }} />
          <Typography 
            variant="h6"
            sx={headerTypographyStyle}
          >
            Export Configuration
          </Typography>
        </Box>
        <FormControlLabel
          control={
            <Switch 
              checked={showAdvanced}
              onChange={(e) => setShowAdvanced(e.target.checked)}
              color="primary"
              size="small"
            />
          }
          label={
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 600,
                fontSize: '1rem',
                letterSpacing: '0.3px',
                color: '#1a365d'
              }}
            >
              Advanced Options
            </Typography>
          }
          sx={{ ml: 'auto' }}
        />
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ 
        ...cardContainerStyle,
        backgroundImage: `linear-gradient(white, white), linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
      }}>
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <TextField
              label="From Month"
              name="fromMonth"
              value={formData.fromMonth}
              onChange={handleChange}
              fullWidth
              size="small"
              required
              placeholder="YYYYMM"
              InputProps={{
                startAdornment: <CalendarMonth sx={{ color: theme.palette.primary.main, mr: 1, fontSize: 24 }} />
              }}
              sx={commonTextFieldStyle}
            />
          </Grid>
          
          <Grid item xs={3}>
            <TextField
              label="To Month"
              name="toMonth"
              value={formData.toMonth}
              onChange={handleChange}
              fullWidth
              size="small"
              required
              placeholder="YYYYMM"
              InputProps={{
                startAdornment: <CalendarMonth sx={{ color: theme.palette.primary.main, mr: 1, fontSize: 24 }} />
              }}
              sx={commonTextFieldStyle}
            />
          </Grid>

          <Grid item xs={3}>
            <TextField
              label="HS Code"
              name="hs"
              value={formData.hs}
              onChange={handleChange}
              fullWidth
              size="small"
              placeholder="Optional"
              InputProps={{
                startAdornment: <Numbers sx={{ color: theme.palette.primary.main, mr: 1, fontSize: 24 }} />
              }}
              sx={commonTextFieldStyle}
            />
          </Grid>

          <Grid item xs={3}>
            <TextField
              label="Product Description"
              name="prod"
              value={formData.prod}
              onChange={handleChange}
              fullWidth
              size="small"
              placeholder="Optional"
              InputProps={{
                startAdornment: <Description sx={{ color: theme.palette.primary.main, mr: 1, fontSize: 24 }} />
              }}
              sx={commonTextFieldStyle}
            />
          </Grid>
        </Grid>

        <Collapse in={showAdvanced} timeout="auto" unmountOnExit sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <TextField
                label="IEC"
                name="iec"
                value={formData.iec}
                onChange={handleChange}
                fullWidth
                size="small"
                placeholder="Optional"
                InputProps={{
                  startAdornment: <Category sx={{ color: theme.palette.primary.main, mr: 1, fontSize: 24 }} />
                }}
                sx={commonTextFieldStyle}
              />
            </Grid>

            <Grid item xs={3}>
              <TextField
                label="Exporter Company"
                name="expCmp"
                value={formData.expCmp}
                onChange={handleChange}
                fullWidth
                size="small"
                placeholder="Optional"
                InputProps={{
                  startAdornment: <Business sx={{ color: theme.palette.primary.main, mr: 1, fontSize: 24 }} />
                }}
                sx={commonTextFieldStyle}
              />
            </Grid>

            <Grid item xs={3}>
              <TextField
                label="Foreign Country"
                name="forcount"
                value={formData.forcount}
                onChange={handleChange}
                fullWidth
                size="small"
                placeholder="Optional"
                InputProps={{
                  startAdornment: <Language sx={{ color: theme.palette.primary.main, mr: 1, fontSize: 24 }} />
                }}
                sx={commonTextFieldStyle}
              />
            </Grid>

            <Grid item xs={3}>
              <TextField
                label="Foreign Importer"
                name="forname"
                value={formData.forname}
                onChange={handleChange}
                fullWidth
                size="small"
                placeholder="Optional"
                InputProps={{
                  startAdornment: <Person sx={{ color: theme.palette.primary.main, mr: 1, fontSize: 24 }} />
                }}
                sx={commonTextFieldStyle}
              />
            </Grid>

            <Grid item xs={3}>
              <TextField
                label="Port"
                name="port"
                value={formData.port}
                onChange={handleChange}
                fullWidth
                size="small"
                placeholder="Optional"
                InputProps={{
                  startAdornment: <LocalShipping sx={{ color: theme.palette.primary.main, mr: 1, fontSize: 24 }} />
                }}
                sx={commonTextFieldStyle}
              />
            </Grid>
          </Grid>
        </Collapse>
      </Box>
      
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handlePreview}
          startIcon={loading ? null : <PreviewOutlined />}
          disabled={isOperationInProgress && !loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Preview"}
        </Button>
        
        <Button
          variant="contained"
          color="secondary"
          onClick={handleExport}
          startIcon={exporting ? null : <DownloadOutlined />}
          disabled={!hasPreviewData || (isOperationInProgress && !exporting)}
        >
          {exporting ? <CircularProgress size={24} color="inherit" /> : "Export"}
        </Button>
        
        <Button
          variant="outlined"
          color="error"
          onClick={handleCancel}
          startIcon={<CancelOutlined />}
          disabled={!isOperationInProgress}
        >
          Cancel
        </Button>
        
        <Button
          variant="outlined"
          color="info"
          onClick={handleReset}
          startIcon={<RestartAltOutlined />}
          disabled={isOperationInProgress}
        >
          Reset
        </Button>
      </Box>
    </Box>
  );
};

export default ExportForm;