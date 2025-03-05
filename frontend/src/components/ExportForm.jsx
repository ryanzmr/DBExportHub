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
import { commonTextFieldStyle, formContainerStyles, cardHeaderStyles } from '../pages/styles/ExportPageStyles';

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
  const styles = formContainerStyles(theme);
  const headerStyles = cardHeaderStyles(theme);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  return (
    <>
      <Box sx={headerStyles.cardHeader}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SaveAlt sx={{ color: theme.palette.primary.main, mr: 2, fontSize: 28 }} />
          <Typography variant="h6" sx={headerStyles.cardHeaderTitle}>
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
            <Typography variant="body1" sx={headerStyles.advancedOptionsLabel}>
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
          disabled={!previewDataExists || (isOperationInProgress && !exporting)}
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
    </>
  );
};

export default ExportForm;