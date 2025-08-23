import { useRef } from 'react';

export function useEntityMissing(selected: any): boolean {
  const hadSelected = useRef(false);

  if (selected) {
    hadSelected.current = true;
  }

  return hadSelected.current && !selected;
}
