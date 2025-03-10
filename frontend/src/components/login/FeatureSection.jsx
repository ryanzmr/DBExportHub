import React from 'react';
import { Box, Grid } from '@mui/material';
import { FlashOn, ShieldOutlined, TableRows, PreviewOutlined } from '@mui/icons-material';

// Custom components
import FeatureIconBox from './FeatureIconBox';
import FeatureHeading from './FeatureHeading';
import FeatureCard from './FeatureCard';

/**
 * Feature section component that displays the left side of the login page
 * Contains the feature icon, heading, description, and feature cards
 */
const FeatureSection = () => {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        pr: { md: 5 },
        mb: { xs: 4, md: 0 },
        mt: { xs: 4, md: 0 }, // Add top margin on mobile
        maxWidth: { xs: "100%", md: "55%" }
      }}
    >
      <FeatureIconBox />
      <FeatureHeading />
      
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6}>
          <FeatureCard
            icon={<FlashOn sx={{ color: "#5A4FFF", fontSize: 18 }} />}
            title="Fast Export"
            description="Export your data quickly with optimized SQL queries."
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FeatureCard
            icon={<PreviewOutlined sx={{ color: "#5A4FFF", fontSize: 18 }} />}
            title="Data Preview"
            description="Preview your data before exporting to ensure accuracy."
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FeatureCard
            icon={<ShieldOutlined sx={{ color: "#5A4FFF", fontSize: 18 }} />}
            title="Secure"
            description="Token-based authentication for secure database access."
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FeatureCard
            icon={<TableRows sx={{ color: "#5A4FFF", fontSize: 18 }} />}
            title="Formatted"
            description="Export to Excel with proper styling and formatting."
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default FeatureSection;