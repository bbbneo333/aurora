import React from 'react';
import classNames from 'classnames/bind';

import { IMediaArtist } from '../../interfaces';
import { MediaUtils, StringUtils } from '../../utils';
import { Layout, Routes } from '../../constants';

import {
  MediaCollectionContextMenu,
  MediaCollectionContextMenuItem,
} from '../media-collection-context-menu/media-collection-context-menu.component';

import { MediaCollectionTile } from '../media-collection-tile/media-collection-tile.component';

import styles from './media-artists.component.css';

const cx = classNames.bind(styles);

export function MediaArtists(props: {
  mediaArtists: IMediaArtist[],
}) {
  const { mediaArtists } = props;
  const mediaContextMenuId = 'media_artists_context_menu';

  return (
    <div>
      <div className={cx('row', 'media-artists')}>
        {mediaArtists.map((mediaArtist) => {
          const mediaItem = MediaUtils.getMediaItemFromArtist(mediaArtist);

          return (
            <div className={Layout.Grid.CollectionTile} key={mediaArtist.id}>
              <MediaCollectionTile
                mediaItem={mediaItem}
                mediaLink={StringUtils.buildRoute(Routes.LibraryArtist, {
                  artistId: mediaArtist.id,
                })}
                mediaContextMenuId={mediaContextMenuId}
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
