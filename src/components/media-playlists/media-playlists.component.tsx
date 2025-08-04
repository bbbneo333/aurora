import { isEmpty } from 'lodash';
import React from 'react';

import { IMediaCollectionItem, IMediaPlaylist } from '../../interfaces';
import { StringUtils } from '../../utils';
import { Routes } from '../../constants';
import { I18nService } from '../../services';

import { MediaCollectionItem } from '../media-collection-item/media-collection-item.component';

import {
  MediaCollectionContextMenu,
  MediaCollectionContextMenuId,
  MediaCollectionContextMenuItem,
} from '../media-collection-context-menu/media-collection-context-menu.component';

export function MediaPlaylists(props: {
  mediaPlaylists: IMediaPlaylist[],
}) {
  const {
    mediaPlaylists,
  } = props;

  return (
    <div>
      <div className="row">
        {mediaPlaylists.map((mediaPlaylist) => {
          const mediaItem: IMediaCollectionItem = {
            id: mediaPlaylist.id,
            name: mediaPlaylist.name,
            type: 'playlist',
            picture: mediaPlaylist.cover_picture,
          };

          return (
            <MediaCollectionItem
              key={mediaPlaylist.id}
              mediaItem={mediaItem}
              contextMenuId={MediaCollectionContextMenuId}
              routerLink={StringUtils.buildRoute(Routes.LibraryPlaylist, {
                playlistId: mediaPlaylist.id,
              })}
              subtitle={I18nService.getString('label_playlist_subtitle', {
                trackCount: mediaPlaylist.tracks.length.toString(),
              })}
              disablePlayback={isEmpty(mediaPlaylist.tracks)}
            />
          );
        })}
      </div>
      <MediaCollectionContextMenu
        menuItems={[
          MediaCollectionContextMenuItem.AddToQueue,
          MediaCollectionContextMenuItem.Separator,
          MediaCollectionContextMenuItem.ManagePlaylist,
        ]}
      />
    </div>
  );
}
