import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

import { useElementSize } from '../../hooks';

import { GridItem } from './grid-item.component';
import styles from './grid.component.css';

const GAP = 20;
const MIN_TILE_WIDTH = 180;
const ASPECT_RATIO = 3 / 4;

export type GridProps<T> = {
  items: T[];
  children: (item: T, index: number) => React.ReactElement;
};

export type GridItemType = {
  id: string;
};

export function Grid<T extends GridItemType>(props: GridProps<T>) {
  const { items, children } = props;

  const [containerRef, { width }] = useElementSize<HTMLDivElement>();
  const scrollElement = document.querySelector('.app-viewport');

  const columnCount = width > 0
    ? Math.max(1, Math.floor(width / (MIN_TILE_WIDTH + GAP)))
    : 1;

  const tileWidth = columnCount > 0
    ? (width - GAP * columnCount) / columnCount
    : MIN_TILE_WIDTH;

  const tileHeight = tileWidth / ASPECT_RATIO;

  const rowCount = Math.ceil(items.length / columnCount);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    estimateSize: () => tileHeight + GAP,
    getScrollElement: () => scrollElement,
    overscan: 2,
  });

  React.useEffect(() => {
    rowVirtualizer.measure();
  }, [
    tileHeight,
    columnCount,
    rowVirtualizer,
  ]);

  return (
    <div ref={containerRef} className={styles.container}>
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowIndex = virtualRow.index;

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                transform: `translateY(${virtualRow.start}px)`,
                boxSizing: 'border-box',
                width: '100%',
                justifyContent: 'space-between',
                display: 'grid',
                gridTemplateColumns: `repeat(${columnCount}, ${tileWidth}px)`,
                columnGap: GAP,
              }}
            >
              {Array.from({ length: columnCount }).map((_, columnIndex) => {
                const index = rowIndex * columnCount + columnIndex;
                const item = items[index];
                if (!item) return null;

                return (
                  <GridItem
                    key={item.id}
                    item={item}
                    index={index}
                    width={tileWidth}
                    height={tileHeight}
                  >
                    {children}
                  </GridItem>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
