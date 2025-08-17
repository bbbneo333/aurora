import React from 'react';

import { IMediaAlbum } from '../../interfaces';
import { MediaUtils, StringUtils } from '../../utils';
import { Routes } from '../../constants';
import {
  MediaCollectionContextMenu, MediaCollectionContextMenuItem,
} from '../media-collection-context-menu/media-collection-context-menu.component';
import { MediaCollectionTile } from '../media-collection-tile/media-collection-tile.component';

export function MediaAlbums(props: {
  mediaAlbums: IMediaAlbum[],
}) {
  const { mediaAlbums } = props;
  const mediaContextMenuId = 'media_albums_context_menu';

  return (
    <div>
      <div className="row">
        {mediaAlbums.map((mediaAlbum) => {
          const mediaItem = MediaUtils.getMediaItemFromAlbum(mediaAlbum);

          return (
            <MediaCollectionTile
              key={mediaAlbum.id}
              mediaItem={mediaItem}
              mediaLink={StringUtils.buildRoute(Routes.LibraryAlbum, {
                albumId: mediaAlbum.id,
              })}
              mediaSubtitle={mediaAlbum.album_artist.artist_name}
              mediaContextMenuId={mediaContextMenuId}
            />
          );
        })}
      </div>
      <MediaCollectionContextMenu
        id={mediaContextMenuId}
        menuItems={[
          MediaCollectionContextMenuItem.AddToQueue,
          MediaCollectionContextMenuItem.Separator,
          MediaCollectionContextMenuItem.AddToPlaylist,
        ]}
      />
    </div>
  );
}
