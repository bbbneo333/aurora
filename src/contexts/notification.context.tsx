import React, { useEffect, useState, useCallback } from 'react';
import Snackbar from '@mui/material/Snackbar';

import { NotificationService } from '../services';

export function NotificationProvider(props: {
  children: React.ReactNode,
}) {
  const { children } = props;
  const [queue, setQueue] = useState<string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const processQueue = useCallback(() => {
    if (queue.length > 0 && !current) {
      setCurrent(queue[0]);
      setQueue(prev => prev.slice(1));
      setOpen(true);
    }
  }, [queue, current]);

  useEffect(() => {
    const unsubscribe = NotificationService.subscribe((message: string) => {
      setQueue(prev => [...prev, message]);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!current) {
      processQueue();
    }
  }, [queue, current, processQueue]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleExited = () => {
    setCurrent(null);
  };

  return (
    <>
      {children}
      <Snackbar
        open={open}
        message={current}
        autoHideDuration={3000}
        onClose={handleClose}
        slotProps={{
          content: { onClick: handleClose },
          transition: { onExited: handleExited },
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          bottom: '110px !important', // TODO: Hack to keep it floating above player ribbon
          '& .MuiSnackbarContent-root': {
            padding: '8px 28px',
            minWidth: 'unset',
            fontSize: '15px',
            backgroundColor: 'var(--stage-toast-bg-color)',
            color: 'var(--stage-toast-color)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          },
        }}
      />
    </>
  );
}
