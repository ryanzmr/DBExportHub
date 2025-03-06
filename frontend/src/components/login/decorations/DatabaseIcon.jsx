import React from 'react';
import { Box } from '@mui/material';
import { Storage } from '@mui/icons-material';

/**
 * Database icon component for decorative purposes on the login page
 * @param {Object} props - Component props
 * @param {Object} props.style - Additional styles to apply
 */
const DatabaseIcon = ({ style }) => (
  <Box
    component="div"
    sx={{
      position: "absolute",
      width: "40px",
      height: "40px",
      borderRadius: "6px",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      animation: "float 15s ease-in-out infinite",
      ...style,
    }}
  >
    <Storage sx={{ fontSize: 20, color: "rgba(255, 255, 255, 0.2)" }} />
  </Box>
);

export default DatabaseIcon;