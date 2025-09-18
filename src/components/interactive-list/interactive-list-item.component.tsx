import React from 'react';
import { defaultAnimateLayoutChanges, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import classNames from 'classnames/bind';

import styles from './interactive-list.component.css';

const cx = classNames.bind(styles);

export function InteractiveListItem(props: {
  itemId: string;
  index: number;
  child: React.ReactElement;
  sortable?: boolean;
  isSelected?: boolean;
  onSelect?: (e: React.PointerEvent<HTMLDivElement>, itemId: string, index: number) => void;
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement>, itemId: string, index: number) => void;
}) {
  const {
    itemId,
    index,
    child,
    sortable = false,
    isSelected = false,
    onSelect,
    onContextMenu,
  } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: itemId,
    disabled: !sortable,
    animateLayoutChanges: defaultAnimateLayoutChanges,
  });

  const style = {
    ...child.props.style,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // drag
    if (sortable) listeners?.onPointerDown?.(e);
    child.props.onPointerDown?.(e);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    // select
    if (e.button === 0 && onSelect) onSelect(e, itemId, index);
    child.props.onPointerUp?.(e);
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    // context menu
    if (onContextMenu) onContextMenu(e, itemId, index);
    child.props.onContextMenu?.(e);
  };

  // we wrap the child in our own wrapper which is required for functionality
  // - all handling via wrapper
  // - all state mgmt on the child
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(sortable ? { ...attributes, ...listeners } : {})}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onContextMenu={handleContextMenu}
      tabIndex={-1}
      className={cx('interactive-list-item')}
    >
      {React.cloneElement(child, {
        'data-interactive-item-id': itemId,
        'aria-selected': isSelected,
        className: cx('interactive-list-item-child', { dragging: isDragging }),
      })}
    </div>
  );
}
