import React, { useState } from 'react';
import classNames from 'classnames/bind';

import { Icons, Routes } from '../../constants';
import { IMediaPlaylist } from '../../interfaces';
import { I18nService, MediaCollectionService } from '../../services';
import { StringUtils } from '../../utils';

import { MediaCollectionTile } from '../media-collection-tile/media-collection-tile.component';
import { MediaPlaylistSideView } from '../media-sideview/media-sideview.component';

import {
  MediaCollectionContextMenu,
  MediaCollectionContextMenuItem,
} from '../media-collection-context-menu/media-collection-context-menu.component';

import styles from './media-playlists.component.css';

const cx = classNames.bind(styles);

export function MediaPlaylists(props: {
  mediaPlaylists: IMediaPlaylist[],
}) {
  const { mediaPlaylists } = props;
  const mediaContextMenuId = 'media_playlists_context_menu';
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | undefined>();

  return (
    <>
      <div className={cx('media-playlists')}>
        {mediaPlaylists.map((mediaPlaylist) => {
          const mediaItem = MediaCollectionService.getMediaItemFromPlaylist(mediaPlaylist);

          return (
            <div key={mediaPlaylist.id}>
              <MediaCollectionTile
                mediaItem={mediaItem}
                contextMenuId={mediaContextMenuId}
                routerLink={StringUtils.buildRoute(Routes.LibraryPlaylist, {
                  playlistId: mediaPlaylist.id,
                })}
                subtitle={I18nService.getString('label_playlist_subtitle', {
                  trackCount: mediaPlaylist.tracks.length.toString(),
                })}
                onClick={() => setSelectedPlaylistId(mediaPlaylist.id)}
                coverPlaceholderIcon={Icons.PlaylistPlaceholder}
              />
            </div>
          );
        })}
      </div>
      <MediaCollectionContextMenu
        id={mediaContextMenuId}
        menuItems={[
          MediaCollectionContextMenuItem.AddToQueue,
          MediaCollectionContextMenuItem.ManagePlaylist,
          MediaCollectionContextMenuItem.ToggleHidden,
        ]}
      />
      {selectedPlaylistId && (
        <MediaPlaylistSideView
          playlistId={selectedPlaylistId}
          onClose={() => setSelectedPlaylistId(undefined)}
        />
      )}
    </>
  );
}
