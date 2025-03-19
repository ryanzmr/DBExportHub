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
                label="Importer Country"
                name="impCnt"
                value={formData.impCnt}
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
                name="impNm"
                value={formData.impNm}
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
                label="Mode of Transport"
                name="mode"
                value={formData.mode}
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

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handlePreview}
            disabled={loading || !formData.fromMonth || !formData.toMonth}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PreviewOutlined />}
            sx={{ mr: 2 }}
          >
            {loading ? 'Loading...' : 'Preview'}
          </Button>

          <Button
            variant="contained"
            color="success"
            onClick={handleExport}
            disabled={exporting || !formData.fromMonth || !formData.toMonth}
            startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadOutlined />}
            sx={{ mr: 2 }}
          >
            {exporting ? 'Exporting...' : 'Export to Excel'}
          </Button>

          <Button
            variant="outlined"
            color="error"
            onClick={handleCancel}
            startIcon={<CancelOutlined />}
            disabled={!isOperationInProgress}
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          
          <Button
            variant="outlined"
            onClick={handleReset}
            startIcon={<RestartAltOutlined />}
            disabled={isOperationInProgress}
          >
            Reset
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default ExportForm;