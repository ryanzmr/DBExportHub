import React, { useState, useRef, useEffect } from 'react';
import { Box, Card, CardContent, Grid, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Custom components
import ImportHeader from '../../../components/dashboard/ImportHeader';
import ImportForm from '../../../components/dashboard/ImportForm';
import PreviewTable from '../../../components/dashboard/PreviewTable';
import RecordCountBox from '../../../components/dashboard/RecordCountBox';
import DashboardFooter from '../../../components/dashboard/DashboardFooter';
import ExcelRowLimitDialog from '../../../components/dashboard/ExcelRowLimitDialog';
import Navigation from '../../../components/Navigation';

// Utilities and hooks
import { useAuth } from '../../../App';
import {
  fetchImportPreviewData,
  generateImportExcel,
  handleExcelDownload,
  cleanupConnection,
  getFreshImportFormState
} from '../../../utils/importUtils';

// Constants
const EXCEL_ROW_LIMIT = 1048576; // Excel's maximum row limit

const ImportPage = () => {
  const navigate = useNavigate();
  const { connectionDetails, logout, token, tokenExpiry } = useAuth();
    // Check token validity on component mount
  useEffect(() => {
    if (!token || new Date(tokenExpiry) <= new Date()) {
      logout();
      navigate('/login');
    }
  }, [token, tokenExpiry, logout, navigate]);
  
  // Listen for view validation status changes
  useEffect(() => {
    const handleViewValidation = (event) => {
      setViewValidationStatus(event.detail);
    };
    
    const handleDateRangeValidation = (event) => {
      setDateRangeValid(event.detail.isValid);
    };
    
    window.addEventListener('importViewValidation', handleViewValidation);
    window.addEventListener('importDateRangeValidation', handleDateRangeValidation);
    
    return () => {
      window.removeEventListener('importViewValidation', handleViewValidation);
      window.removeEventListener('importDateRangeValidation', handleDateRangeValidation);
    };
  }, []);
  // State management
  const [formData, setFormData] = useState({
    ...getFreshImportFormState(),
    selectedView: null, // Add selectedView field
  });
  const [viewValidationStatus, setViewValidationStatus] = useState('pending'); // 'pending', 'valid', 'invalid'
  const [dateRangeValid, setDateRangeValid] = useState(true);
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
    setFormData(getFreshImportFormState());
    setError(null);
  };
    const handleLogout = () => {
    logout();
    navigate('/login');
  };
    
  // API handlers  
  const handlePreview = async () => {
    // Check if the view is valid before proceeding
    if (viewValidationStatus === 'invalid') {
      setError('This view does not exist in the database. Please check with the DBA or select a different view.');
      return;
    }
    
    // Check if date range is valid
    if (!dateRangeValid) {
      setError('From Month must be earlier than or equal to To Month.');
      return;
    }
    
    setLoading(true);
    setError('');
    setIsOperationInProgress(true);
    
    // Create an AbortController for the preview request
    previewControllerRef.current = new AbortController();
    const signal = previewControllerRef.current.signal;
    
    try {
      const response = await fetchImportPreviewData(connectionDetails, formData, signal);
      
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
  const executeImport = async (forceContinue = false) => {
    setExporting(true);
    setError('');
    exportControllerRef.current = new AbortController();
    const signal = exportControllerRef.current.signal;
    
    try {
      console.log('Starting Excel import with parameters:', { ...formData, server: connectionDetails.server });
      
      // This will return a response object with data as Blob
      const response = await generateImportExcel(connectionDetails, formData, signal, forceContinue);
      console.log('Excel import response received:', { 
        status: response.status,
        hasData: !!response.data,
        dataType: response.data ? (response.data instanceof Blob ? 'Blob' : 
                    response.data instanceof ArrayBuffer ? 'ArrayBuffer' : 
                    typeof response.data) : 'none'
      });
      
      // If export was cancelled, don't proceed with download
      if (exportCancelled) {
        console.log('Export was cancelled, skipping download');
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
      
      // Use the utility function to handle the download
      console.log('Initiating Excel download...');
      
      // Use our dedicated download handler from importUtils.js
      // This now includes a non-intrusive toast notification instead of an alert
      handleExcelDownload(response, formData);
      
      console.log('Excel download process completed');
      
    } catch (err) {
      // Check if the error is due to cancellation
      if (err.name === 'AbortError' || err.name === 'CanceledError' || axios.isCancel(err) || exportCancelled) {
        setError('Process canceled');
      } else if (err.code === 'ECONNABORTED') {
        setError('Import timed out. Try narrowing your search criteria for a smaller dataset.');
      } else {
        setError(err.response?.data?.detail || 'Error importing data. The dataset might be too large.');
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
  };    const handleExport = async () => {
    // Check if the view is valid before proceeding
    if (viewValidationStatus === 'invalid') {
      setError('This view does not exist in the database. Please check with the DBA or select a different view.');
      return;
    }
    
    // Check if date range is valid
    if (!dateRangeValid) {
      setError('From Month must be earlier than or equal to To Month.');
      return;
    }
    
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
    await executeImport(false);
  };
  
  // Handle dialog responses
  const handleDialogContinue = async () => {
    setShowLimitDialog(false);
    // User has chosen to continue despite the limit
    await executeImport(true);
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

  // Debug props being passed to ExcelRowLimitDialog
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
        <ImportHeader 
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
                <ImportForm 
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

export default ImportPage;
