import React, { useState, useEffect, useContext } from 'react';
import { Box, Button, Container, Grid, Paper, TextField, Typography, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, Divider, IconButton, Collapse, LinearProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import PreviewIcon from '@mui/icons-material/Preview';
import { AuthContext } from '../contexts/AuthContext';
import { fetchPreviewData, exportData, handleDownload } from '../utils/exportUtils';

const ExportPage = () => {
  const { isAuthenticated, connectionDetails } = useContext(AuthContext);
  
  // Form state
  const [formData, setFormData] = useState({
    server: connectionDetails?.server || '',
    database: connectionDetails?.database || '',
    username: connectionDetails?.username || '',
    password: connectionDetails?.password || '',
    fromMonth: '',
    toMonth: '',
    hs: '',
    prod: '',
    iec: '',
    expCmp: '',
    forcount: '',
    forname: '',
    port: '',
    max_records: 100
  });
  
  // Update form data when connection details change
  useEffect(() => {
    if (connectionDetails) {
      setFormData(prev => ({
        ...prev,
        server: connectionDetails.server || prev.server,
        database: connectionDetails.database || prev.database,
        username: connectionDetails.username || prev.username,
        password: connectionDetails.password || prev.password
      }));
    }
  }, [connectionDetails]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle preview button click
  const handlePreview = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create an AbortController for cancellation support
      const controller = new AbortController();
      const signal = controller.signal;
      
      // Call the fetchPreviewData function from exportUtils
      const result = await fetchPreviewData(formData, signal);
      
      if (result && result.data) {
        setPreviewData(result.data);
        
        // Generate columns dynamically from the first data item
        if (result.data.length > 0) {
          const firstItem = result.data[0];
          const dynamicColumns = Object.keys(firstItem).map(key => ({
            field: key,
            headerName: key.replace(/_/g, ' ').toUpperCase(),
            flex: 1,
            minWidth: 150
          }));
          setColumns(dynamicColumns);
        }
      } else {
        setPreviewData([]);
        setColumns([]);
        setError(result.error || 'No data returned from preview');
      }
    } catch (err) {
      console.error('Preview error:', err);
      setError(`Error fetching preview data: ${err.message || 'Unknown error'}`);
      setPreviewData([]);
      setColumns([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle export button click
  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setError(null);
    
    try {
      // Create an AbortController for cancellation support
      const controller = new AbortController();
      const signal = controller.signal;
      
      const result = await exportData(formData, signal, (progress) => {
        setExportProgress(progress);
      });
      
      if (result && result.response) {
        // Once export is complete, trigger download
        handleDownload(result.response.data, result.response.headers, formData);
      } else if (result && result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('Export error:', err);
      setError(`Error during export: ${err.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Header component
  const ExportHeader = () => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Database Export Hub
      </Typography>
      <Typography variant="subtitle1" color="text.secondary">
        Export and preview data from SQL Server databases
      </Typography>
      <Divider sx={{ my: 2 }} />
    </Box>
  );

  // Form component
  const ExportForm = () => (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Connection Settings
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Server"
            name="server"
            value={formData.server}
            onChange={handleChange}
            margin="normal"
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Database"
            name="database"
            value={formData.database}
            onChange={handleChange}
            margin="normal"
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            margin="normal"
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
          />
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Export Parameters
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="From Month (YYYYMM)"
            name="fromMonth"
            value={formData.fromMonth}
            onChange={handleChange}
            margin="normal"
            required
            placeholder="202101"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="To Month (YYYYMM)"
            name="toMonth"
            value={formData.toMonth}
            onChange={handleChange}
            margin="normal"
            required
            placeholder="202112"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="HS Code"
            name="hs"
            value={formData.hs}
            onChange={handleChange}
            margin="normal"
            placeholder="7308"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Port"
            name="port"
            value={formData.port}
            onChange={handleChange}
            margin="normal"
            placeholder="JNPT"
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
        <Typography variant="subtitle1">Advanced Options</Typography>
        <IconButton onClick={() => setShowAdvanced(!showAdvanced)}>
          <ExpandMoreIcon sx={{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </IconButton>
      </Box>

      <Collapse in={showAdvanced}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Product"
              name="prod"
              value={formData.prod}
              onChange={handleChange}
              margin="normal"
              placeholder="%steel%"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="IEC"
              name="iec"
              value={formData.iec}
              onChange={handleChange}
              margin="normal"
              placeholder="1234567890"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Exporter Company"
              name="expCmp"
              value={formData.expCmp}
              onChange={handleChange}
              margin="normal"
              placeholder="%ltd%"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Foreign Country"
              name="forcount"
              value={formData.forcount}
              onChange={handleChange}
              margin="normal"
              placeholder="USA,UK"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Foreign Name"
              name="forname"
              value={formData.forname}
              onChange={handleChange}
              margin="normal"
              placeholder="%corp%"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Max Records"
              name="max_records"
              type="number"
              value={formData.max_records}
              onChange={handleChange}
              margin="normal"
              InputProps={{ inputProps: { min: 1, max: 1000 } }}
            />
          </Grid>
        </Grid>
      </Collapse>

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PreviewIcon />}
          onClick={handlePreview}
          disabled={loading || isExporting}
        >
          Preview Data
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={loading || isExporting || previewData.length === 0}
        >
          Export to Excel
        </Button>
      </Box>
    </Paper>
  );

  // Preview Table component
  const PreviewTable = () => (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Data Preview
        {previewData.length > 0 && (
          <Typography component="span" variant="subtitle2" sx={{ ml: 2 }}>
            ({previewData.length} records)
          </Typography>
        )}
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {isExporting && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Exporting data: {exportProgress}%
          </Typography>
          <LinearProgress variant="determinate" value={exportProgress} />
        </Box>
      )}

      {!loading && !error && previewData.length > 0 && (
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={previewData.map((row, index) => ({ id: index, ...row }))}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            density="compact"
            sx={{
              '& .MuiDataGrid-cell': {
                whiteSpace: 'normal',
                wordWrap: 'break-word'
              }
            }}
          />
        </Box>
      )}

      {!loading && !error && previewData.length === 0 && (
        <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No data to display. Please adjust your search parameters and click Preview.
        </Typography>
      )}
    </Paper>
  );

  return (
    <Container maxWidth="xl">
      <ExportHeader />
      <ExportForm />
      <PreviewTable />
    </Container>
  );
};

export default ExportPage;