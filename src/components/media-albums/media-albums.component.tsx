import React from 'react';
import classNames from 'classnames/bind';

import { Icons, Layout, Routes } from '../../constants';
import { IMediaAlbum } from '../../interfaces';
import { MediaCollectionService } from '../../services';
import { StringUtils } from '../../utils';

import {
  MediaCollectionContextMenu,
  MediaCollectionContextMenuItem,
} from '../media-collection-context-menu/media-collection-context-menu.component';

import { MediaCollectionTile } from '../media-collection-tile/media-collection-tile.component';

import styles from './media-albums.component.css';

const cx = classNames.bind(styles);

export function MediaAlbums(props: {
  mediaAlbums: IMediaAlbum[],
}) {
  const { mediaAlbums } = props;
  const mediaContextMenuId = 'media_albums_context_menu';

  return (
    <div>
      <div className={cx('row', 'media-albums')}>
        {mediaAlbums.map((mediaAlbum) => {
          const mediaItem = MediaCollectionService.getMediaItemFromAlbum(mediaAlbum);

          return (
            <div className={Layout.Grid.CollectionTile} key={mediaAlbum.id}>
              <MediaCollectionTile
                mediaItem={mediaItem}
                routerLink={StringUtils.buildRoute(Routes.LibraryAlbum, {
                  albumId: mediaAlbum.id,
                })}
                subtitle={mediaAlbum.album_artist.artist_name}
                contextMenuId={mediaContextMenuId}
                coverPlaceholderIcon={Icons.AlbumPlaceholder}
              />
            </div>
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
