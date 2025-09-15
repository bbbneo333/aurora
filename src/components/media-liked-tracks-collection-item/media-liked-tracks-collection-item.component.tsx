import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { Routes } from '../../constants';
import { RootState } from '../../reducers';
import { I18nService, MediaLibraryLikedTrackService } from '../../services';
import { MediaUtils, StringUtils } from '../../utils';

import { MediaCollectionItem } from '../media-collection-item/media-collection-item.component';
import { MediaCollectionContextMenu, MediaCollectionContextMenuItem } from '../media-collection-context-menu/media-collection-context-menu.component';

const likesCollectionItem = MediaUtils.getMediaItemForLikedTracks();

export function MediaLikedTracksCollectionItem() {
  const mediaLikedTracks = useSelector((state: RootState) => state.mediaLibrary.mediaLikedTracks);
  const [likedTracksCount, setLikedTracksCount] = useState(0);

  const contextMenuId = 'media-liked-tracks-context-menu';

  useEffect(() => {
    MediaLibraryLikedTrackService.getLikedTracksCount()
      .then((count) => {
        setLikedTracksCount(count);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [
    mediaLikedTracks,
  ]);

  return (
    <>
      <MediaCollectionItem
        key={likesCollectionItem.id}
        mediaItem={likesCollectionItem}
        contextMenuId={contextMenuId}
        routerLink={StringUtils.buildRoute(Routes.LibraryLikedTracks)}
        subtitle={I18nService.getString('label_playlist_subtitle', {
          trackCount: likedTracksCount,
        })}
        disablePlayback={likedTracksCount === 0}
      />
      <MediaCollectionContextMenu
        id={contextMenuId}
        menuItems={[
          MediaCollectionContextMenuItem.AddToQueue,
        ]}
      />
    </>
  );
}
