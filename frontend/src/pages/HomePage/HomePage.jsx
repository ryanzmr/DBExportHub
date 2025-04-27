import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button,
  Paper,
  Divider,
  useTheme,
  Chip
} from '@mui/material';
import { 
  CloudDownloadOutlined, 
  CloudUploadOutlined, 
  AnalyticsOutlined, 
  SettingsOutlined, 
  HelpOutlineOutlined,
  DashboardOutlined
} from '@mui/icons-material';

import { useAuth } from '../../App';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';

const FeatureCard = ({ title, description, icon, actionText, onClick, disabled = false }) => {
  const theme = useTheme();
  
  return (
    <Card 
      elevation={1}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        borderRadius: '8px',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.08)',
          ...(disabled ? {} : { cursor: 'pointer' })
        },
        position: 'relative',
        opacity: disabled ? 0.75 : 1,
        border: '1px solid',
        borderColor: theme.palette.divider
      }}
      onClick={disabled ? undefined : onClick}
    >
      {disabled && (
        <Chip
          label="Coming Soon"
          size="small"
          color="default"
          sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8,
            fontWeight: 500,
            fontSize: '0.65rem',
            height: 20
          }}
        />
      )}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1.5 }}>
        <Box sx={{ 
          mb: 1, 
          color: disabled ? theme.palette.text.secondary : theme.palette.grey[800], 
          fontSize: 32,
          p: 1,
          borderRadius: '50%',
          bgcolor: disabled ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.06)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {icon}
        </Box>
        <Typography variant="subtitle1" component="h2" gutterBottom align="center" sx={{ 
          fontWeight: 600, 
          color: disabled ? theme.palette.text.secondary : theme.palette.grey[800],
          mb: 0.5
        }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ fontSize: '0.8rem' }}>
          {description}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'center', py: 1, bgcolor: 'rgba(0,0,0,0.02)' }}>
        <Button 
          variant="contained" 
          color={disabled ? "inherit" : "primary"}
          onClick={disabled ? undefined : onClick}
          disabled={disabled}
          size="small"
          sx={{
            borderRadius: 1.5,
            textTransform: 'none',
            fontWeight: 500,
            px: 2,
            py: 0.5,
            fontSize: '0.8rem'
          }}
        >
          {actionText}
        </Button>
      </CardActions>
    </Card>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, connectionDetails } = useAuth();
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Header title="DBExportHub" />
      </Box>

      <Container maxWidth="xl" sx={{ mt: 2, mb: 2, px: {xs: 1.5, sm: 2} }}>
        <Box sx={{ mb: 1.5 }}>
          <Navigation />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Card elevation={1} sx={{ borderRadius: '8px', overflow: 'hidden' }}>
            <CardContent sx={{ p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" component="h1" gutterBottom sx={{ color: theme.palette.grey[800], fontWeight: 600, mb: 1 }}>
                    Welcome to DBExportHub
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 0 }}>
                    Your centralized hub for database management operations. Select a feature below to get started.
                  </Typography>
                </Grid>
                
                {connectionDetails && (
                  <Grid item xs={12} md={4}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 1.5, 
                        borderRadius: '6px',
                        bgcolor: 'rgba(0,0,0,0.02)',
                        border: '1px solid',
                        borderColor: theme.palette.divider
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.grey[700] }}>
                        Connected to: {connectionDetails.server || connectionDetails.hostname}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        Database: {connectionDetails.database}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
          <Typography 
            variant="subtitle1" 
            component="h2" 
            sx={{ 
              fontWeight: 600, 
              color: theme.palette.grey[800],
            }}
          >
            Available Features
          </Typography>
          <Divider sx={{ flexGrow: 1, ml: 2, borderColor: 'rgba(0,0,0,0.08)' }} />
        </Box>
        
        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FeatureCard 
              title="Export Data" 
              description="Export your database data in various formats with customizable options."
              icon={<CloudDownloadOutlined fontSize="inherit" />}
              actionText="Go to Export"
              onClick={() => navigate('/export')}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FeatureCard 
              title="Import Data" 
              description="Import data from different sources into your database with validation."
              icon={<CloudUploadOutlined fontSize="inherit" />}
              actionText="Go to Import"
              onClick={() => {}}
              disabled={true}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FeatureCard 
              title="Analytics" 
              description="Visualize and analyze your database metrics and performance."
              icon={<AnalyticsOutlined fontSize="inherit" />}
              actionText="View Analytics"
              onClick={() => {}}
              disabled={true}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FeatureCard 
              title="Settings" 
              description="Configure your database connection and application preferences."
              icon={<SettingsOutlined fontSize="inherit" />}
              actionText="Go to Settings"
              onClick={() => {}}
              disabled={true}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FeatureCard 
              title="Documentation" 
              description="Access comprehensive guides and documentation for DBExportHub."
              icon={<HelpOutlineOutlined fontSize="inherit" />}
              actionText="View Docs"
              onClick={() => {}}
              disabled={true}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FeatureCard 
              title="System Status" 
              description="Monitor the status and health of your database connections."
              icon={<DashboardOutlined fontSize="inherit" />}
              actionText="Check Status"
              onClick={() => {}}
              disabled={true}
            />
          </Grid>
        </Grid>
      </Container>
      
      <Box
        component="footer"
        sx={{
          py: 1.5,
          px: 2,
          mt: 'auto',
          backgroundColor: 'rgba(0,0,0,0.03)',
          borderTop: '1px solid',
          borderColor: theme.palette.divider
        }}
      >
        <Container maxWidth="md">
          <Typography variant="body2" color="text.secondary" align="center" sx={{ fontSize: '0.8rem' }}>
            DBExportHub — Streamlining Database Operations
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage; 