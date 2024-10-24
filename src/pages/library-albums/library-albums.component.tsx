import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
  MediaCollectionTile,
  MediaCollectionContextMenu,
  MediaCollectionContextMenuItem,
  MediaCollectionContextMenuId,
} from '../../components';
import { RootState } from '../../reducers';
import { MediaLibraryService } from '../../services';
import { StringUtils } from '../../utils';
import { Routes } from '../../constants';
import { IMediaCollectionItem } from '../../interfaces';

export function LibraryAlbumsComponent() {
  const { mediaAlbums } = useSelector((state: RootState) => state.mediaLibrary);

  useEffect(() => {
    MediaLibraryService.loadMediaAlbums();
  }, []);

  return (
    <div className="container-fluid">
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
