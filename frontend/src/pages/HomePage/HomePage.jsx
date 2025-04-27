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
  useTheme
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

const FeatureCard = ({ title, description, icon, actionText, onClick, disabled = false }) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 6,
          ...(disabled ? {} : { cursor: 'pointer' })
        },
        position: 'relative',
        opacity: disabled ? 0.7 : 1
      }}
      onClick={disabled ? undefined : onClick}
    >
      {disabled && (
        <Paper 
          sx={{ 
            position: 'absolute', 
            top: 10, 
            right: 10, 
            p: 0.5, 
            px: 1, 
            bgcolor: theme.palette.warning.light,
            zIndex: 1 
          }}
          elevation={2}
        >
          <Typography variant="caption" color="textSecondary">Coming Soon</Typography>
        </Paper>
      )}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
        <Box sx={{ mb: 2, color: theme.palette.primary.main, fontSize: 48 }}>
          {icon}
        </Box>
        <Typography variant="h5" component="h2" gutterBottom align="center">
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center">
          {description}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={disabled ? undefined : onClick}
          disabled={disabled}
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
      <Header title="DBExportHub Dashboard" />
      
      <Container component="main" sx={{ mt: 4, mb: 8, flexGrow: 1 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome to DBExportHub
          </Typography>
          
          {connectionDetails && (
            <Paper sx={{ p: 2, mb: 4, bgcolor: theme.palette.background.paper }}>
              <Typography variant="subtitle1" color="primary">
                Connected to: {connectionDetails.server || connectionDetails.hostname}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Database: {connectionDetails.database}
              </Typography>
            </Paper>
          )}
          
          <Typography variant="body1" paragraph>
            Your centralized hub for database management operations. Select a feature below to get started.
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Available Features
          </Typography>
        </Box>
        
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard 
              title="Export Data" 
              description="Export your database data in various formats with customizable options."
              icon={<CloudDownloadOutlined fontSize="inherit" />}
              actionText="Go to Export"
              onClick={() => navigate('/export')}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard 
              title="Import Data" 
              description="Import data from different sources into your database with validation."
              icon={<CloudUploadOutlined fontSize="inherit" />}
              actionText="Go to Import"
              onClick={() => {}}
              disabled={true}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard 
              title="Analytics" 
              description="Visualize and analyze your database metrics and performance."
              icon={<AnalyticsOutlined fontSize="inherit" />}
              actionText="View Analytics"
              onClick={() => {}}
              disabled={true}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard 
              title="Settings" 
              description="Configure your database connection and application preferences."
              icon={<SettingsOutlined fontSize="inherit" />}
              actionText="Go to Settings"
              onClick={() => {}}
              disabled={true}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard 
              title="Documentation" 
              description="Access comprehensive guides and documentation for DBExportHub."
              icon={<HelpOutlineOutlined fontSize="inherit" />}
              actionText="View Docs"
              onClick={() => {}}
              disabled={true}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
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
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: theme.palette.grey[100]
        }}
      >
        <Container maxWidth="md">
          <Typography variant="body2" color="text.secondary" align="center">
            DBExportHub — Streamlining Database Operations
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage; 