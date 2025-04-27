import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, useTheme, Zoom, Chip, Grid, Tooltip } from '@mui/material';
import { DataArray, BarChart, ShowChart, Warning } from '@mui/icons-material';

// Constants
const EXCEL_ROW_LIMIT = 1048576; // Excel's maximum row limit

/**
 * Component to display the total record count in a separate box with enhanced visual design
 * @param {Object} props - Component props
 * @param {number} props.totalRecords - Total count of records in database
 * @param {number} props.previewCount - Count of records in the preview
 */
const RecordCountBox = ({ totalRecords, previewCount }) => {
  const theme = useTheme();
  const [animate, setAnimate] = useState(false);
  const [counter, setCounter] = useState(0);
  
  // Check if record count exceeds Excel's limit
  const exceedsExcelLimit = totalRecords > EXCEL_ROW_LIMIT;

  // Animation effect when the component mounts or totalRecords changes
  useEffect(() => {
    setAnimate(true);
    
    // Animated counter effect
    if (totalRecords > 0) {
      // Reset counter first
      setCounter(0);
      
      // Determine increment based on total size (larger numbers use larger increments)
      const increment = Math.max(1, Math.floor(totalRecords / 100));
      const duration = 1500; // 1.5 seconds total animation
      const interval = 30; // update every 30ms
      const steps = duration / interval;
      const stepIncrement = Math.ceil(totalRecords / steps);
      
      let currentCount = 0;
      const timer = setInterval(() => {
        currentCount += stepIncrement;
        if (currentCount >= totalRecords) {
          setCounter(totalRecords);
          clearInterval(timer);
        } else {
          setCounter(currentCount);
        }
      }, interval);
      
      return () => clearInterval(timer);
    }
  }, [totalRecords]);

  if (!totalRecords) {
    return null;
  }

  // Format the counter value with thousand separators
  const formattedCounter = counter.toLocaleString();
  
  // Format the actual total with thousand separators
  const formattedTotal = totalRecords.toLocaleString();

  return (
    <Zoom in={animate} timeout={500}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 1.5, sm: 2 },
          mb: 2,
          borderRadius: 2,
          background: `linear-gradient(120deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
          boxShadow: `0 4px 20px 0 ${theme.palette.mode === 'dark' 
            ? 'rgba(0,0,0,0.3)' 
            : 'rgba(0,0,0,0.1)'}`,
          border: exceedsExcelLimit ? `2px solid ${theme.palette.warning.main}` : `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Background decoration */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: -20, 
            right: -15, 
            opacity: 0.03, 
            transform: 'rotate(10deg)',
            fontSize: 140
          }}
        >
          <BarChart />
        </Box>
        
        <Grid container spacing={1} alignItems="center">
          <Grid item>
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                bgcolor: exceedsExcelLimit ? theme.palette.warning.main : theme.palette.primary.light,
                color: theme.palette.primary.contrastText,
                borderRadius: '50%',
                p: 1,
                width: { xs: 40, sm: 45, md: 50 },
                height: { xs: 40, sm: 45, md: 50 }
              }}
            >
              {exceedsExcelLimit ? (
                <Warning sx={{ fontSize: { xs: 22, sm: 24, md: 28 }, color: 'white' }} />
              ) : (
                <DataArray sx={{ fontSize: { xs: 22, sm: 24, md: 28 } }} />
              )}
            </Box>
          </Grid>
          
          <Grid item xs>
            <Box sx={{ position: 'relative' }}>
              <Typography 
                variant="overline" 
                color="textSecondary"
                sx={{ 
                  display: 'block', 
                  fontWeight: 500,
                  letterSpacing: 1,
                  mb: 0.25,
                  fontSize: '0.7rem'
                }}
              >
                Total Records Found
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography 
                  variant="h5"
                  color={exceedsExcelLimit ? "warning.main" : "primary"}
                  sx={{ 
                    fontWeight: 700,
                    lineHeight: 1.2,
                    mb: 0.25,
                    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
                  }}
                >
                  {formattedCounter}
                </Typography>
                
                {exceedsExcelLimit && (
                  <Tooltip title={`Exceeds Excel's limit of ${EXCEL_ROW_LIMIT.toLocaleString()} rows`}>
                    <Warning 
                      color="warning" 
                      sx={{ ml: 1, verticalAlign: 'middle', fontSize: '1.2rem' }} 
                    />
                  </Tooltip>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
                <Chip
                  size="small"
                  icon={<ShowChart sx={{ fontSize: '0.9rem' }} />}
                  label="Complete Dataset"
                  color="secondary"
                  sx={{ height: 24, '& .MuiChip-label': { fontSize: '0.7rem', px: 1 } }}
                />
                
                {exceedsExcelLimit && (
                  <Chip
                    size="small"
                    icon={<Warning sx={{ fontSize: '0.9rem' }} />}
                    label="Exceeds Excel Limit"
                    color="warning"
                    sx={{ height: 24, '& .MuiChip-label': { fontSize: '0.7rem', px: 1 } }}
                  />
                )}
                
                {previewCount > 0 && (
                  <Chip
                    size="small"
                    label={`Preview: ${previewCount} records`}
                    variant="outlined"
                    color="primary"
                    sx={{ height: 24, '& .MuiChip-label': { fontSize: '0.7rem', px: 1 } }}
                  />
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Zoom>
  );
};

export default RecordCountBox;
