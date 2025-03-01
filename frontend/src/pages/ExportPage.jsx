import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  AppBar,
  Toolbar,
  useTheme,
  Chip
} from '@mui/material';
import LoadingButton from '../components/LoadingButton';
import { LogoutOutlined, RefreshOutlined, DownloadOutlined, PreviewOutlined, Storage, CancelOutlined, RestartAltOutlined } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

// Add this near the top of the file, after the other imports
import { useEffect } from 'react';

// Update the component to use the token
const ExportPage = () => {
  const navigate = useNavigate();
  const { connectionDetails, logout, token, tokenExpiry } = useAuth();
  const theme = useTheme();
  
  // Check token validity on component mount
  useEffect(() => {
    if (!token || new Date(tokenExpiry) <= new Date()) {
      logout();
      navigate('/login');
    }
  }, [token, tokenExpiry, logout, navigate]);
  
  const initialFormState = {
    fromMonth: new Date().getFullYear() * 100 + 1, // Default to current year January (YYYYMM)
    toMonth: new Date().getFullYear() * 100 + 12, // Default to current year December (YYYYMM)
    hs: '',
    prod: '',
    iec: '',
    expCmp: '',
    forcount: '',
    forname: '',
    port: '',
    preview_only: true,
    max_records: 100
  };
  
  const [formData, setFormData] = useState(initialFormState);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportCancelled, setExportCancelled] = useState(false);
  const exportControllerRef = useRef(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleReset = () => {
    // Create a fresh copy of initialFormState with current year values
    const freshState = {
      ...initialFormState,
      fromMonth: new Date().getFullYear() * 100 + 1,
      toMonth: new Date().getFullYear() * 100 + 12
    };
    setFormData(freshState);
    setPreviewData([]);
    setPreviewCount(0);
    setError(null);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Update API calls to use the token (axios interceptor should handle this automatically)
  // In the handlePreview function
  // Update the handlePreview function - don't call useAuth() inside it
  const handlePreview = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Use connectionDetails from the component scope, not from useAuth() call
      const requestData = {
        ...connectionDetails,
        ...formData,
        preview_only: true,
        fromMonth: parseInt(formData.fromMonth),
        toMonth: parseInt(formData.toMonth)
      };
      
      console.log('Preview request data:', requestData);
      
      const response = await axios.post('http://localhost:8000/api/preview', requestData);
      
      // Make sure we're handling the response data correctly
      if (response.data && Array.isArray(response.data.data)) {
        setPreviewData(response.data.data);
        setPreviewCount(response.data.count || response.data.data.length);
      } else {
        console.error('Invalid preview data format:', response.data);
        setError('Invalid data format received from server');
        setPreviewData([]);
        setPreviewCount(0);
      }
    } catch (err) {
      console.error('Preview error:', err);
      if (err.response?.status === 401) {
        // Token expired
        logout();
        navigate('/login');
      } else {
        // Make sure error is a string, not an object
        const errorMessage = typeof err.response?.data?.detail === 'string' 
          ? err.response?.data?.detail 
          : 'Error generating preview';
        setError(errorMessage);
        setPreviewData([]);
        setPreviewCount(0);
      }
    } finally {
      setLoading(false);
    }
  };
  const handleExport = async () => {
    setExporting(true);
    setError('');
    setExportCancelled(false);
    
    exportControllerRef.current = new AbortController();
    const signal = exportControllerRef.current.signal;
    
    try {
      // Add a progress indicator
      const progressIndicator = document.createElement('div');
      progressIndicator.style.position = 'fixed';
      progressIndicator.style.top = '50%';
      progressIndicator.style.left = '50%';
      progressIndicator.style.transform = 'translate(-50%, -50%)';
      progressIndicator.style.padding = '20px';
      progressIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      progressIndicator.style.color = 'white';
      progressIndicator.style.borderRadius = '5px';
      progressIndicator.style.zIndex = '9999';
      progressIndicator.textContent = 'Preparing export...';
      document.body.appendChild(progressIndicator);
      
      // Request data with pagination or chunking hint
      const requestData = {
        ...connectionDetails,
        ...formData,
        preview_only: false,
        fromMonth: parseInt(formData.fromMonth),
        toMonth: parseInt(formData.toMonth),
        useChunking: true,
        chunkSize: 5000,
        // Add cleanup flag
        cleanupConnection: true,
        sessionTimeout: 300, // 5 minutes in seconds
        excelFormat: {
          font: {
            name: "Times New Roman",
            size: 10,
            bold: false
          },
          headerStyle: {
            font: {
              name: "Times New Roman",
              size: 10,
              bold: true,
              color: "#FFFFFF"
            },
            fill: {
              type: "pattern",
              pattern: "solid",
              fgColor: "#4472C4"  // Blue header background from template
            },
            alignment: {
              horizontal: "center",
              vertical: "center",
              wrapText: true
            },
            border: {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" }
            }
          },
          columnWidths: {
            autoFit: true,
            minWidth: 10
          }
        }
      };
      const response = await axios.post('http://localhost:8000/api/export', requestData, {
        responseType: 'blob',
        signal: signal,
        timeout: 300000, // 5 minute timeout
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || progressEvent.loaded + 1000000));
          progressIndicator.textContent = `Downloading: ${percentCompleted}%`;
        }
      });
      
      // Remove progress indicator
      document.body.removeChild(progressIndicator);
      
      // If export was cancelled, don't proceed with download
      if (exportCancelled) {
        return;
      }
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from content-disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `export_${formData.fromMonth}_to_${formData.toMonth}.xlsx`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/i);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      // Check if the error is due to cancellation
      if (err.name === 'AbortError' || exportCancelled) {
        setError('Export was cancelled');
      } else if (err.code === 'ECONNABORTED') {
        setError('Export timed out. Try narrowing your search criteria for a smaller dataset.');
      } else {
        setError(err.response?.data?.detail || 'Error exporting data. The dataset might be too large.');
      }
    } finally {
      // Ensure connection cleanup even if export fails
      try {
        await axios.post('http://localhost:8000/api/cleanup', {
          ...connectionDetails,
          sessionId: connectionDetails.sessionId || Date.now().toString()
        });
      } catch (cleanupErr) {
        console.error('Cleanup error:', cleanupErr);
      }
      
      // Remove progress indicator if it still exists
      const progressIndicator = document.querySelector('div[style*="position: fixed"][style*="top: 50%"]');
      if (progressIndicator) {
        document.body.removeChild(progressIndicator);
      }
      
      setExporting(false);
      exportControllerRef.current = null;
    }
  };
  
  const handleCancelExport = () => {
    if (exportControllerRef.current) {
      exportControllerRef.current.abort();
      setExportCancelled(true);
    }
  };
  
  // Get table headers from the first row of preview data
  const tableHeaders = previewData.length > 0 ? Object.keys(previewData[0]) : [];
  
  return (
    <Box sx={{ pb: 4 }}>
      <AppBar 
        position="static" 
        sx={{
          mb: 4,
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Storage sx={{ mr: 2 }} />
            <Typography variant="h6" component="div">
              DBExportHub
            </Typography>
            <Chip
              label={`${connectionDetails?.database} @ ${connectionDetails?.server}`}
              sx={{ ml: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            />
          </Box>
          <Button 
            color="inherit" 
            onClick={handleLogout} 
            startIcon={<LogoutOutlined />}
            sx={{ borderRadius: 20 }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Storage sx={{ color: theme.palette.primary.main, mr: 2 }} />
                <Typography variant="h6">
                  Export Parameters
                </Typography>
              </Box>
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="From Month"
                    name="fromMonth"
                    value={formData.fromMonth}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    required
                    placeholder="YYYYMM"
                    helperText="Format: YYYYMM (e.g., 202301)"
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    label="To Month"
                    name="toMonth"
                    value={formData.toMonth}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    required
                    placeholder="YYYYMM"
                    helperText="Format: YYYYMM (e.g., 202312)"
                  />
                </Grid>
              </Grid>
              
              <TextField
                label="HS Code"
                name="hs"
                value={formData.hs}
                onChange={handleChange}
                fullWidth
                margin="normal"
                placeholder="Optional"
              />
              
              <TextField
                label="Product Description"
                name="prod"
                value={formData.prod}
                onChange={handleChange}
                fullWidth
                margin="normal"
                placeholder="Optional"
              />
              
              <TextField
                label="IEC"
                name="iec"
                value={formData.iec}
                onChange={handleChange}
                fullWidth
                margin="normal"
                placeholder="Optional"
              />
              
              <TextField
                label="Exporter Company"
                name="expCmp"
                value={formData.expCmp}
                onChange={handleChange}
                fullWidth
                margin="normal"
                placeholder="Optional"
              />
              
              <TextField
                label="Foreign Country"
                name="forcount"
                value={formData.forcount}
                onChange={handleChange}
                fullWidth
                margin="normal"
                placeholder="Optional"
              />
              
              <TextField
                label="Foreign Importer Name"
                name="forname"
                value={formData.forname}
                onChange={handleChange}
                fullWidth
                margin="normal"
                placeholder="Optional"
              />
              
              <TextField
                label="Port"
                name="port"
                value={formData.port}
                onChange={handleChange}
                fullWidth
                margin="normal"
                placeholder="Optional"
              />
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handlePreview}
                  startIcon={<PreviewOutlined />}
                  disabled={loading}
                  sx={{ flex: 1 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : "Preview"}
                </Button>
                
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleExport}
                  startIcon={<DownloadOutlined />}
                  disabled={previewData.length === 0 || exporting}
                  sx={{ flex: 1 }}
                >
                  {exporting && !exportCancelled ? <CircularProgress size={24} color="inherit" /> : "Export"}
                </Button>
                
                {exporting ? (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleCancelExport}
                    startIcon={<CancelOutlined />}
                    sx={{ flex: 1 }}
                  >
                    Cancel
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="info"
                    onClick={handleReset}
                    startIcon={<RestartAltOutlined />}
                    sx={{ flex: 1 }}
                  >
                    Reset
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">
                  Data Preview
                </Typography>
                {previewCount > 0 && (
                  <Chip
                    label={`Total Records: ${previewCount}`}
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
              
              {previewData.length > 0 ? (
                <TableContainer 
                component={Paper} 
                sx={{ 
                  maxHeight: 'calc(100vh - 300px)',
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                    height: '8px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: '4px',
                  },
                }}
              >
                <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        {tableHeaders.map((header) => (
                          <TableCell 
                          key={header}
                          sx={{
                            fontWeight: 'bold',
                            backgroundColor: theme.palette.primary.main,
                            color: 'white'
                          }}
                        >
                          {header}
                        </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewData.map((row, index) => (
                        <TableRow 
                        key={index}
                        sx={{
                          '&:nth-of-type(odd)': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                          {tableHeaders.map((header) => (
                            <TableCell key={`${index}-${header}`}>{row[header]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="textSecondary">
                    {loading ? 'Loading preview data...' : 'No preview data available. Click Preview to load data.'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExportPage;