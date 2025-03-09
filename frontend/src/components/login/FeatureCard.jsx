import React from 'react';
import { Box, Typography } from '@mui/material';
import { featureCardStyles } from '../../pages/styles/LoginPageStyles';

const FeatureCard = ({ icon, title, description }) => (
  <Box sx={featureCardStyles.card}>
    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
      <Box sx={featureCardStyles.iconContainer}>
        {icon}
      </Box>
      <Typography variant="h6" sx={featureCardStyles.title}>
        {title}
      </Typography>
    </Box>
    <Typography variant="body2" sx={featureCardStyles.description}>
      {description}
    </Typography>
  </Box>
);

export default React.memo(FeatureCard); // Optimize re-renders for static content