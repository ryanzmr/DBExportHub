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
          p: { xs: 2, sm: 3 },
          mb: 3,
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
            top: -30, 
            right: -20, 
            opacity: 0.03, 
            transform: 'rotate(10deg)',
            fontSize: 180
          }}
        >
          <BarChart />
        </Box>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                bgcolor: exceedsExcelLimit ? theme.palette.warning.main : theme.palette.primary.light,
                color: theme.palette.primary.contrastText,
                borderRadius: '50%',
                p: 1.5,
                width: { xs: 48, sm: 56, md: 64 },
                height: { xs: 48, sm: 56, md: 64 }
              }}
            >
              {exceedsExcelLimit ? (
                <Warning sx={{ fontSize: { xs: 28, sm: 32, md: 36 }, color: 'white' }} />
              ) : (
                <DataArray sx={{ fontSize: { xs: 28, sm: 32, md: 36 } }} />
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
                  mb: 0.5
                }}
              >
                Total Records Found
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography 
                  variant="h4"
                  color={exceedsExcelLimit ? "warning.main" : "primary"}
                  sx={{ 
                    fontWeight: 700,
                    lineHeight: 1.2,
                    mb: 0.5,
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' }
                  }}
                >
                  {formattedCounter}
                </Typography>
                
                {exceedsExcelLimit && (
                  <Tooltip title={`Exceeds Excel's limit of ${EXCEL_ROW_LIMIT.toLocaleString()} rows`}>
                    <Warning 
                      color="warning" 
                      sx={{ ml: 1, verticalAlign: 'middle' }} 
                    />
                  </Tooltip>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                <Chip
                  size="small"
                  icon={<ShowChart />}
                  label="Complete Dataset"
                  color="secondary"
                />
                
                {exceedsExcelLimit && (
                  <Chip
                    size="small"
                    icon={<Warning />}
                    label="Exceeds Excel Limit"
                    color="warning"
                  />
                )}
                
                {previewCount > 0 && (
                  <Chip
                    size="small"
                    label={`Preview: ${previewCount} records`}
                    variant="outlined"
                    color="primary"
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
