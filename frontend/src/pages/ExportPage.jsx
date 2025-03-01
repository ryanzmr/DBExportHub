import React, { useState } from 'react';
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
import { LogoutOutlined, RefreshOutlined, DownloadOutlined, PreviewOutlined, Storage } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

const ExportPage = () => {
  const navigate = useNavigate();
  const { connectionDetails, logout } = useAuth();
  const theme = useTheme();
  
  const [formData, setFormData] = useState({
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
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [exporting, setExporting] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handlePreview = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Combine connection details with form data
      const requestData = {
        ...connectionDetails,
        ...formData,
        preview_only: true,
        // Convert string values to integers for fromMonth and toMonth
        fromMonth: parseInt(formData.fromMonth),
        toMonth: parseInt(formData.toMonth)
      };
      
      const response = await axios.post('http://localhost:8000/api/preview', requestData);
      
      setPreviewData(response.data.data);
      setPreviewCount(response.data.count);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error generating preview');
      setPreviewData([]);
      setPreviewCount(0);
    } finally {
      setLoading(false);
    }
  };
  
  const handleExport = async () => {
    setExporting(true);
    setError('');
    
    try {
      // Combine connection details with form data
      const requestData = {
        ...connectionDetails,
        ...formData,
        preview_only: false,
        // Convert string values to integers for fromMonth and toMonth
        fromMonth: parseInt(formData.fromMonth),
        toMonth: parseInt(formData.toMonth)
      };
      
      // Use axios to download the file
      const response = await axios.post('http://localhost:8000/api/export', requestData, {
        responseType: 'blob'
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from content-disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'export.xlsx';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/i);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error exporting data');
    } finally {
      setExporting(false);
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
                <LoadingButton
                  variant="contained"
                  onClick={handlePreview}
                  loading={loading}
                  startIcon={<PreviewOutlined />}
                  sx={{ flex: 1 }}
                >
                  Preview
                </LoadingButton>
                
                <LoadingButton
                  variant="contained"
                  color="secondary"
                  onClick={handleExport}
                  loading={exporting}
                  disabled={previewData.length === 0}
                  startIcon={<DownloadOutlined />}
                  sx={{ flex: 1 }}
                >
                  Export
                </LoadingButton>
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