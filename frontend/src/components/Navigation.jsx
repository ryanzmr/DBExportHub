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
  
  return (
    <Box sx={{ mb: 3 }}>
      <Breadcrumbs 
        separator={<NavigateNext fontSize="small" />} 
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
                '& .MuiChip-label': {
                  fontWeight: 'bold'
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
                '&:hover': {
                  textDecoration: 'underline'
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