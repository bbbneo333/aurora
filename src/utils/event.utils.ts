import React from 'react';

export type GenericKeyEvent = KeyboardEvent | MouseEvent | React.KeyboardEvent | React.MouseEvent;

export type GenericKeyboardEvent = KeyboardEvent | React.KeyboardEvent;

export function isShiftKey(e: GenericKeyEvent) {
  return e.shiftKey;
}

export function isModifierKey(e: GenericKeyEvent) {
  return e.ctrlKey || e.metaKey;
}

export function isSelectAllKey(e: GenericKeyboardEvent): boolean {
  return isModifierKey(e)
    && e.key.toLowerCase() === 'a';
}

export function isDeleteKey(e: GenericKeyboardEvent) {
  return e.key === 'Delete' || e.key === 'Backspace';
}

export function isEscapeKey(e: GenericKeyboardEvent) {
  return e.key === 'Escape';
}

export function isEnterKey(e: GenericKeyboardEvent) {
  return e.key === 'Enter';
}

export function isSpaceKey(e: GenericKeyboardEvent) {
  return e.key === ' ';
}
