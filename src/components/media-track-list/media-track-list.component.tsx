import React, { useCallback, useMemo } from 'react';
import { isEmpty } from 'lodash';

import { MediaTrackListProvider, useContextMenu } from '../../contexts';
import { IMediaTrack, IMediaTrackList } from '../../interfaces';
import { StringUtils } from '../../utils';

import {
  MediaTrackContextMenu,
  MediaTrackContextMenuItem,
} from '../media-track-context-menu/media-track-context-menu.component';

import { InteractiveList } from '../interactive-list/interactive-list.component';
import { MediaTrack } from '../media-track/media-track.component';

export type MediaTracksProps<T> = {
  mediaTracks: T[],
  mediaTrackList?: IMediaTrackList,
  contextMenuItems?: MediaTrackContextMenuItem[],
  disableCovers?: boolean,
  disableAlbumLinks?: boolean,
  getMediaTrackId?: (mediaTrack: T) => string,
  onMediaTrackPlay?: (mediaTrack: T) => void,
  sortable?: boolean,
  onMediaTracksSorted?: (mediaTracks: T[]) => Promise<void> | void,
  onSelectionDelete?: (mediaTrackIds: string[]) => Promise<boolean> | boolean,
};

export function MediaTrackList<T extends IMediaTrack>(props: MediaTracksProps<T>) {
  const {
    mediaTracks,
    mediaTrackList,
    contextMenuItems,
    disableCovers = false,
    disableAlbumLinks = false,
    getMediaTrackId,
    onMediaTrackPlay,
    sortable = false,
    onMediaTracksSorted,
    onSelectionDelete,
  } = props;

  const { showMenu, hideAll } = useContextMenu();

  const contextMenuId = useMemo(
    () => (!isEmpty(contextMenuItems) ? StringUtils.generateId() : undefined),
    [
      contextMenuItems,
    ],
  );

  const handleContextMenu = useCallback((e, mediaTrackIds: string[]) => {
    if (!contextMenuId) {
      return;
    }

    const selectedTracks = mediaTracks.filter(track => mediaTrackIds.includes(
      getMediaTrackId?.(track) || track.id,
    ));

    showMenu({
      id: contextMenuId,
      event: e,
      props: {
        mediaTracks: selectedTracks,
        mediaTrackList,
      },
    });
  }, [
    contextMenuId,
    getMediaTrackId,
    mediaTrackList,
    mediaTracks,
    showMenu,
  ]);

  const handlePointerDown = () => {
    hideAll();
  };

  return (
    <MediaTrackListProvider
      mediaTracks={mediaTracks}
      mediaTrackList={mediaTrackList}
    >
      <InteractiveList
        items={mediaTracks}
        sortable={sortable}
        getItemId={getMediaTrackId}
        onItemsSorted={onMediaTracksSorted}
        onItemsDelete={onSelectionDelete}
        onContextMenu={handleContextMenu}
      >
        {(mediaTrack, index) => (
          <MediaTrack
            mediaTrack={mediaTrack}
            mediaTrackPointer={index}
            disableCover={disableCovers}
            disableAlbumLink={disableAlbumLinks}
            // TODO: Fix generic typing issue with MediaTrack
            // @ts-ignore
            onMediaTrackPlay={onMediaTrackPlay}
            onPointerDown={handlePointerDown}
          />
        )}
      </InteractiveList>
      {contextMenuId && contextMenuItems && (
        <MediaTrackContextMenu
          id={contextMenuId}
          menuItems={contextMenuItems}
        />
      )}
    </MediaTrackListProvider>
  );
}
