import React, { useState, useEffect } from 'react';
import { 
  Box,
  TextField,
  IconButton,
  Popover,
  Typography,
  styled
} from '@mui/material';
import { CalendarMonth, KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import dayjs from 'dayjs';

const CalendarContainer = styled(Box)(({ theme }) => ({
  width: '280px',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[3],
}));

const MonthGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: theme.spacing(1),
}));

const MonthButton = styled(Box)(({ theme, selected, disabled }) => ({
  padding: theme.spacing(1),
  textAlign: 'center',
  borderRadius: theme.shape.borderRadius,
  cursor: disabled ? 'default' : 'pointer',
  backgroundColor: selected ? theme.palette.primary.light : 'transparent',
  color: disabled 
    ? theme.palette.text.disabled 
    : selected 
      ? theme.palette.primary.contrastText
      : theme.palette.text.primary,
  '&:hover': {
    backgroundColor: disabled 
      ? 'transparent' 
      : selected 
        ? theme.palette.primary.light 
        : theme.palette.action.hover,
  },
  opacity: disabled ? 0.5 : 1,
}));

const HeaderRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
}));

/**
 * MonthYearPicker component for selecting year and month
 * 
 * @param {Object} props - Component props
 * @param {string} props.value - Selected value in YYYYMM format
 * @param {Function} props.onChange - Change handler function
 * @param {string} props.label - Input label
 * @param {string} props.name - Input name
 * @param {boolean} props.required - Whether the field is required
 * @param {Object} props.inputProps - Additional props for the TextField
 * @param {Object} props.sx - Additional styles for the component
 */
const MonthYearPicker = ({ 
  value = '', 
  onChange,
  label,
  name,
  required = false,
  inputProps = {},
  sx = {},
  ...rest
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Initialize the selected date from the value prop
  useEffect(() => {
    if (value && /^\d{6}$/.test(value)) {
      const year = parseInt(value.substring(0, 4));
      const month = parseInt(value.substring(4, 6)) - 1; // Adjust for 0-based month index
      setSelectedDate(new Date(year, month, 1));
      setViewYear(year);
    } else if (!selectedDate) {
      // Default to current month if no value
      const now = new Date();
      setSelectedDate(now);
      setViewYear(now.getFullYear());
    }
  }, [value]);
  
  // Format the displayed value
  const getDisplayValue = () => {
    if (selectedDate) {
      const month = months[selectedDate.getMonth()];
      const year = selectedDate.getFullYear();
      return `${month} ${year}`;
    }
    return '';
  };
  
  // Format date to YYYYMM format
  const formatAsYYYYMM = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Add 1 to get 1-based month
    return `${year}${month}`;
  };
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleYearChange = (delta) => {
    setViewYear(viewYear + delta);
  };
  
  const handleMonthSelect = (monthIndex) => {
    const newDate = new Date(viewYear, monthIndex, 1);
    setSelectedDate(newDate);
    onChange({
      target: {
        name,
        value: formatAsYYYYMM(newDate)
      }
    });
    handleClose();
  };
  
  const open = Boolean(anchorEl);
  
  return (
    <Box sx={sx}>
      <TextField
        label={label}
        name={name}
        required={required}
        fullWidth
        size="small"
        value={value}
        onClick={handleClick}
        // Use a hidden input for the actual value
        InputProps={{
          readOnly: true,
          startAdornment: <CalendarMonth sx={{ color: 'primary.main', mr: 1, fontSize: 24 }} />,
          ...inputProps
        }}
        // Show the formatted date in the text field
        placeholder="YYYYMM"
        inputProps={{
          sx: { cursor: 'pointer' }
        }}
        {...rest}
      />
      
      {value && (
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block', 
            mt: 0.5, 
            ml: 1, 
            color: 'text.secondary',
            fontSize: '0.7rem'
          }}
        >
          {getDisplayValue()}
        </Typography>
      )}
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: { mt: 1 }
        }}
      >
        <CalendarContainer>
          <HeaderRow>
            <IconButton size="small" onClick={() => handleYearChange(-1)}>
              <KeyboardArrowLeft />
            </IconButton>
            <Typography variant="subtitle1" fontWeight={600}>
              {viewYear}
            </Typography>
            <IconButton size="small" onClick={() => handleYearChange(1)}>
              <KeyboardArrowRight />
            </IconButton>
          </HeaderRow>
          
          <MonthGrid>
            {months.map((month, index) => {
              const isSelected = selectedDate && 
                selectedDate.getMonth() === index && 
                selectedDate.getFullYear() === viewYear;
                
              return (
                <MonthButton
                  key={month}
                  selected={isSelected}
                  onClick={() => handleMonthSelect(index)}
                >
                  <Typography 
                    variant="body2" 
                    fontWeight={isSelected ? 600 : 400}
                  >
                    {month}
                  </Typography>
                </MonthButton>
              );
            })}
          </MonthGrid>
        </CalendarContainer>
      </Popover>
    </Box>
  );
};

export default MonthYearPicker;
