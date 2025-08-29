import React, { useCallback, useMemo, useState } from 'react';
import { isEmpty } from 'lodash';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';

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

import { MediaTrackListProvider } from '../../contexts';
import { IMediaTrack, IMediaTrackList } from '../../interfaces';
import { StringUtils } from '../../utils';
import { SafePointerSensor } from '../../types';

import {
  MediaTrackContextMenu,
  MediaTrackContextMenuItem,
} from '../media-track-context-menu/media-track-context-menu.component';

import { MediaTrackListItem } from './media-track-list-item.component';

export type MediaTracksProps<T> = {
  mediaTracks: T[],
  mediaTrackList?: IMediaTrackList,
  disableCovers?: boolean,
  disableAlbumLinks?: boolean,
  contextMenuItems?: MediaTrackContextMenuItem[],
  getMediaTrackKey?: (mediaTrack: T) => string,
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
    getMediaTrackKey,
    onMediaTrackPlay,
    sortable = false,
    onMediaTracksSorted,
  } = props;

  const [dragItems, setDragItems] = useState<T[] | null>(null);
  const [prevItems, setPrevItems] = useState<T[]>([]);
  const [isSortingDisabled, setIsSortingDisabled] = useState(false);

  const contextMenuId = useMemo(
    () => (!isEmpty(contextMenuItems) ? StringUtils.generateId() : undefined),
    [contextMenuItems],
  );
  const sensors = useSensors(useSensor(SafePointerSensor));

  const getMediaTrackId = useCallback((mediaTrack: T) => (getMediaTrackKey ? getMediaTrackKey(mediaTrack) : mediaTrack.id), [
    getMediaTrackKey,
  ]);

  const list = dragItems ?? mediaTracks;

  return (
    <div>
      <div className="row">
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
              {list.map((mediaTrack, mediaTrackPointer) => (
                <MediaTrackListItem
                  key={getMediaTrackId(mediaTrack)}
                  id={getMediaTrackId(mediaTrack)}
                  sortable={sortable && !isSortingDisabled}
                  mediaTrack={mediaTrack}
                  mediaTrackPointer={mediaTrackPointer}
                  mediaTrackContextMenuId={contextMenuId}
                  disableCover={disableCovers}
                  disableAlbumLink={disableAlbumLinks}
                  onMediaTrackPlay={onMediaTrackPlay}
                />
              ))}
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
    </div>
  );
}
