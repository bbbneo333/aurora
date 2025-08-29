import React, { useCallback, useMemo } from 'react';
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
  onMediaTracksSorted?: (mediaTracks: T[]) => void,
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

  const contextMenuId = useMemo(
    () => (!isEmpty(contextMenuItems) ? StringUtils.generateId() : undefined),
    [contextMenuItems],
  );
  const sensors = useSensors(useSensor(SafePointerSensor));

  const getMediaTrackId = useCallback((mediaTrack: T) => (getMediaTrackKey ? getMediaTrackKey(mediaTrack) : mediaTrack.id), [
    getMediaTrackKey,
  ]);

  return (
    <div>
      <div className="row">
        <MediaTrackListProvider
          mediaTracks={mediaTracks}
          mediaTrackList={mediaTrackList}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={({ active, over }) => {
              if (!sortable || !onMediaTracksSorted || !over || active.id === over.id) return;

              const oldIndex = mediaTracks.findIndex(t => getMediaTrackId(t) === active.id);
              const newIndex = mediaTracks.findIndex(t => getMediaTrackId(t) === over.id);

              onMediaTracksSorted(arrayMove(mediaTracks, oldIndex, newIndex));
            }}
          >
            <SortableContext
              items={mediaTracks.map(getMediaTrackId)}
              strategy={verticalListSortingStrategy}
            >
              {mediaTracks.map((mediaTrack, mediaTrackPointer) => (
                <MediaTrackListItem
                  key={getMediaTrackId(mediaTrack)}
                  id={getMediaTrackId(mediaTrack)}
                  sortable={sortable}
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
