import React from 'react';

export function isModifierKey(e: KeyboardEvent | MouseEvent | React.KeyboardEvent | React.MouseEvent) {
  return e.ctrlKey || e.metaKey;
}

export function isSelectAllKey(e: KeyboardEvent | React.KeyboardEvent): boolean {
  return isModifierKey(e)
    && e.key.toLowerCase() === 'a';
}
