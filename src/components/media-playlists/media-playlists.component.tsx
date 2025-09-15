import { isEmpty } from 'lodash';
import React from 'react';
import classNames from 'classnames/bind';

import { Routes } from '../../constants';
import { IMediaPlaylist } from '../../interfaces';
import { I18nService, MediaCollectionService } from '../../services';
import { StringUtils } from '../../utils';

import { MediaCollectionItem } from '../media-collection-item/media-collection-item.component';

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

  return (
    <>
      <div className={cx('media-playlists')}>
        {mediaPlaylists.map((mediaPlaylist) => {
          const mediaItem = MediaCollectionService.getMediaItemFromPlaylist(mediaPlaylist);

          return (
            <MediaCollectionItem
              key={mediaPlaylist.id}
              mediaItem={mediaItem}
              contextMenuId={mediaContextMenuId}
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
        id={mediaContextMenuId}
        menuItems={[
          MediaCollectionContextMenuItem.AddToQueue,
          MediaCollectionContextMenuItem.Separator,
          MediaCollectionContextMenuItem.ManagePlaylist,
        ]}
      />
    </>
  );
}
