import React from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
  Collapse,
  Typography,
  useTheme
} from '@mui/material';
import {
  CalendarMonth,
  Category,
  Description,
  Numbers,
  Business,
  Language,
  LocationOn,
  Person,
  LocalShipping,
  PreviewOutlined,
  DownloadOutlined,
  CancelOutlined,
  RestartAltOutlined,
  SaveAlt
} from '@mui/icons-material';
import { commonTextFieldStyle, formContainerStyles, cardHeaderStyles } from '../../pages/Dashboard/styles/DashboardStyles';
import ViewSelector from './ViewSelector';

/**
 * Form component for the Export page
 * @param {Object} props - Component props
 * @param {Object} props.formData - Form data state
 * @param {Function} props.handleChange - Form change handler
 * @param {Function} props.handlePreview - Preview handler
 * @param {Function} props.handleExport - Export handler
 * @param {Function} props.handleCancel - Cancel handler
 * @param {Function} props.handleReset - Reset handler
 * @param {boolean} props.loading - Loading state for preview
 * @param {boolean} props.exporting - Exporting state
 * @param {boolean} props.isOperationInProgress - Operation in progress state
 * @param {string} props.error - Error message
 * @param {boolean} props.previewDataExists - Whether preview data exists
 */
const ExportForm = ({
  formData,
  handleChange,
  handlePreview,
  handleExport,
  handleCancel,
  handleReset,
  loading,
  exporting,
  isOperationInProgress,
  error,
  previewDataExists
}) => {
  const theme = useTheme();
  const styles = formContainerStyles;
  const headerStyles = cardHeaderStyles(theme);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  return (
    <>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        mb: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        paddingBottom: 1.5
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SaveAlt sx={{ color: theme.palette.primary.main, mr: 1.5, fontSize: 24 }} />
          <Typography variant="h6" sx={{
            fontWeight: 600,
            color: theme.palette.primary.main,
            fontSize: '1.1rem'
          }}>
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
            <Typography variant="body2" sx={{
              fontWeight: 500,
              color: theme.palette.text.secondary,
              fontSize: '0.85rem'
            }}>
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

      <Box sx={{ mb: 3 }}>
        <ViewSelector 
          category="export" 
          value={formData.selectedView}
          onChange={(viewId) => handleChange({ target: { name: 'selectedView', value: viewId } })}
          label="Select Export View"
        />
      </Box>

      <Box sx={styles.formContainer}>
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
                label="Importer Country"
                name="country"
                value={formData.country}
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
                label="Port"
                name="port"
                value={formData.port}
                onChange={handleChange}
                fullWidth
                size="small"
                placeholder="Optional"
                InputProps={{
                  startAdornment: <LocationOn sx={{ color: theme.palette.primary.main, mr: 1, fontSize: 24 }} />
                }}
                sx={commonTextFieldStyle}
              />
            </Grid>

            <Grid item xs={3}>
              <TextField
                label="Importer Name"
                name="impName"
                value={formData.impName}
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
                label="Shipper"
                name="shipper"
                value={formData.shipper}
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

        <Box sx={styles.actionButtonsContainer}>
          {!exporting && (
            <Button
              variant="contained"
              color="primary"
              onClick={handlePreview}
              startIcon={loading ? <CircularProgress size={20} /> : <PreviewOutlined />}
              disabled={loading || exporting || isOperationInProgress}
              sx={styles.actionButton}
            >
              {loading ? 'Loading...' : 'Preview'}
            </Button>
          )}

          <Button
            variant="contained"
            color="success"
            onClick={handleExport}
            startIcon={exporting ? <CircularProgress size={20} /> : <DownloadOutlined />}
            disabled={loading || exporting || isOperationInProgress}
            sx={styles.actionButton}
          >
            {exporting ? 'Downloading...' : 'Download'}
          </Button>

          <Button
            variant="outlined"
            color="primary"
            onClick={handleReset}
            startIcon={<RestartAltOutlined />}
            sx={styles.actionButton}
            disabled={loading || exporting}
          >
            Reset
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleCancel}
            startIcon={<CancelOutlined />}
            sx={styles.actionButton}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default ExportForm;