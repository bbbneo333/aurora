import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { RootState } from '../../reducers';
import { MediaLibraryService } from '../../services';
import {
  MediaCollectionContextMenu,
  MediaCollectionContextMenuItem,
  MediaCollectionTile,
  MediaCollectionContextMenuId,
} from '../../components';
import { StringUtils } from '../../utils';
import { Routes } from '../../constants';
import { IMediaCollectionItem } from '../../interfaces';

export function ArtistsPage() {
  const { mediaArtists } = useSelector((state: RootState) => state.mediaLibrary);

  useEffect(() => {
    MediaLibraryService.loadMediaArtists();
  }, []);

  return (
    <div className="container-fluid">
      <div className="row">
        {mediaArtists.map((mediaArtist) => {
          const mediaItem: IMediaCollectionItem = {
            id: mediaArtist.id,
            type: 'artist',
            name: mediaArtist.artist_name,
            picture: mediaArtist.artist_feature_picture,
          };

          return (
            <MediaCollectionTile
              key={mediaArtist.id}
              mediaItem={mediaItem}
              mediaRouterLink={StringUtils.buildRouteFromMappings(Routes.LibraryArtist, {
                artistId: mediaArtist.id,
              })}
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
