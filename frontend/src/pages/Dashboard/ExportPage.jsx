import React, { useState, useRef, useEffect } from 'react';
import { Box, Card, CardContent, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


// Custom components
import ExportHeader from '../../components/dashboard/ExportHeader';
import ExportForm from '../../components/dashboard/ExportForm';
import PreviewTable from '../../components/dashboard/PreviewTable';
import RecordCountBox from '../../components/dashboard/RecordCountBox';
import DashboardFooter from '../../components/dashboard/DashboardFooter';

// Utilities and hooks
import { useAuth } from '../../App';
import {
  fetchPreviewData,
  generateExcelExport,
  handleExcelDownload,
  cleanupConnection,
  getFreshFormState
} from '../../utils/exportUtils';

const ExportPage = () => {
  const navigate = useNavigate();
  const { connectionDetails, logout, token, tokenExpiry } = useAuth();
  
  // Check token validity on component mount
  useEffect(() => {
    if (!token || new Date(tokenExpiry) <= new Date()) {
      logout();
      navigate('/login');
    }
  }, [token, tokenExpiry, logout, navigate]);
  
  // State management
  const [formData, setFormData] = useState(getFreshFormState());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportCancelled, setExportCancelled] = useState(false);
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);
  
  // Refs for cancellation
  const exportControllerRef = useRef(null);
  const previewControllerRef = useRef(null);
  
  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleReset = () => {
    setFormData(getFreshFormState());
    setError(null);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // API handlers
  const handlePreview = async () => {
    setLoading(true);
    setError('');
    setIsOperationInProgress(true);
    
    // Create an AbortController for the preview request
    previewControllerRef.current = new AbortController();
    const signal = previewControllerRef.current.signal;
    
    try {
      const response = await fetchPreviewData(connectionDetails, formData, signal);
      
      // Make sure we're handling the response data correctly
      if (response && Array.isArray(response.data)) {
        setPreviewData(response.data);
        setPreviewCount(response.count || response.data.length);
        setTotalRecords(response.total_records || 0);
      } else {
        console.error('Invalid preview data format:', response);
        setError('Invalid data format received from server');
        setPreviewData([]);
        setPreviewCount(0);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error('Preview error:', err);
      setPreviewData([]);
      setPreviewCount(0);
      setTotalRecords(0);
      
      if (err.name === 'AbortError' || err.name === 'CanceledError' || axios.isCancel(err)) {
        setError('Process canceled');
      } else if (err.response?.status === 401) {
        // Token expired
        logout();
        navigate('/login');
      } else {
        // Handle different types of errors
        let errorMessage = 'Error generating preview';
        
        // Custom error from our own error handling
        if (err instanceof Error && err.message) {
          errorMessage = err.message;
        } 
        // Error from axios response
        else if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        }
        // Database transaction log error
        else if (err.response?.data?.detail && 
                err.response.data.detail.includes('transaction log') && 
                err.response.data.detail.includes('full')) {
          errorMessage = 'Database Error: The SQL Server transaction log is full. Please contact your database administrator.';
        }
        
        setError(errorMessage);
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
      const response = await generateExcelExport(connectionDetails, formData, signal);
      
      // If export was cancelled, don't proceed with download
      if (exportCancelled) {
        return;
      }
      
      // Check if we received a status response (might be from Excel row limit handling)
      if (response && response.status) {
        if (response.status === 'cancelled') {
          // User chose to cancel the export when row limit was exceeded
          setError(response.message || 'Export cancelled');
          return;
        } else if (response.status === 'error') {
          // An error occurred during export
          setError(response.message || 'An error occurred during export');
          return;
        } else if (response.status === 'completed') {
          // Export completed successfully (partial export)
          // No need to do anything, the download should have been triggered
          return;
        }
      }
      
      // Handle the download for normal successful exports
      handleExcelDownload(response, formData);
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
        await cleanupConnection(connectionDetails);
      } catch (cleanupErr) {
        console.error('Cleanup error:', cleanupErr);
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
  
  return (
    <Box sx={{ pb: 4, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ExportHeader 
        connectionDetails={connectionDetails} 
        onLogout={handleLogout} 
      />
      
      <Box sx={{ flex: 1 }}>
        <Grid container spacing={3} sx={{ flexDirection: 'column' }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <ExportForm 
                  formData={formData}
                  handleChange={handleChange}
                  handlePreview={handlePreview}
                  handleExport={handleExport}
                  handleCancel={handleCancel}
                  handleReset={handleReset}
                  loading={loading}
                  exporting={exporting}
                  isOperationInProgress={isOperationInProgress}
                  error={error}
                  previewDataExists={previewData.length > 0}
                />
              </CardContent>
            </Card>
          </Grid>

          {totalRecords > 0 && (
            <Grid item xs={12}>
              <RecordCountBox totalRecords={totalRecords} />
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <PreviewTable 
                  previewData={previewData}
                  previewCount={previewCount}
                  loading={loading}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      <DashboardFooter />
    </Box>
  );
};

export default ExportPage;