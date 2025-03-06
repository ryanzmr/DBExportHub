import React from 'react';
import { Box, Typography } from '@mui/material';
import { Dns, DataObject } from '@mui/icons-material';
import {
  FloatingText,
  DatabaseIcon,
  DataFlow,
  TableIcon,
  CircleDecoration,
  GlowingDot
} from './decorations';

/**
 * Background component for the login page with all decorative elements
 */
const LoginBackground = () => {
  return (
    <>
      {/* DBExportHub Logo in top-left corner */}
      <Box
        sx={{
          position: "absolute",
          top: { xs: 12, sm: 20 },
          left: { xs: 12, sm: 20 },
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          zIndex: 1,
          transform: { xs: "scale(0.9)", sm: "scale(1)" },
          transformOrigin: "left center",
        }}
      >
        <Box
          sx={{
            p: 0.7,
            borderRadius: 1.5,
            background: "linear-gradient(45deg, #1e40af, #3b82f6)",
            boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <DataObject
            sx={{
              fontSize: 18,
              color: "white",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
            }}
          />
        </Box>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            background: "linear-gradient(45deg, #fff, rgba(255,255,255,0.9))",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "0.02em",
            textShadow: "0 2px 10px rgba(59, 130, 246, 0.2)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "1.1rem",
          }}
        >
          DBExportHub
        </Typography>
      </Box>

      {/* Decorative Background Elements */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
          zIndex: 0,
          "&::before": {
            content: '""',
            position: "absolute",
            width: "200%",
            height: "200%",
            background: "radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 40%, rgba(30, 64, 175, 0.08) 0%, transparent 50%), linear-gradient(45deg, rgba(59, 130, 246, 0.03) 0%, transparent 75%)",
            animation: "rotate 30s linear infinite, wave 15s ease-in-out infinite",
          },
          "@keyframes rotate": {
            "0%": {
              transform: "translate(-50%, -50%) rotate(0deg)"
            },
            "100%": {
              transform: "translate(-50%, -50%) rotate(360deg)"
            }
          },
          "@keyframes wave": {
            "0%, 100%": {
              transform: "translate(-50%, -50%) scale(1)"
            },
            "50%": {
              transform: "translate(-50%, -50%) scale(1.1)"
            }
          },
          "@keyframes float": {
            "0%, 100%": {
              transform: "translateY(0px) rotate(0deg)"
            },
            "50%": {
              transform: "translateY(-20px) rotate(5deg)"
            }
          },
          "@keyframes pulse": {
            "0%, 100%": {
              opacity: 0.3
            },
            "50%": {
              opacity: 0.6
            }
          },
          "@keyframes dataFlow": {
            "0%": { backgroundPosition: "0% 0%" },
            "100%": { backgroundPosition: "200% 0%" }
          }
        }}
      >
        {/* Cloud Database Visualization */}
        <Box
          sx={{
            position: "absolute",
            top: "8%",
            right: "12%",
            width: "140px",
            height: "90px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            animation: "float 18s ease-in-out infinite",
          }}
        >
          {/* Cloud shape */}
          <Box
            sx={{
              width: "120px",
              height: "60px",
              borderRadius: "30px",
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(59, 130, 246, 0.15) 100%)",
              boxShadow: "0 0 20px rgba(59, 130, 246, 0.2)",
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(59, 130, 246, 0.15) 100%)",
                top: "-20px",
                left: "15px",
              },
              "&::after": {
                content: '""',
                position: "absolute",
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(59, 130, 246, 0.15) 100%)",
                top: "-25px",
                right: "15px",
              },
            }}
          />
          
          {/* Database cylinders under cloud */}
          <Box
            sx={{
              width: "80px",
              height: "15px",
              borderRadius: "5px 5px 0 0",
              background: "rgba(59, 130, 246, 0.2)",
              marginTop: "-5px",
              position: "relative",
              zIndex: 1,
              "&::after": {
                content: '""',
                position: "absolute",
                width: "80px",
                height: "15px",
                borderRadius: "0 0 5px 5px",
                background: "rgba(59, 130, 246, 0.15)",
                bottom: "-18px",
                left: 0,
              },
              "&::before": {
                content: '""',
                position: "absolute",
                width: "80px",
                height: "15px",
                background: "rgba(30, 64, 175, 0.2)",
                bottom: "-9px",
                left: 0,
              },
            }}
          />
          
          {/* Data transfer lines */}
          <DataFlow
            style={{
              width: "100px",
              backgroundSize: "200% 100%",
              bottom: "10px",
              left: "-80px",
              transform: "rotate(15deg)",
            }}
          />
          <DataFlow
            style={{
              width: "120px",
              backgroundSize: "200% 100%",
              bottom: "25px",
              right: "-100px",
              transform: "rotate(-20deg)",
            }}
          />
        </Box>
        
        {/* Server Rack Visualization */}
        <Box
          sx={{
            position: "absolute",
            bottom: "12%",
            left: "8%",
            width: "100px",
            height: "140px",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            borderRadius: "5px",
            background: "rgba(15, 23, 42, 0.3)",
            display: "flex",
            flexDirection: "column",
            padding: "5px",
            gap: "5px",
            animation: "float 15s ease-in-out infinite",
            boxShadow: "0 0 15px rgba(59, 130, 246, 0.1)",
          }}
        >
          {/* Server units */}
          {Array.from({ length: 5 }).map((_, i) => (
            <Box
              key={i}
              sx={{
                height: "20px",
                width: "100%",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "3px",
                background: "rgba(30, 64, 175, 0.2)",
                display: "flex",
                alignItems: "center",
                padding: "0 5px",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ 
                width: "5px", 
                height: "5px", 
                borderRadius: "50%", 
                background: i % 2 === 0 ? "rgba(59, 130, 246, 0.5)" : "rgba(74, 222, 128, 0.5)",
                boxShadow: i % 2 === 0 ? "0 0 5px rgba(59, 130, 246, 0.5)" : "0 0 5px rgba(74, 222, 128, 0.5)",
              }} />
              <Box sx={{ display: "flex", gap: "3px" }}>
                {Array.from({ length: 3 }).map((_, j) => (
                  <Box 
                    key={j}
                    sx={{ 
                      width: "3px", 
                      height: "8px", 
                      background: "rgba(255, 255, 255, 0.2)",
                    }} 
                  />
                ))}
              </Box>
            </Box>
          ))}
          
          {/* Connection to cloud */}
          <DataFlow
            style={{
              width: "150px",
              backgroundSize: "200% 100%",
              top: "30%",
              right: "-130px",
              transform: "rotate(-10deg)",
            }}
          />
        </Box>
        
        {/* API Gateway Visualization */}
        <Box
          sx={{
            position: "absolute",
            top: "35%",
            right: "25%",
            width: "80px",
            height: "80px",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            borderRadius: "10px",
            background: "rgba(15, 23, 42, 0.4)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            animation: "float 12s ease-in-out infinite",
            boxShadow: "0 0 15px rgba(59, 130, 246, 0.1)",
            "&::before": {
              content: '""',
              position: "absolute",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "rgba(59, 130, 246, 0.15)",
              top: "-15px",
              left: "20px",
            },
          }}
        />
        
        {/* Decorative elements */}
        <CircleDecoration
          style={{
            width: "200px",
            height: "200px",
            bottom: "-50px",
            left: "-50px",
          }}
        />
        <CircleDecoration
          style={{
            width: "300px",
            height: "300px",
            top: "-100px",
            right: "-100px",
          }}
        />
        
        {/* Floating database icons */}
        <DatabaseIcon
          style={{
            bottom: "25%",
            left: "30%",
          }}
        />
        <DatabaseIcon
          style={{
            top: "20%",
            left: "15%",
            transform: "scale(0.8) rotate(10deg)",
          }}
        />
        
        {/* Table icons */}
        <TableIcon
          style={{
            bottom: "30%",
            right: "15%",
          }}
        />
        <TableIcon
          style={{
            top: "25%",
            left: "40%",
            transform: "scale(0.7) rotate(-5deg)",
          }}
        />
        
        {/* Glowing dots */}
        <GlowingDot
          style={{
            top: "15%",
            left: "25%",
            width: "4px",
            height: "4px",
          }}
        />
        <GlowingDot
          style={{
            bottom: "20%",
            right: "30%",
            width: "6px",
            height: "6px",
          }}
        />
        <GlowingDot
          style={{
            top: "40%",
            right: "15%",
            width: "5px",
            height: "5px",
          }}
        />
        
        {/* Floating text elements */}
        <FloatingText
          style={{
            top: "20%",
            left: "20%",
          }}
          text="SELECT"
        />
        <FloatingText
          style={{
            bottom: "25%",
            right: "20%",
          }}
          text="EXPORT"
        />
      </Box>
    </>
  );
};

export default LoginBackground;