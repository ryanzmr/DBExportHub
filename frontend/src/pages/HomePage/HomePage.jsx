import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  useTheme
} from '@mui/material';
import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  StorageOutlined,
  DataObjectOutlined
} from '@mui/icons-material';

import { useAuth } from '../../App';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';

const CompactFeatureCard = ({ title, description, icon, actionText, onClick, color }) => {
  return (
    <Card
      elevation={1}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        border: '1px solid',
        borderColor: 'rgba(0, 0, 0, 0.08)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
          '& .card-icon': {
            color: color
          }
        }
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          bgcolor: color
        }}
      />

      <CardContent sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        p: 2.5
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            className="card-icon"
            sx={{
              mr: 1.5,
              color: 'text.secondary',
              transition: 'color 0.2s ease-in-out',
              display: 'flex'
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="h6"
            component="h2"
            sx={{
              fontWeight: 600,
              fontSize: '1.1rem',
              color: 'text.primary'
            }}
          >
            {title}
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mb: 2,
            lineHeight: 1.5
          }}
        >
          {description}
        </Typography>

        <Box sx={{ mt: 'auto' }}>
          <Button
            variant="outlined"
            size="medium"
            onClick={onClick}
            sx={{
              borderRadius: '6px',
              textTransform: 'none',
              fontWeight: 500,
              borderColor: color,
              color: color,
              '&:hover': {
                borderColor: color,
                bgcolor: `${color}10`
              }
            }}
          >
            {actionText}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const { connectionDetails } = useAuth();
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: '#f8f9fa'
      }}
    >
      <Box sx={{ boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
        <Header title="DBExportHub" />
      </Box>

      <Container maxWidth="lg" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: 2 }}>
          <Navigation />
        </Box>

        {/* Welcome Section - Compact */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: '8px',
            border: '1px solid',
            borderColor: 'rgba(0, 0, 0, 0.08)',
            bgcolor: 'white'
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography
                variant="h5"
                component="h1"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 1,
                  fontSize: { xs: '1.5rem', sm: '1.75rem' }
                }}
              >
                Welcome to DBExportHub
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 0 }}
              >
                Your centralized platform for database management operations. Select a feature below to get started.
              </Typography>
            </Grid>

            {connectionDetails && (
              <Grid item xs={12} md={5}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1.5,
                    borderRadius: '6px',
                    bgcolor: 'rgba(0, 0, 0, 0.02)',
                    border: '1px solid',
                    borderColor: 'rgba(0, 0, 0, 0.06)'
                  }}
                >
                  <StorageOutlined sx={{ color: 'text.secondary', mr: 1.5, fontSize: '1.25rem' }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                      Connected to: {connectionDetails.server || connectionDetails.hostname}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                      Database: {connectionDetails.database}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Feature Cards - Compact Layout */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <CompactFeatureCard
              title="Export Data"
              description="Export your database data in various formats with customizable filtering options and column selection."
              icon={<CloudDownloadOutlined sx={{ fontSize: '1.5rem' }} />}
              actionText="Start Export"
              onClick={() => navigate('/export')}
              color={theme.palette.primary.main}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <CompactFeatureCard
              title="Import Data"
              description="Import data from external sources into your database with validation, error handling, and progress tracking."
              icon={<CloudUploadOutlined sx={{ fontSize: '1.5rem' }} />}
              actionText="Start Import"
              onClick={() => navigate('/import')}
              color={theme.palette.secondary.main}
            />
          </Grid>
        </Grid>

        {/* Quick Stats Section */}
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ my: 3 }} />

          <Typography
            variant="subtitle1"
            sx={{
              mb: 2,
              fontWeight: 600,
              color: 'text.primary',
              fontSize: '1rem'
            }}
          >
            System Information
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: 'rgba(0, 0, 0, 0.08)',
                  bgcolor: 'white'
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'primary.light',
                      color: 'white'
                    }}
                  >
                    <DataObjectOutlined />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Database Type
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      SQL Server
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: 'rgba(0, 0, 0, 0.08)',
                  bgcolor: 'white'
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'success.light',
                      color: 'white'
                    }}
                  >
                    <StorageOutlined />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Connection Status
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Connected
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: 'rgba(0, 0, 0, 0.08)',
                  bgcolor: 'white'
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'info.light',
                      color: 'white'
                    }}
                  >
                    <CloudDownloadOutlined />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Available Operations
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Export, Import
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>

      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          mt: 'auto',
          bgcolor: 'white',
          borderTop: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.08)'
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
          >
            DBExportHub — Streamlining Database Operations
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;