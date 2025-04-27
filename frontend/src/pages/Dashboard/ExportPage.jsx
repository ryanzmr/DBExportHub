import React, { useState, useRef, useEffect } from 'react';
import { Box, Card, CardContent, Grid, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Custom components
import ExportHeader from '../../components/dashboard/ExportHeader';
import ExportForm from '../../components/dashboard/ExportForm';
import PreviewTable from '../../components/dashboard/PreviewTable';
import RecordCountBox from '../../components/dashboard/RecordCountBox';
import DashboardFooter from '../../components/dashboard/DashboardFooter';
import ExcelRowLimitDialog from '../../components/dashboard/ExcelRowLimitDialog';
import Navigation from '../../components/Navigation';

// Utilities and hooks
import { useAuth } from '../../App';
import {
  fetchPreviewData,
  generateExcelExport,
  handleExcelDownload,
  cleanupConnection,
  getFreshFormState
} from '../../utils/exportUtils';

// Constants
const EXCEL_ROW_LIMIT = 1048576; // Excel's maximum row limit

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
  
  // Excel row limit dialog state
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  
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
        setTotalRecords(0);
      }
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
      previewControllerRef.current = null;
    }
  };
  
  // Function to execute the actual export
  const executeExport = async (forceContinue = false) => {
    exportControllerRef.current = new AbortController();
    const signal = exportControllerRef.current.signal;
    
    try {
      const response = await generateExcelExport(connectionDetails, formData, signal, forceContinue);
      
      // If export was cancelled, don't proceed with download
      if (exportCancelled) {
        return;
      }
      
      // Check if we got a limit_exceeded response
      if (response.status === 'limit_exceeded') {
        // Update totalRecords if not already set
        if (totalRecords !== response.total_records) {
          setTotalRecords(response.total_records);
        }
        
        // Show the dialog
        setShowLimitDialog(true);
        return;
      }
      
      // Handle the download
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
  
  const handleExport = async () => {
    setExporting(true);
    setError('');
    setExportCancelled(false);
    setIsOperationInProgress(true);
    
    // Check if we already have total records from a preview
    if (totalRecords > 0) {
      // Check if record count exceeds Excel limit
      if (totalRecords > EXCEL_ROW_LIMIT) {
        // Show the Excel row limit dialog
        setShowLimitDialog(true);
        return;
      }
    }
    
    // If no record count available or under the limit, proceed with export
    await executeExport(false);
  };
  
  // Handle dialog responses
  const handleDialogContinue = async () => {
    setShowLimitDialog(false);
    // User has chosen to continue despite the limit
    await executeExport(true);
  };
  
  const handleDialogCancel = () => {
    setShowLimitDialog(false);
    setExporting(false);
    setIsOperationInProgress(false);
  };
  
  // Cancel operation (both preview and export)
  const handleCancel = () => {
    // Cancel preview if it's in progress
    if (previewControllerRef.current) {
      previewControllerRef.current.abort();
      previewControllerRef.current = null;
    }
    
    // Cancel export if it's in progress
    if (exportControllerRef.current) {
      setExportCancelled(true);
      exportControllerRef.current.abort();
      exportControllerRef.current = null;
    }
    
    setLoading(false);
    setExporting(false);
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (previewControllerRef.current) {
        previewControllerRef.current.abort();
      }
      if (exportControllerRef.current) {
        exportControllerRef.current.abort();
      }
    };
  }, []);

  // Add console.log before return statement to debug props being passed to ExcelRowLimitDialog
  useEffect(() => {
    if (showLimitDialog) {
      console.log('Showing limit dialog with props:', {
        totalRecords,
        EXCEL_ROW_LIMIT
      });
    }
  }, [showLimitDialog, totalRecords]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box sx={{ mb: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <ExportHeader 
          connectionDetails={connectionDetails} 
          onLogout={handleLogout}
        />
      </Box>
      
      <Container maxWidth="xl" sx={{ mt: 3, mb: 3, px: {xs: 2, sm: 3} }}>
        <Box sx={{ mb: 2 }}>
          <Navigation />
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card elevation={2} sx={{ borderRadius: '8px', overflow: 'hidden' }}>
              <CardContent sx={{ p: 2 }}>
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
          
          {(previewData.length > 0 || totalRecords > 0) && (
            <Grid item xs={12}>
              <RecordCountBox 
                previewCount={previewCount} 
                totalRecords={totalRecords} 
              />
            </Grid>
          )}
          
          {previewData.length > 0 && (
            <Grid item xs={12}>
              <Card elevation={2} sx={{ borderRadius: '8px', overflow: 'hidden' }}>
                <CardContent sx={{ p: 2 }}>
                  <PreviewTable 
                    data={previewData} 
                    loading={loading}
                  />
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Container>
      
      <Box sx={{ mt: 'auto' }}>
        <DashboardFooter />
      </Box>
      
      {/* Excel Row Limit Dialog */}
      <ExcelRowLimitDialog 
        open={showLimitDialog}
        rowCount={totalRecords}
        rowLimit={EXCEL_ROW_LIMIT}
        onContinue={handleDialogContinue}
        onCancel={handleDialogCancel}
      />
    </Box>
  );
};

export default ExportPage;