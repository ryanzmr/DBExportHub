import React from 'react';
import { Box } from '@mui/material';

/**
 * Glowing dot component for decorative purposes on the login page
 * @param {Object} props - Component props
 * @param {Object} props.style - Additional styles to apply
 */
const GlowingDot = ({ style }) => (
  <Box
    sx={{
      position: "absolute",
      width: "4px",
      height: "4px",
      borderRadius: "50%",
      background: "rgba(255, 255, 255, 0.6)",
      boxShadow: "0 0 8px 2px rgba(255, 255, 255, 0.3)",
      animation: "pulse 4s ease-in-out infinite",
      ...style,
    }}
  />
);

export default GlowingDot;