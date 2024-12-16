import React, { ReactElement } from 'react';
import { get } from 'lodash';

export function withSeparator<T>(
  list: T[],
  renderer: (item: T) => ReactElement,
  separator: ReactElement,
): ReactElement {
  return list
    .map(item => renderer(item))
    // typescript is going to freak out with this reduce
    // @ts-ignore
    .reduce((prev: ReactElement, curr: ReactElement) => [
      prev,
      React.cloneElement(separator, {
        key: `separator-${prev?.key}`,
      }),
      curr,
    ]);
}

export function useSearch<T>(items: T[], query: string, key = 'name'): T[] {
  const searchTerm = query.trim().toLowerCase();

  return items.filter((item) => {
    const itemTerm = get(item, key) as string;
    return itemTerm.toLowerCase().includes(searchTerm);
  });
}
