import { Box, CircularProgress, CircularProgressProps } from '@mui/material';
import React from 'react';

export type LoaderIconProgressProps = CircularProgressProps & {};

export function LoaderCircleProgress(props: LoaderIconProgressProps = {}) {
  // material ui didn't have a deterministic circle progress with a track
  // so we have here 2 loaders - one which is always complete (100)
  // another actually responding to value for progress, both overlapping each other
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        sx={{
          color: 'var(--loader-track-color)',
          position: 'absolute',
          left: 0,
        }}
        {...props}
        value={100} // value will be always 100 for track
      />

      <CircularProgress
        variant="determinate"
        sx={{
          color: 'var(--loader-color)',
        }}
        {...props}
      />
    </Box>
  );
}
