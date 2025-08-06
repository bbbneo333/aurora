import React from 'react';
import { Box, Chip } from '@mui/material';

export function NavigationPills(props: {
  categories: { id: string, label: string, count?: number }[],
  selected?: string;
  onSelectCategory?: (category: string) => void;
}) {
  const {
    categories,
    selected,
    onSelectCategory,
  } = props;

  return (
    <div style={{
      display: 'flex',
      gap: 10,
      overflowX: 'auto',
    }}
    >
      {categories.map(({ id, label, count = undefined }) => (
        <Chip
          key={id}
          onClick={() => onSelectCategory && onSelectCategory(id)}
          variant={selected === id ? 'filled' : 'outlined'}
          label={(
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
            >
              <span>{label}</span>
              {typeof count === 'number' && (
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
