import React from 'react';
import { Button, CircularProgress } from '@mui/material';

const LoadingButton = ({ loading, children, ...props }) => {
  return (
    <Button
      disabled={loading}
      {...props}
    >
      {loading ? <CircularProgress size={24} /> : children}
    </Button>
  );
};

export default LoadingButton;