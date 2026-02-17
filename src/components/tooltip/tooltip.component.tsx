import React from 'react';
import { Tooltip as MuiTooltip, TooltipProps as MuiTooltipProps } from '@mui/material';
import { merge } from 'lodash';

export type TooltipProps = {} & MuiTooltipProps;

export function Tooltip(props: TooltipProps) {
  const {
    children,
    slotProps = {},
    ...rest
  } = props;

  merge(slotProps, {
    tooltip: {
      sx: {
        backgroundColor: 'var(--selectable-focused-bg-color)',
        color: 'var(--selectable-hovered-color)',
        fontSize: '13px',
        borderRadius: '6px',
        padding: '6px 12px',
        boxShadow: '0 16px 24px rgb(0 0 0 / 30%), 0 6px 8px rgb(0 0 0 / 20%)',
        whiteSpace: 'pre-line',
      },
    },
  });

  return (
    <MuiTooltip
      slotProps={slotProps}
      {...rest}
    >
      {children}
    </MuiTooltip>
  );
}
