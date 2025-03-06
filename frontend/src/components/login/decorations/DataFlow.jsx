import React from 'react';
import { Box } from '@mui/material';

/**
 * Data flow component for decorative purposes on the login page
 * @param {Object} props - Component props
 * @param {Object} props.style - Additional styles to apply
 */
const DataFlow = ({ style }) => (
  <Box
    sx={{
      position: "absolute",
      height: "2px",
      background: "linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.1))",
      animation: "dataFlow 4s linear infinite",
      "@keyframes dataFlow": {
        "0%": { backgroundPosition: "0% 0%" },
        "100%": { backgroundPosition: "200% 0%" },
      },
      backgroundSize: "200% 100%",
      ...style,
    }}
  />
);

export default DataFlow;