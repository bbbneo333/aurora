import React, {
  useCallback, useMemo, useState, useEffect, useRef,
} from 'react';
import { isEmpty } from 'lodash';
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

import { MediaTrackListProvider, useContextMenu } from '../../contexts';
import { IMediaTrack, IMediaTrackList } from '../../interfaces';
import { StringUtils } from '../../utils';
import { SafePointerSensor } from '../../types';
import { isSelectAllKey, isModifierKey } from '../../utils/event.utils';

import {
  MediaTrackContextMenu,
  MediaTrackContextMenuItem,
} from '../media-track-context-menu/media-track-context-menu.component';

import { MediaTrackListItem } from './media-track-list-item.component';
import styles from './media-track-list.component.css';

const cx = classNames.bind(styles);

export type MediaTracksProps<T> = {
  mediaTracks: T[],
  mediaTrackList?: IMediaTrackList,
  disableCovers?: boolean,
  disableAlbumLinks?: boolean,
  contextMenuItems?: MediaTrackContextMenuItem[],
  getMediaTrackId?: (mediaTrack: T) => string,
  onMediaTrackPlay?: (mediaTrack: T) => void,
  sortable?: boolean,
  onMediaTracksSorted?: (mediaTracks: T[]) => Promise<void> | void,
};

export function MediaTrackList<T extends IMediaTrack>(props: MediaTracksProps<T>) {
  const {
    mediaTracks,
    mediaTrackList,
    disableCovers = false,
    disableAlbumLinks = false,
    contextMenuItems,
    getMediaTrackId: getMediaTrackIdFn,
    onMediaTrackPlay,
    sortable = false,
    onMediaTracksSorted,
  } = props;

  const [dragItems, setDragItems] = useState<T[] | null>(null);
  const [prevItems, setPrevItems] = useState<T[]>([]);
  const [isSortingDisabled, setIsSortingDisabled] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { showMenu } = useContextMenu();

  const contextMenuId = useMemo(
    () => (!isEmpty(contextMenuItems) ? StringUtils.generateId() : undefined),
    [contextMenuItems],
  );
  const sensors = useSensors(useSensor(SafePointerSensor));

  const getMediaTrackId = useCallback((mediaTrack: T) => (getMediaTrackIdFn ? getMediaTrackIdFn(mediaTrack) : mediaTrack.id), [
    getMediaTrackIdFn,
  ]);

  const list = dragItems ?? mediaTracks;

  const selectAll = useCallback(() => {
    setSelectedTrackIds(list.map((track: T) => getMediaTrackId(track)));
  }, [
    list.length,
    getMediaTrackId,
  ]);

  const handleSelect = useCallback((e: React.MouseEvent, trackId: string, index: number) => {
    if (e.shiftKey) {
      // select range between last clicked index and this one
      if (lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const newRange = mediaTracks.slice(start, end + 1).map(t => getMediaTrackId(t));
        setSelectedTrackIds(newRange);
      }
    } else if (isModifierKey(e)) {
      // toggle
      setSelectedTrackIds(prev => (prev.includes(trackId)
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]));
    } else {
      // normal click = single select
      setSelectedTrackIds([trackId]);
    }

    setLastSelectedIndex(index);
  }, [
    getMediaTrackId,
    lastSelectedIndex,
    mediaTracks,
  ]);

  const handleContextMenu = useCallback((e: React.MouseEvent, trackId: string) => {
    e.preventDefault();
    // ensure item is selected before opening context menu
    if (!selectedTrackIds.includes(trackId)) {
      setSelectedTrackIds([trackId]);
    }

    if (contextMenuId) {
      const selectedTracks = list.filter(item => selectedTrackIds.includes(getMediaTrackId(item)));

      showMenu({
        id: contextMenuId,
        event: e,
        props: {
          mediaTracks: selectedTracks,
          mediaTrackList,
        },
      });
    }
  }, [
    contextMenuId,
    getMediaTrackId,
    list,
    mediaTrackList,
    selectedTrackIds,
    showMenu,
  ]);

  useEffect(() => {
    // for clearing selection on outside click
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current
        && !containerRef.current.contains(e.target as Node)
      ) {
        setSelectedTrackIds([]);
      }
    }

    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  useEffect(() => {
    // for selecting all on ctrl+a
    function handleKeyDown(e: KeyboardEvent) {
      if (isSelectAllKey(e)) {
        e.preventDefault();
        selectAll();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    selectAll,
  ]);

  return (
    <>
      <div ref={containerRef} className={cx('media-track-list')}>
        <MediaTrackListProvider
          mediaTracks={list}
          mediaTrackList={mediaTrackList}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragStart={() => {
              // snapshot before change for rollback
              setPrevItems(mediaTracks);
            }}
            onDragEnd={async ({ active, over }) => {
              if (!sortable || !onMediaTracksSorted || !over || active.id === over.id) {
                setDragItems(null);
                return;
              }

              const oldIndex = list.findIndex(t => getMediaTrackId(t) === active.id);
              const newIndex = list.findIndex(t => getMediaTrackId(t) === over.id);
              const newOrder = arrayMove(list, oldIndex, newIndex);

              setDragItems(newOrder);
              setIsSortingDisabled(true);

              try {
                // attempt commit: let the parent updates items
                await onMediaTracksSorted(newOrder);
              } catch (err) {
                // commit failed: rollback request to parent on error
                // eslint-disable-next-line no-console
                console.error('onMediaTracksSorted failed:', err);
                await onMediaTracksSorted(prevItems);
              } finally {
                // ditch local state, back to controlled
                setIsSortingDisabled(false);
                setDragItems(null);
              }
            }}
          >
            <SortableContext
              items={list.map(getMediaTrackId)}
              strategy={verticalListSortingStrategy}
            >
              {list.map((mediaTrack, mediaTrackPointer) => {
                const mediaTrackId = getMediaTrackId(mediaTrack);

                return (
                  <MediaTrackListItem
                    key={mediaTrackId}
                    id={mediaTrackId}
                    sortable={sortable && !isSortingDisabled}
                    mediaTrack={mediaTrack}
                    mediaTrackPointer={mediaTrackPointer}
                    disableCover={disableCovers}
                    disableAlbumLink={disableAlbumLinks}
                    onMediaTrackPlay={onMediaTrackPlay}
                    onSelect={(e) => {
                      handleSelect(e, mediaTrackId, mediaTrackPointer);
                    }}
                    isSelected={selectedTrackIds.includes(mediaTrackId)}
                    containerProps={{
                      onContextMenu: (e) => {
                        handleContextMenu(e, mediaTrackId);
                      },
                    }}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        </MediaTrackListProvider>
      </div>
      {contextMenuId && contextMenuItems && (
        <MediaTrackContextMenu
          id={contextMenuId}
          menuItems={contextMenuItems}
        />
      )}
    </>
  );
}
