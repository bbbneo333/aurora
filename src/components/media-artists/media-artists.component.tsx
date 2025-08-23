import React from 'react';

import { IMediaArtist } from '../../interfaces';
import { MediaUtils, StringUtils } from '../../utils';
import { Routes } from '../../constants';

import {
  MediaCollectionContextMenu,
  MediaCollectionContextMenuItem,
} from '../media-collection-context-menu/media-collection-context-menu.component';

import { MediaCollectionTile } from '../media-collection-tile/media-collection-tile.component';

export function MediaArtists(props: {
  mediaArtists: IMediaArtist[],
}) {
  const { mediaArtists } = props;
  const mediaContextMenuId = 'media_artists_context_menu';

  return (
    <div>
      <div className="row">
        {mediaArtists.map((mediaArtist) => {
          const mediaItem = MediaUtils.getMediaItemFromArtist(mediaArtist);

          return (
            <MediaCollectionTile
              key={mediaArtist.id}
              mediaItem={mediaItem}
              mediaLink={StringUtils.buildRoute(Routes.LibraryArtist, {
                artistId: mediaArtist.id,
              })}
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
