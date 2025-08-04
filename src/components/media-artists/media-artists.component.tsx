import React from 'react';

import { IMediaArtist, IMediaCollectionItem } from '../../interfaces';
import { StringUtils } from '../../utils';
import { Routes } from '../../constants';

import {
  MediaCollectionContextMenu,
  MediaCollectionContextMenuId,
  MediaCollectionContextMenuItem,
} from '../media-collection-context-menu/media-collection-context-menu.component';

import { MediaCollectionTile } from '../media-collection-tile/media-collection-tile.component';

export function MediaArtists(props: {
  mediaArtists: IMediaArtist[],
}) {
  const {
    mediaArtists,
  } = props;

  return (
    <div>
      <div className="row">
        {mediaArtists.map((mediaArtist) => {
          const mediaItem: IMediaCollectionItem = {
            id: mediaArtist.id,
            name: mediaArtist.artist_name,
            type: 'artist',
            picture: mediaArtist.artist_feature_picture,
          };

          return (
            <MediaCollectionTile
              key={mediaArtist.id}
              mediaItem={mediaItem}
              mediaLink={StringUtils.buildRoute(Routes.LibraryArtist, {
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
