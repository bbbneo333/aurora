import React from 'react';
import { Box, Chip } from '@mui/material';

export type NavigationItem = {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
};

export function NavigationPills(props: {
  items: NavigationItem[],
  selected?: string;
  onSelectItem?: (itemId: string) => void;
}) {
  const {
    items,
    selected,
    onSelectItem,
  } = props;

  return (
    <div style={{
      display: 'flex',
      gap: 10,
      overflowX: 'auto',
    }}
    >
      {items.map((
        {
          id,
          label,
          count = undefined,
          disabled = false,
        },
      ) => (
        <Chip
          key={id}
          onClick={() => onSelectItem && !disabled && onSelectItem(id)}
          variant={selected === id ? 'filled' : 'outlined'}
          disabled={disabled}
          label={(
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
            >
              <span>{label}</span>
              {typeof count === 'number' && !disabled && (
                <Box
                  component="span"
                  sx={{
                    backgroundColor: 'var(--input-bg-color)',
                    color: 'var(--input-color)',
                    fontSize: '10px',
                    borderRadius: 'var(--radius-pill)',
                    px: 1,
                    minWidth: '20px',
                    textAlign: 'center',
                  }}
                >
                  {count}
                </Box>
              )}
            </Box>
          )}
          sx={{
            px: 1,
            py: 1,
            bgcolor: selected === id ? 'var(--selectable-active-bg-color)' : 'var(--selectable-bg-color)',
            color: selected === id ? 'var(--selectable-active-color)' : 'var(--selectable-color)',
            borderColor: 'var(--selectable-outline-color)',
            '&:hover': {
              bgcolor: 'var(--selectable-hovered-bg-color)',
            },
            transition: 'var(--selectable-item-transition)',
          }}
        />
      ))}
    </div>
  );
}
