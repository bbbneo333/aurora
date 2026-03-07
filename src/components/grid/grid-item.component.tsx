import React from 'react';

export type GridItemProps<T> = {
  item: T;
  index: number;
  width: number;
  height: number;
  children: (item: T, index: number) => React.ReactElement;
};

export function GridItem<T>(props: GridItemProps<T>) {
  const {
    item,
    index,
    width,
    height,
    children,
  } = props;

  return (
    <div
      style={{
        width,
        height,
      }}
    >
      {children(item, index)}
    </div>
  );
}
