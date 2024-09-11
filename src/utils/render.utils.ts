import React, { ReactElement } from 'react';

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
