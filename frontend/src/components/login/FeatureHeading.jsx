import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Feature heading component with title and description
 */
const FeatureHeading = () => {
  return (
    <>
      <Typography
        variant="h4"
        sx={{
          color: "white",
          fontWeight: 700,
          mb: 1,
          fontSize: { xs: "1.4rem", sm: "1.8rem" },
          lineHeight: 1.2,
          maxWidth: "90%"
        }}
      >
        Database Export Made Simple
      </Typography>
      
      <Typography
        variant="body1"
        sx={{
          color: "rgba(255, 255, 255, 0.7)",
          mb: 2.5,
          fontSize: { xs: "0.85rem", sm: "0.9rem" },
          maxWidth: 400,
          lineHeight: 1.4
        }}
      >
        Connect to your database and export data with ease. Our intuitive interface makes database management accessible to everyone.
      </Typography>
    </>
  );
};

export default FeatureHeading;