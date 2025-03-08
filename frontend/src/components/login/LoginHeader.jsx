import React from 'react';
import { Box, Typography } from '@mui/material';
import { Storage } from '@mui/icons-material'; // Changed from DataObject to Storage

const LoginHeader = () => {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        padding: { xs: "16px 24px", sm: "20px 32px" },
        display: "flex",
        alignItems: "center",
        zIndex: 10,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Box
          sx={{
            p: 0.7,
            borderRadius: 1.5,
            background: "linear-gradient(45deg, #4A3FEF, #5A4FFF)",
            boxShadow: "0 2px 8px rgba(90, 79, 255, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Storage // Changed icon component
            sx={{
              fontSize: 18,
              color: "#FFFFFF",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
            }}
          />
        </Box>
        
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 500,
            color: "#FFFFFF",
            letterSpacing: "0.02em",
            fontFamily: "'Inter', sans-serif",
            fontSize: "17px",
          }}
        >
          DBExportHub
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginHeader;