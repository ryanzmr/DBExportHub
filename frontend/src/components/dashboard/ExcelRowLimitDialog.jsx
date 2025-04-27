import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import { WarningAmber } from '@mui/icons-material';

/**
 * Dialog component that shows when export data exceeds Excel row limit
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Function to call when dialog is closed
 * @param {Function} props.onContinue - Function to call when user chooses to continue
 * @param {Function} props.onCancel - Function to call when user chooses to cancel
 * @param {number} props.rowCount - Total number of records
 * @param {number} props.rowLimit - Excel row limit (defaults to 1048576)
 */
const ExcelRowLimitDialog = ({ 
  open, 
  onClose, 
  onContinue, 
  onCancel, 
  rowCount = 0, 
  rowLimit = 1048576 
}) => {
  // Log props for debugging
  useEffect(() => {
    console.log('ExcelRowLimitDialog props:', { open, rowCount, rowLimit });
  }, [open, rowCount, rowLimit]);

  // Ensure values are safe for use
  const safeRowCount = rowCount && typeof rowCount === 'number' ? rowCount : 0;
  const safeRowLimit = rowLimit && typeof rowLimit === 'number' ? rowLimit : 1048576;
  const exceededBy = Math.max(0, safeRowCount - safeRowLimit);

  // Format numbers safely
  const formatNumber = (num) => {
    try {
      return num.toLocaleString();
    } catch (err) {
      console.error('Error formatting number:', num, err);
      return '0';
    }
  };
  
  return (
    <Dialog
      open={!!open}
      onClose={onClose || (() => {})}
      aria-labelledby="excel-limit-dialog-title"
      aria-describedby="excel-limit-dialog-description"
      PaperProps={{
        sx: {
          width: '500px',
          maxWidth: '90vw',
          borderTop: '4px solid #f44336'
        }
      }}
    >
      <DialogTitle id="excel-limit-dialog-title" sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center">
          <WarningAmber color="error" sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant="h6" component="span">
            Excel Row Limit Exceeded
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="excel-limit-dialog-description" sx={{ mb: 2 }}>
          The total number of records ({formatNumber(safeRowCount)}) exceeds {formatNumber(safeRowLimit)} (modern Excel row limit).
        </DialogContentText>
        <DialogContentText color="error" sx={{ fontWeight: 'bold', mb: 2 }}>
          ⚠️ Warning: Only the first {formatNumber(safeRowLimit)} records will be saved in the Excel file. The remaining {formatNumber(exceededBy)} records will be discarded.
        </DialogContentText>
        <DialogContentText>
          Do you want to continue the export process or cancel it?
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onCancel || (() => {})} 
          color="error" 
          variant="outlined"
        >
          No, Cancel Export
        </Button>
        <Button 
          onClick={onContinue || (() => {})} 
          color="primary" 
          variant="contained" 
          autoFocus
        >
          Yes, Continue Anyway
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExcelRowLimitDialog; 