import React from 'react';
import { Button, Typography, Box, Paper } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const UITest: React.FC = () => {
  const now = new Date();
  const zonedTime = formatInTimeZone(now, 'America/New_York', 'yyyy-MM-dd HH:mm:ss zzz');

  return (
    <Paper elevation={3} sx={{ p: 2, m: 2 }}>
      <Typography variant="h4" gutterBottom>
        UI Framework Test
      </Typography>
      <Typography variant="body1" gutterBottom>
        Material-UI components are working correctly!
      </Typography>
      <Box sx={{ my: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />}>
          Test Button
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary">
        Current time: {format(now, 'yyyy-MM-dd HH:mm:ss')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        New York time: {zonedTime}
      </Typography>
    </Paper>
  );
};

export default UITest; 