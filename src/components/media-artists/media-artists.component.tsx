import React from 'react';
import classNames from 'classnames/bind';

import { Icons, Layout, Routes } from '../../constants';
import { IMediaArtist } from '../../interfaces';
import { StringUtils } from '../../utils';

import {
  MediaCollectionContextMenu,
  MediaCollectionContextMenuItem,
} from '../media-collection-context-menu/media-collection-context-menu.component';

import { MediaCollectionTile } from '../media-collection-tile/media-collection-tile.component';

import styles from './media-artists.component.css';
import { MediaCollectionService } from '../../services';

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
          const mediaItem = MediaCollectionService.getMediaItemFromArtist(mediaArtist);

          return (
            <div className={Layout.Grid.CollectionTile} key={mediaArtist.id}>
              <MediaCollectionTile
                mediaItem={mediaItem}
                routerLink={StringUtils.buildRoute(Routes.LibraryArtist, {
                  artistId: mediaArtist.id,
                })}
                contextMenuId={mediaContextMenuId}
                coverPlaceholderIcon={Icons.ArtistPlaceholder}
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
