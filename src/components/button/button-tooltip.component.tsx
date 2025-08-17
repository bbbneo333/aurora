import React from 'react';
import { Tooltip } from '@mui/material';

export function ButtonTooltip(props: {
  title?: string;
  anchorEl?: HTMLElement | null;
  open?: boolean;
}) {
  const {
    title,
    anchorEl,
    open,
  } = props;

  return (
    <Tooltip
      open={open}
      title={title}
      slotProps={{
        popper: {
          anchorEl,
        },
        tooltip: {
          sx: {
            backgroundColor: 'var(--selectable-focused-bg-color)',
            color: 'var(--selectable-hovered-color)',
            fontSize: '13px',
            borderRadius: '6px',
            padding: '6px 12px',
            boxShadow: '0 16px 24px rgb(0 0 0 / 30%), 0 6px 8px rgb(0 0 0 / 20%)',
          },
        },
      }}
    >
      {/* tooltip still requires a child — can be dummy */}
      <span/>
    </Tooltip>
  );
}
