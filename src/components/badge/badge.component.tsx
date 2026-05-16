import React from 'react';
import { Badge as MuiBadge, BadgeProps as MuiBadgeProps } from '@mui/material';

export type BadgeProps = MuiBadgeProps & {};

export function Badge(props: BadgeProps) {
  const { children, ...rest } = props;

  return (
    <MuiBadge
      variant="dot"
      sx={{
        '& .MuiBadge-badge': {
          backgroundColor: 'var(--badge-active-dot-color)',
          boxShadow: 'var(--badge-active-dot-shadow)',
          width: 4,
          height: 4,
          minWidth: 4,
        },
      }}
      {...rest}
    >
      {children}
    </MuiBadge>
  );
}
