import React from 'react';
import { Box } from '@mui/material';
import { Storage, AutoAwesome, ArrowDownward } from '@mui/icons-material';

/**
 * Feature icon box component with animated storage icon and decorative elements
 */
const FeatureIconBox = () => {
  return (
    <Box
      sx={{
        width: 120,
        height: 120,
        position: "relative",
        mb: 2.5,
        "&:hover": {
          transform: "scale(1.05)",
          transition: "transform 0.2s ease-in-out",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          borderRadius: 3,
          background: "linear-gradient(135deg, rgba(90, 79, 255, 0.08), rgba(90, 79, 255, 0.02))",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(90, 79, 255, 0.15)",
        }}
      >
        <Storage 
          sx={{ 
            fontSize: 64,
            color: "#5A4FFF",
            opacity: 0.9
          }} 
        />
        <Box
          sx={{
            position: "absolute",
            left: -8,
            top: -8,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #5A4FFF, #4A3FEF)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 8px rgba(90, 79, 255, 0.25)",
          }}
        >
          <AutoAwesome
            sx={{ 
              fontSize: 20,
              color: "#FFFFFF",
            }} 
          />
        </Box>
        <Box
          sx={{
            position: "absolute",
            right: -8,
            bottom: -8,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #5A4FFF, #4A3FEF)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 8px rgba(90, 79, 255, 0.25)",
          }}
        >
          <ArrowDownward 
            sx={{ 
              fontSize: 20,
              color: "#FFFFFF",
            }} 
          />
        </Box>
      </Box>
    </Box>
  );
};

export default FeatureIconBox;