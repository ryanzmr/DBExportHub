import React from 'react';
import { Box } from '@mui/material';

/**
 * Circle decoration component for decorative purposes on the login page
 * @param {Object} props - Component props
 * @param {Object} props.style - Additional styles to apply
 */
const CircleDecoration = ({ style }) => (
  <Box
    sx={{
      position: "absolute",
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)",
      animation: "pulse 8s ease-in-out infinite",
      ...style,
    }}
  />
);

export default CircleDecoration;