import { CellComponentProps } from 'react-window';
import React from 'react';

export type GridItemCellData<T> = {
  children: (item: T, index: number) => React.ReactElement;
  items: T[];
  columnCount: number;
  gap: number;
};

export function GridItem<T>(props: CellComponentProps<GridItemCellData<T>>) {
  const {
    items,
    children,
    columnCount,
    gap,
    columnIndex,
    rowIndex,
    style,
  } = props;

  const index = rowIndex * columnCount + columnIndex;

  const item = items[index];
  if (!item) return null;

  const child = children(item, index);

  return (
    <div
      style={{
        ...style,
        left: (style.left as number) + gap / 2,
        top: (style.top as number) + gap / 2,
        width: (style.width as number) - gap,
        height: (style.height as number) - gap,
      }}
    >
      {child}
    </div>
  );
}
