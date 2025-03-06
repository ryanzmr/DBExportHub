import React from 'react';
import { Box } from '@mui/material';

/**
 * Table icon component for decorative purposes on the login page
 * @param {Object} props - Component props
 * @param {Object} props.style - Additional styles to apply
 */
const TableIcon = ({ style }) => (
  <Box
    sx={{
      position: "absolute",
      width: "50px",
      height: "30px",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      borderRadius: "4px",
      display: "flex",
      flexDirection: "column",
      padding: "2px",
      animation: "float 12s ease-in-out infinite",
      ...style,
    }}
  >
    <Box sx={{ height: "6px", width: "100%", borderBottom: "1px solid rgba(255, 255, 255, 0.15)" }}></Box>
    <Box sx={{ height: "6px", width: "100%", borderBottom: "1px solid rgba(255, 255, 255, 0.15)" }}></Box>
    <Box sx={{ height: "6px", width: "100%" }}></Box>
  </Box>
);

export default TableIcon;