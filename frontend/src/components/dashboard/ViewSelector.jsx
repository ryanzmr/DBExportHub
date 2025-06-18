import React, { useState, useEffect } from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { ViewColumn } from '@mui/icons-material';
import api from '../../services/api';

/**
 * View selector component for selecting database views
 * @param {Object} props - Component props
 * @param {string} props.category - View category ('export' or 'import')
 * @param {string} props.value - Selected view ID
 * @param {Function} props.onChange - Function to call when selection changes
 * @param {string} props.label - Label for the select input
 */
const ViewSelector = ({ category, value, onChange, label = "Select View" }) => {
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchViews = async () => {
      setLoading(true);
      try {
        const response = await api.getViews();
        setViews(response[category] || []);
        setError(null);
        
        // If no view is selected and views are available, select the first one
        if (!value && response[category] && response[category].length > 0) {
          onChange(response[category][0].id);
        }
      } catch (err) {
        console.error('Failed to fetch views:', err);
        setError('Failed to load available views');
      } finally {
        setLoading(false);
      }
    };

    fetchViews();
  }, [category, onChange, value]);

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={20} />
        <Typography variant="body2">Loading views...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" variant="body2">
        {error}
      </Typography>
    );
  }

  return (
    <FormControl fullWidth variant="outlined" size="small">
      <InputLabel>{label}</InputLabel>
      <Select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        label={label}
        startAdornment={<ViewColumn sx={{ color: 'action.active', mr: 1, my: 0.5 }} />}
      >
        {views.map((view) => (
          <MenuItem key={view.id} value={view.id}>
            {view.name}
          </MenuItem>
        ))}
      </Select>
      {value && (
        <FormHelperText>
          Using view: {views.find(v => v.id === value)?.value || value}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default ViewSelector;
