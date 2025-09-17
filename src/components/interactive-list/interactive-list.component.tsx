import React from 'react';
import { isEmpty, isNil } from 'lodash';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import classNames from 'classnames/bind';

import {
  closestCenter,
  DndContext,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import type { DragEndEvent } from '@dnd-kit/core/dist/types';

import { SafePointerSensor } from '../../types';
import { DOM, Events } from '../../utils';

import styles from './interactive-list.component.css';
import { InteractiveListItem } from './interactive-list-item.component';

const cx = classNames.bind(styles);

function isElementInteractiveItem(element: HTMLElement) {
  return !isNil(element.dataset?.interactiveItemId);
}

export type InteractiveListItemType = {
  id?: string;
};

export type InteractiveListProps<T> = {
  items: T[];
  children: (item: T, index: number) => React.ReactElement;
  sortable?: boolean;
  getItemId?: (item: T) => string;
  onContextMenu?: (event: React.MouseEvent, itemIds: string[]) => void;
  onItemsSorted?: (items: T[]) => Promise<void> | void;
  onItemsDelete?: (itemIds: string[]) => Promise<boolean> | boolean;
  disableMultiSelect?: boolean;
};

export function InteractiveList<T extends InteractiveListItemType>(props: InteractiveListProps<T>) {
  const {
    items,
    children,
    sortable = false,
    getItemId: getItemIdFn,
    onContextMenu,
    onItemsSorted,
    onItemsDelete,
    disableMultiSelect = false,
  } = props;

  const [dragItems, setDragItems] = React.useState<T[] | null>(null);
  const [prevItems, setPrevItems] = React.useState<T[]>([]);
  const [isSortingDisabled, setIsSortingDisabled] = React.useState(false);
  const [selectedItemIds, setSelectedItemIds] = React.useState<string[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<number | null>(null);
  const [selectionDeleteInProgress, setSelectionDeleteInProgress] = React.useState<boolean>(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const sensors = useSensors(useSensor(SafePointerSensor, {
    activationConstraint: {
      // by default, every click is considered drag by dnd
      // this ensures pixels to move before it's considered a drag
      distance: 5,
    },
  }));

  // make sure either item.id or getItemId returns unique ids
  const getItemId = React.useCallback((item: T) => ((getItemIdFn ? getItemIdFn(item) : item.id) as string), [
    getItemIdFn,
  ]);

  const list = dragItems ?? items;
  const listIds = list.map(getItemId);

  const selectAll = React.useCallback(() => {
    setSelectedItemIds(listIds);
  }, [
    listIds,
  ]);

  const clearSelection = React.useCallback(() => {
    setSelectedItemIds([]);
  }, []);

  const clearFocus = React.useCallback(() => {
    const { activeElement } = document;

    if (
      activeElement
      && activeElement instanceof HTMLElement
      && isElementInteractiveItem(activeElement)
    ) {
      activeElement.blur();
    }
  }, []);

  const handleSelect = React.useCallback((e: React.MouseEvent, itemId: string, index: number) => {
    if (disableMultiSelect) {
      // single item selection
      setSelectedItemIds([itemId]);
      setLastSelectedIndex(index);
      return;
    }

    if (Events.isShiftKey(e)) {
      // select range between last clicked index and this one
      if (lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const newRange = items.slice(start, end + 1).map(item => getItemId(item));
        setSelectedItemIds(newRange);
      }
    } else if (Events.isModifierKey(e)) {
      // toggle
      setSelectedItemIds(prev => (prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]));
    } else {
      // normal click = single select
      setSelectedItemIds([itemId]);
    }

    setLastSelectedIndex(index);
  }, [
    disableMultiSelect,
    getItemId,
    items,
    lastSelectedIndex,
  ]);

  const handleContextMenu = React.useCallback((e: React.MouseEvent, itemId: string) => {
    if (!onContextMenu) {
      return;
    }
    e.preventDefault();

    const updatedSelectedIds = selectedItemIds.includes(itemId)
      ? selectedItemIds
      : [...selectedItemIds, itemId];

    // update state only if something changed
    if (updatedSelectedIds !== selectedItemIds) {
      setSelectedItemIds(updatedSelectedIds);
    }

    onContextMenu(e, updatedSelectedIds);
  }, [
    onContextMenu,
    selectedItemIds,
  ]);

  const handleDragStart = () => {
    // snapshot before change for rollback
    setPrevItems(items);
  };

  const handleDragEnd = React.useCallback(async ({ active, over }: DragEndEvent) => {
    if (!sortable || !onItemsSorted || !over || active.id === over.id) {
      setDragItems(null);
      return;
    }

    const oldIndex = listIds.findIndex(id => id === active.id);
    const newIndex = listIds.findIndex(id => id === over.id);
    const newOrder = arrayMove(list, oldIndex, newIndex);

    setDragItems(newOrder);
    setIsSortingDisabled(true);

    try {
      // attempt commit: let the parent updates items
      await onItemsSorted(newOrder);
    } catch (err) {
      // commit failed: rollback request to parent on error
      // eslint-disable-next-line no-console
      console.error('onItemsSorted failed:', err);
      await onItemsSorted(prevItems);
    } finally {
      // ditch local state, back to controlled
      setIsSortingDisabled(false);
      setDragItems(null);
    }
  }, [
    list,
    listIds,
    onItemsSorted,
    prevItems,
    sortable,
  ]);

  // mouse events
  React.useEffect(() => {
    // for clearing selection on outside click
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current
        && !containerRef.current.contains(e.target as Node)
        && !selectionDeleteInProgress
      ) {
        clearSelection();
      }
    }

    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [
    clearSelection,
    selectionDeleteInProgress,
  ]);

  // keyboard events
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // for selecting all on ctrl+a
      // important - ignore events originating from editable elements
      if (Events.isSelectAllKey(e) && !DOM.isElementEditable(document.activeElement)) {
        e.preventDefault();
        selectAll();
      }

      // for deleting selected on delete
      if (Events.isDeleteKey(e) && onItemsDelete && !isEmpty(selectedItemIds)) {
        if (selectionDeleteInProgress) {
          return;
        }
        setSelectionDeleteInProgress(true);

        Promise.resolve(onItemsDelete(selectedItemIds))
          .then((sig) => {
            // only clear if signal received
            if (sig) {
              clearSelection();
            }
          })
          .catch((err) => {
            console.error('Encountered error at onItemsDelete: ', err);
          })
          .finally(() => {
            setSelectionDeleteInProgress(false);
          });
      }

      // clearing selection and focus on escape
      if (Events.isEscapeKey(e)) {
        clearSelection();
        clearFocus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    selectAll,
    clearSelection,
    clearFocus,
    selectionDeleteInProgress,
    onItemsDelete,
    selectedItemIds,
  ]);

  return (
    <div ref={containerRef} className={cx('interactive-list')}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={listIds}
          strategy={verticalListSortingStrategy}
        >
          {list.map((item, index) => {
            const itemId = listIds[index];
            const child = children(item, index);

            return (
              <InteractiveListItem
                key={itemId}
                itemId={itemId}
                index={index}
                child={child}
                sortable={sortable && !isSortingDisabled}
                isSelected={selectedItemIds.includes(itemId)}
                onSelect={handleSelect}
                onContextMenu={handleContextMenu}
              />
            );
          })}
        </SortableContext>
      </DndContext>
    </div>
  );
}
