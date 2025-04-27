import { alpha } from '@mui/material/styles';

export const homePageStyles = (theme) => ({
  container: {
    mt: 4, 
    mb: 8, 
    flexGrow: 1
  },
  welcomeSection: {
    mb: 4
  },
  connectionInfo: {
    p: 2, 
    mb: 4, 
    bgcolor: theme.palette.background.paper,
    borderLeft: `4px solid ${theme.palette.primary.main}`
  },
  featureSection: {
    mb: 4
  },
  footer: {
    py: 3,
    px: 2,
    mt: 'auto',
    backgroundColor: theme.palette.grey[100]
  }
});

export const featureCardStyles = (theme) => ({
  card: {
    height: '100%', 
    display: 'flex', 
    flexDirection: 'column',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: 6
    }
  },
  disabledCard: {
    opacity: 0.7
  },
  comingSoonBadge: {
    position: 'absolute', 
    top: 10, 
    right: 10, 
    p: 0.5, 
    px: 1, 
    bgcolor: theme.palette.warning.light,
    zIndex: 1
  },
  cardContent: {
    flexGrow: 1, 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    p: 3
  },
  iconContainer: {
    mb: 2, 
    color: theme.palette.primary.main, 
    fontSize: 48
  },
  cardActions: {
    justifyContent: 'center', 
    pb: 2
  }
}); 