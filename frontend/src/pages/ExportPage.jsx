import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Import extracted components
import ExportHeader from '../components/ExportHeader';
import ExportForm from '../components/ExportForm';
import PreviewTable from '../components/PreviewTable';

// Import utility functions
import { fetchPreviewData, exportData, handleDownload, cleanupConnection, createFreshFormState } from '../utils/exportUtils';

/**
 * ExportPage component - Main page for data export functionality
 * @returns {JSX.Element} - Rendered component
 */
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
  
  // Initial form state
  const initialFormState = {
    fromMonth: null,
    toMonth: null,
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
  
  // Component state
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportCancelled, setExportCancelled] = useState(false);
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);
  
  // Refs for cancellation
  const exportControllerRef = useRef(null);
  const previewControllerRef = useRef(null);
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Handle preview data fetch
  const handlePreview = async () => {
    setLoading(true);
    setError('');
    setIsOperationInProgress(true);
    
    // Create an AbortController for the preview request
    previewControllerRef.current = new AbortController();
    const signal = previewControllerRef.current.signal;
    
    try {
      const result = await fetchPreviewData(connectionDetails, formData, signal);
      
      if (result.error) {
        setError(result.error);
        setPreviewData([]);
        setPreviewCount(0);
        
        if (result.authError) {
          logout();
          navigate('/login');
        }
      } else {
        setPreviewData(result.data);
        setPreviewCount(result.count);
      }
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
      previewControllerRef.current = null;
    }
  };
  
  // Handle data export
  const handleExport = async () => {
    setExporting(true);
    setError('');
    setExportCancelled(false);
    setIsOperationInProgress(true);
    
    exportControllerRef.current = new AbortController();
    const signal = exportControllerRef.current.signal;
    
    try {
      const result = await exportData(connectionDetails, formData, signal);
      
      if (result.error) {
        setError(result.error);
      } else if (!exportCancelled) {
        // Handle successful download
        handleDownload(result.response.data, result.response.headers, formData);
      }
    } finally {
      // Ensure connection cleanup even if export fails
      await cleanupConnection(connectionDetails);
      
      setExporting(false);
      setIsOperationInProgress(false);
      exportControllerRef.current = null;
    }
  };
  
  // Handle cancellation of operations
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
  
  // Handle form reset
  const handleReset = () => {
    const freshState = createFreshFormState(initialFormState);
    setFormData(freshState);
    setPreviewData([]);
    setPreviewCount(0);
    setError(null);
  };
  
  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <ExportHeader 
        connectionDetails={connectionDetails} 
        onLogout={handleLogout} 
      />
      
      {/* Main content */}
      <Grid container spacing={3} sx={{ flexDirection: 'column' }}>
        {/* Export Form */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <ExportForm 
                formData={formData}
                setFormData={setFormData}
                loading={loading}
                exporting={exporting}
                isOperationInProgress={isOperationInProgress}
                error={error}
                handlePreview={handlePreview}
                handleExport={handleExport}
                handleCancel={handleCancel}
                handleReset={handleReset}
                hasPreviewData={previewData.length > 0}
              />
            </CardContent>
          </Card>
        </Grid>
        
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
  );
};

export default ExportPage;