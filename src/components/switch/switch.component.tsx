import React from 'react';
import { styled } from '@mui/material/styles';
import MuiSwitch, { SwitchProps } from '@mui/material/Switch';

export const Switch = styled((props: SwitchProps) => (
  <MuiSwitch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props}/>
))(({ theme }) => ({
  width: 42,
  height: 26,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(16px)',
      color: 'var(--switch-thumb-color)', // active thumb color
      '& + .MuiSwitch-track': {
        backgroundColor: 'var(--switch-active-track-color)', // active track color
        opacity: 1,
        border: 0,
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: 'var(--switch-active-track-color)', // focused thumb color
      border: '6px solid #fff',
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color: 'var(--switch-disabled-thumb-color)', // disabled thumb color
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: 0.7,
      backgroundColor: 'var(--switch-disabled-track-color)', // disabled track color
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 22,
    height: 22,
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: 'var(--switch-inactive-track-color)', // inactive track color
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
  },
}));
