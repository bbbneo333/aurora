import React from 'react';
import { CircularProgress, CircularProgressProps } from '@mui/material';

export type LoaderCircleProps = CircularProgressProps & {};

export function LoaderCircle(props: LoaderCircleProps = {}) {
  return (
    <CircularProgress
      sx={{ color: 'var(--loader-color)' }}
      {...props}
    />
  );
}
