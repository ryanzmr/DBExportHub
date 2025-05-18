import React from 'react';
import { 
  Box, 
  Breadcrumbs, 
  Typography, 
  Link, 
  Chip, 
  useTheme 
} from '@mui/material';
import { 
  NavigateNext, 
  HomeOutlined 
} from '@mui/icons-material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();
  const theme = useTheme();
  
  const getPathSegments = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    const breadcrumbItems = [
      { label: 'Home', path: '/home', icon: <HomeOutlined fontSize="small" /> }
    ];
    
    if (pathSegments.length > 0) {
      pathSegments.forEach((segment, index) => {
        if (segment !== 'home') {
          const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
          breadcrumbItems.push({
            label: segment.charAt(0).toUpperCase() + segment.slice(1),
            path,
            icon: null
          });
        }
      });
    }
    
    return breadcrumbItems;
  };
  
  const breadcrumbItems = getPathSegments();
  const currentPage = breadcrumbItems[breadcrumbItems.length - 1]?.label || 'Page';
  
  // Check if we're on the home page - if so, don't show breadcrumbs
  const isHomePage = location.pathname === '/' || location.pathname === '/home';
  
  // Don't render the breadcrumbs navigation on home page
  if (isHomePage) {
    return null;
  }
  
  return (
    <Box sx={{ 
      bgcolor: '#f5f5fa', 
      py: 1, 
      px: 2, 
      borderRadius: '8px 8px 0 0',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      alignItems: 'center'
    }}>
      <Breadcrumbs 
        separator={<NavigateNext fontSize="small" color="primary" />} 
        aria-label="breadcrumb"
      >
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          return isLast ? (
            <Chip
              key={item.path}
              label={item.label}
              size="small"
              color="primary"
              icon={item.icon}
              sx={{ 
                height: 28,
                fontWeight: 'bold',
                px: 0.5,
                bgcolor: theme.palette.primary.main,
                '& .MuiChip-label': {
                  fontWeight: 'bold',
                  px: 1.5
                }
              }}
            />
          ) : (
            <Link
              key={item.path}
              component={RouterLink}
              to={item.path}
              color="inherit"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                textDecoration: 'none',
                color: theme.palette.text.primary,
                fontWeight: 500,
                '&:hover': {
                  color: theme.palette.primary.main
                }
              }}
            >
              {item.icon && (
                <Box component="span" sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </Box>
              )}
              {item.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

export default Navigation; 