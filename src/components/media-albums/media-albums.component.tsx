import React from 'react';

import { IMediaAlbum, IMediaCollectionItem } from '../../interfaces';
import { StringUtils } from '../../utils';
import { Routes } from '../../constants';
import {
  MediaCollectionContextMenu, MediaCollectionContextMenuId, MediaCollectionContextMenuItem,
} from '../media-collection-context-menu/media-collection-context-menu.component';
import { MediaCollectionTile } from '../media-collection-tile/media-collection-tile.component';

export function MediaAlbums(props: {
  mediaAlbums: IMediaAlbum[],
}) {
  const {
    mediaAlbums,
  } = props;

  return (
    <div>
      <div className="row">
        {mediaAlbums.map((mediaAlbum) => {
          const mediaItem: IMediaCollectionItem = {
            id: mediaAlbum.id,
            name: mediaAlbum.album_name,
            type: 'album',
            picture: mediaAlbum.album_cover_picture,
          };

          return (
            <MediaCollectionTile
              key={mediaAlbum.id}
              mediaItem={mediaItem}
              mediaRouterLink={StringUtils.buildRouteFromMappings(Routes.LibraryAlbum, {
                albumId: mediaAlbum.id,
              })}
              mediaSubtitle={mediaAlbum.album_artist.artist_name}
              mediaContextMenuId={MediaCollectionContextMenuId}
            />
          );
        })}
      </div>
      <MediaCollectionContextMenu
        menuItems={[
          MediaCollectionContextMenuItem.AddToQueue,
          MediaCollectionContextMenuItem.Separator,
          MediaCollectionContextMenuItem.AddToPlaylist,
        ]}
      />
    </div>
  );
}
