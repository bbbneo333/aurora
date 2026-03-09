import React, { useState } from 'react';
import classNames from 'classnames/bind';

import { Icons, Routes } from '../../constants';
import { IMediaAlbum } from '../../interfaces';
import { MediaCollectionService } from '../../services';
import { StringUtils } from '../../utils';

import {
  MediaCollectionContextMenu,
  MediaCollectionContextMenuItem,
} from '../media-collection-context-menu/media-collection-context-menu.component';

import { MediaCollectionTile } from '../media-collection-tile/media-collection-tile.component';
import { MediaAlbumSideView } from '../media-sideview/media-sideview.component';

import styles from './media-albums.component.css';

const cx = classNames.bind(styles);

export function MediaAlbums(props: {
  mediaAlbums: IMediaAlbum[],
  coverSize?: number,
  hideArtist?: boolean,
}) {
  const { mediaAlbums, coverSize, hideArtist } = props;
  const mediaContextMenuId = 'media_albums_context_menu';
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | undefined>();

  const visibleAlbums = mediaAlbums.filter(album => !album.hidden);

  const containerStyle = coverSize ? {
    '--album-cover-size': `${coverSize}px`,
  } as React.CSSProperties : undefined;

  return (
    <div>
      <div className={cx('media-albums')} style={containerStyle}>
        {visibleAlbums.map((mediaAlbum) => {
          const mediaItem = MediaCollectionService.getMediaItemFromAlbum(mediaAlbum);

          return (
            <div key={mediaAlbum.id}>
              <MediaCollectionTile
                mediaItem={mediaItem}
                routerLink={StringUtils.buildRoute(Routes.LibraryAlbum, {
                  albumId: mediaAlbum.id,
                })}
                onClick={() => setSelectedAlbumId(mediaAlbum.id)}
                subtitle={hideArtist ? undefined : mediaAlbum.album_artist.artist_name}
                contextMenuId={mediaContextMenuId}
                coverPlaceholderIcon={Icons.AlbumPlaceholder}
                year={mediaAlbum.album_year}
                genre={mediaAlbum.album_genre}
              />
            </div>
          );
        })}
      </div>
      <MediaCollectionContextMenu
        id={mediaContextMenuId}
        menuItems={[
          MediaCollectionContextMenuItem.AddToQueue,
          MediaCollectionContextMenuItem.AddToPlaylist,
          MediaCollectionContextMenuItem.Separator,
          MediaCollectionContextMenuItem.ToggleHidden,
        ]}
      />
      {selectedAlbumId && (
        <MediaAlbumSideView
          albumId={selectedAlbumId}
          onClose={() => setSelectedAlbumId(undefined)}
        />
      )}
    </div>
  );
}
