import React from 'react';
import { Box, Typography, Link } from '@mui/material';

const LoginFooter = () => {
  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 0.5,
        }}
      >
        <Link
          href="#"
          underline="hover"
          sx={{
            color: "#FFFFFF",
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Terms
        </Link>
        <Typography sx={{ color: "#FFFFFF", fontSize: "14px" }}>|</Typography>
        <Link
          href="#"
          underline="hover"
          sx={{
            color: "#FFFFFF",
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Privacy
        </Link>
        <Typography sx={{ color: "#FFFFFF", fontSize: "14px" }}>|</Typography>
        <Link
          href="#"
          underline="hover"
          sx={{
            color: "#FFFFFF",
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Help
        </Link>
      </Box>
      
      <Typography
        variant="body2"
        sx={{
          color: "rgba(255, 255, 255, 0.5)",
          fontSize: "12px",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        © 2025 DBExportHub
      </Typography>
    </Box>
  );
};

export default LoginFooter;