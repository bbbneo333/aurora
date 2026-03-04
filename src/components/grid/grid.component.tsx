import React from 'react';
import { Grid as ReactWindowGrid } from 'react-window';

import { useElementSize } from '../../hooks';

import { GridItem } from './grid-item.component';
import styles from './grid.component.css';

const GAP = 20;
const MIN_TILE_WIDTH = 180;
const ASPECT_RATIO = 3 / 4; // width / height

export type GridProps<T> = {
  items: T[];
  children: (item: T, index: number) => React.ReactElement;
};

export type GridItemType = {
  id: string;
};

export function Grid<T extends GridItemType>(props: GridProps<T>) {
  const { items, children } = props;
  const [containerRef, { width, height }] = useElementSize<HTMLDivElement>();

  const columnCount = width > 0
    ? Math.max(
      1,
      Math.floor(width / (MIN_TILE_WIDTH + GAP)),
    )
    : 1;

  const tileWidth = columnCount > 0
    ? (width - GAP * columnCount) / columnCount
    : MIN_TILE_WIDTH;

  const tileHeight = tileWidth / ASPECT_RATIO;

  const rowCount = Math.ceil(items.length / columnCount);

  const cellProps = React.useMemo(() => ({
    items,
    columnCount,
    children,
    gap: GAP,
  }), [items, columnCount, children]);

  return (
    <div ref={containerRef} className={styles.container}>
      <ReactWindowGrid
        cellComponent={GridItem}
        cellProps={cellProps}
        columnCount={columnCount}
        columnWidth={tileWidth + GAP}
        rowCount={rowCount}
        rowHeight={tileHeight + GAP}
        defaultWidth={width}
        defaultHeight={height}
        overscanCount={2}
      />
    </div>
  );
}
