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
  Chip,
  FormControlLabel,
  Switch,
  Collapse
} from '@mui/material';
import LoadingButton from '../components/LoadingButton';
import { LogoutOutlined, RefreshOutlined, DownloadOutlined, PreviewOutlined, Storage, CancelOutlined, RestartAltOutlined, TableView, SaveAlt } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

// Add this near the top of the file, after the other imports
import { useEffect } from 'react';
import { CalendarMonth, Category, Description, Numbers, Business, Language, LocationOn, Person, LocalShipping } from '@mui/icons-material';

const ExportPage = () => {
  const navigate = useNavigate();
  const { connectionDetails, logout, token, tokenExpiry } = useAuth();
  const theme = useTheme();

  // Add this common style object
  // Update the commonTextFieldStyle
  const commonTextFieldStyle = {
    '& .MuiInputBase-root': { 
      height: '56px',
      backgroundColor: '#ffffff',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        backgroundColor: '#f8f9fa'
      },
      '&.Mui-focused': {
        backgroundColor: '#ffffff',
        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
      }
    },
    '& .MuiInputLabel-root': { 
      fontSize: '1.1rem',
      color: '#1a365d',
      fontWeight: 600,
      fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
      letterSpacing: '0.3px',
      transform: 'translate(14px, -12px) scale(0.75)',
      '&.MuiInputLabel-shrink': {
        transform: 'translate(14px, -12px) scale(0.75)',
      }
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(0, 0, 0, 0.23)',
      borderRadius: '8px',
      legend: {
        marginLeft: '4px'
      }
    },
    '& .MuiInputBase-input': {
      fontSize: '1.1rem',
      fontWeight: 600,
      color: '#000000',
      fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
      letterSpacing: '0.2px',
      padding: '16px 14px 16px 14px',
      '&::placeholder': {
        color: 'rgba(0, 0, 0, 0.6)',
        fontSize: '1.05rem',
        fontWeight: 500,
        opacity: 0.8
      }
    },
    '& .MuiInputAdornment-root': {
      marginTop: '0 !important',
      marginLeft: '8px'
    }
  };
  
  // Add state for advanced toggle
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Check token validity on component mount
  useEffect(() => {
    if (!token || new Date(tokenExpiry) <= new Date()) {
      logout();
      navigate('/login');
    }
  }, [token, tokenExpiry, logout, navigate]);
  
  const initialFormState = {
    fromMonth: null, // Changed to null for date picker
    toMonth: null,   // Changed to null for date picker
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
  const previewControllerRef = useRef(null);
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);
  
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
    setIsOperationInProgress(true);
    
    // Create an AbortController for the preview request
    previewControllerRef.current = new AbortController();
    const signal = previewControllerRef.current.signal;
    
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
      
      const response = await axios.post('http://localhost:8000/api/export/preview', requestData, {
        signal: signal
      });
      
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
      if (err.name === 'AbortError' || err.name === 'CanceledError' || axios.isCancel(err)) {
        setError('Process canceled');
      } else if (err.response?.status === 401) {
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
      setIsOperationInProgress(false);
      previewControllerRef.current = null;
    }
  };
  
  const handleExport = async () => {
    setExporting(true);
    setError('');
    setExportCancelled(false);
    setIsOperationInProgress(true);
    
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
      if (err.name === 'AbortError' || err.name === 'CanceledError' || axios.isCancel(err) || exportCancelled) {
        setError('Process canceled');
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
      setIsOperationInProgress(false);
      exportControllerRef.current = null;
    }
  };
  
  // Unified cancel function that handles both preview and export cancellations
  const handleCancel = () => {
    if (loading && previewControllerRef.current) {
      // Cancel preview operation
      previewControllerRef.current.abort();
      setLoading(false);
    } else if (exporting && exportControllerRef.current) {
      // Cancel export operation
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
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
          boxShadow: '0 3px 5px 2px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Storage sx={{ mr: 2, fontSize: 28 }} />
            <Typography 
              variant="h5" 
              component="div"
              sx={{
                fontWeight: 600,
                letterSpacing: '0.5px',
                fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
                textTransform: 'none'
              }}
            >
              DBExportHub
            </Typography>
            <Chip
              label={`${connectionDetails?.database} @ ${connectionDetails?.server}`}
              sx={{ 
                ml: 2, 
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                fontWeight: 500,
                fontSize: '0.875rem',
                '& .MuiChip-label': {
                  padding: '0 12px'
                }
              }}
            />
          </Box>
          <Button 
            color="inherit" 
            onClick={handleLogout} 
            startIcon={<LogoutOutlined />}
            sx={{ 
              borderRadius: 20,
              textTransform: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
              px: 3
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      {/* In the return statement, replace the Storage icon with SaveAlt */}
      <Grid container spacing={3} sx={{ flexDirection: 'column' }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, 
                borderBottom: `2px solid ${theme.palette.primary.main}`,
                p: 2,
                color: '#1a365d'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SaveAlt sx={{ color: theme.palette.primary.main, mr: 2, fontSize: 28 }} />
                  <Typography 
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      fontSize: '1.35rem',
                      letterSpacing: '0.3px',
                      color: '#1a365d'
                    }}
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
                width: '90%', 
                mx: 'auto', 
                mb: 2,
                p: 3,
                borderRadius: 2,
                background: 'white',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                border: '1px solid',
                borderColor: 'transparent',
                backgroundImage: `linear-gradient(white, white), linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
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
                  disabled={previewData.length === 0 || isOperationInProgress && !exporting}
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
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                mb: 3,
                borderBottom: `2px solid ${theme.palette.primary.main}`,
                p: 2,
                color: '#1a365d'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TableView sx={{ color: theme.palette.primary.main, mr: 2, fontSize: 26 }} />
                  <Typography 
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      fontSize: '1.25rem',
                      letterSpacing: '0.3px',
                      color: '#1a365d'
                    }}
                  >
                    Data Preview
                  </Typography>
                </Box>
                {previewCount > 0 && (
                  <Chip
                    label={`Total Records: ${previewCount}`}
                    color="primary"
                    variant="outlined"
                    sx={{ 
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      '& .MuiChip-label': {
                        padding: '0 12px'
                      }
                    }}
                  />
                )}
              </Box>
              
              {previewData.length > 0 ? (
                <TableContainer 
                component={Paper} 
                sx={{ 
                  maxHeight: 'calc(100vh - 400px)',
                  overflowY: 'auto',
                  overflowX: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                    height: '8px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: '4px',
                  }
                }}
              >
                <Table stickyHeader sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      {tableHeaders.map((header) => (
                        <TableCell 
                          key={header}
                          sx={{
                            fontWeight: 700,
                            backgroundColor: '#8bc1f7 !important', // Force the background color with !important
                            color: '#000000 !important', // Force black text with !important
                            position: 'sticky',
                            top: 0,
                            zIndex: 2,
                            padding: '12px 16px',
                            textAlign: 'center',
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            minWidth: '150px',
                            borderBottom: '2px solid #1565c0',
                            borderRight: '1px solid rgba(0, 0, 0, 0.1)',
                            '&.MuiTableCell-head': { // Target specifically the table header cells
                              color: '#000000 !important',
                              backgroundColor: '#8bc1f7 !important',
                              fontWeight: 700
                            }
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
                            backgroundColor: theme.palette.action.hover
                          },
                          '&:hover': {
                            backgroundColor: theme.palette.action.selected
                          }
                        }}
                      >
                        {tableHeaders.map((header) => {
                          const value = row[header];
                          const isNumeric = !isNaN(value) && value !== '' && value !== null;
                          
                          return (
                            <TableCell 
                              key={`${index}-${header}`}
                              sx={{
                                padding: '8px 16px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '300px',
                                borderRight: '1px solid rgba(224, 224, 224, 0.5)',
                                textAlign: isNumeric ? 'right' : 'left',
                                fontSize: '0.875rem',
                                color: '#000000', // Ensuring text is black
                                '&:last-child': {
                                  borderRight: 'none'
                                }
                              }}
                            >
                              {value !== null ? String(value) : ''}
                            </TableCell>
                          );
                        })}
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