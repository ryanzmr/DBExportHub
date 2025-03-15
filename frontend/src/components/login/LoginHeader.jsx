import React from 'react';
import { Box, Typography } from '@mui/material';
import { Storage } from '@mui/icons-material';

const LoginHeader = () => (
  <Box
    sx={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      padding: { xs: "12px 16px", sm: "16px 20px" },
      display: "flex",
      alignItems: "center",
      zIndex: 20,
      height: { xs: "60px", sm: "70px" }
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
          p: 1.5,
          borderRadius: 2,
          background: "linear-gradient(45deg, #4A3FEF, #5A4FFF)",
          boxShadow: "0 3px 10px rgba(90, 79, 255, 0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Storage
          sx={{
            fontSize: 24,
            background: "linear-gradient(45deg, #4A3FEF, #5A4FFF)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.25))",
          }}
        />
      </Box>
      
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 500,
          color: "#FFFFFF",
          letterSpacing: "0.03em",
          fontFamily: "'Inter', sans-serif",
          fontSize: "20px",
        }}
      >
        DBExportHub
      </Typography>
    </Box>
  </Box>
);

export default LoginHeader;