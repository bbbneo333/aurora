import React from 'react';
import { CircularProgress } from '@mui/material';

export function LoaderIcon() {
  return (
    <CircularProgress sx={{ color: 'var(--loader-color)' }}/>
  );
}
