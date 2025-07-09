import React, { useState } from 'react';
import { Alert, AlertTitle } from '@mui/material';

const TerrainWarnings: React.FC = () => {
  const [warnings, setWarnings] = useState([
    { id: 1, severity: 'warning' as 'warning', title: 'Challenging Terrain', message: 'Flight path includes steep elevation changes.' },
    { id: 2, severity: 'error' as 'error', title: 'Difficult Landing Site', message: 'Landing site has high difficulty rating.' },
  ]);

  return (
    <div>
      {warnings.map((warning) => (
        <Alert key={warning.id} severity={warning.severity}>
          <AlertTitle>{warning.title}</AlertTitle>
          {warning.message}
        </Alert>
      ))}
    </div>
  );
};

export default TerrainWarnings;
