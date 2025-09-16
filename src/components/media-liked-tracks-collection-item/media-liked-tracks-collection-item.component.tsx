import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { Routes } from '../../constants';
import { RootState } from '../../reducers';
import { I18nService, MediaCollectionService, MediaLikedTrackService } from '../../services';
import { StringUtils } from '../../utils';

import { MediaCollectionItem } from '../media-collection-item/media-collection-item.component';
import { MediaCollectionContextMenu, MediaCollectionContextMenuItem } from '../media-collection-context-menu/media-collection-context-menu.component';

const likesCollectionItem = MediaCollectionService.getMediaItemForLikedTracks();

export function MediaLikedTracksCollectionItem(props: {
  className?: string;
}) {
  const { className } = props;
  const mediaLikedTracksRecord = useSelector((state: RootState) => state.mediaLibrary.mediaLikedTracksRecord);
  const [likedTracksCount, setLikedTracksCount] = useState(0);

  const contextMenuId = 'media-liked-tracks-context-menu';

  useEffect(() => {
    MediaLikedTrackService.getLikedTracksCount()
      .then((count) => {
        setLikedTracksCount(count);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [
    mediaLikedTracksRecord,
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
        className={className}
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
