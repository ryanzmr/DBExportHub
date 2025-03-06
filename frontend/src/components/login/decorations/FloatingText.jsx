import React from 'react';
import { Box } from '@mui/material';

/**
 * Floating text component for decorative purposes on the login page
 * @param {Object} props - Component props
 * @param {string} props.text - Text to display
 * @param {Object} props.style - Additional styles to apply
 */
const FloatingText = ({ text, style }) => (
  <Box
    sx={{
      position: "absolute",
      fontFamily: "monospace",
      color: "rgba(255, 255, 255, 0.1)",
      fontSize: "14px",
      whiteSpace: "nowrap",
      animation: "float 10s ease-in-out infinite",
      ...style,
    }}
  >
    {text}
  </Box>
);

export default FloatingText;