import React, { useCallback } from 'react';
import classNames from 'classnames/bind';

import { useContextMenu } from '../../contexts';
import { useMediaCollectionPlayback } from '../../hooks';
import { IMediaCollectionItem } from '../../interfaces';

import { MediaCoverPicture } from '../media-cover-picture/media-cover-picture.component';
import { MediaPlaybackButton } from '../media-playback-button/media-playback-button.component';
import { RouterLink } from '../router-link/router-link.component';

import styles from './media-collection-tile.component.css';

const cx = classNames.bind(styles);

export type MediaCollectionTileProps = {
  mediaItem: IMediaCollectionItem;
  routerLink: string;
  subtitle?: string;
  contextMenuId?: string;
  coverPlaceholderIcon?: string;
};

export function MediaCollectionTile(props: MediaCollectionTileProps) {
  const {
    mediaItem,
    routerLink,
    subtitle,
    contextMenuId,
    coverPlaceholderIcon,
  } = props;

  const { showMenu } = useContextMenu();

  const {
    isMediaPlaying,
    play,
    pause,
  } = useMediaCollectionPlayback({
    mediaItem,
  });

  const handleOnContextMenu = useCallback((e: React.MouseEvent) => {
    if (contextMenuId) {
      showMenu({
        id: contextMenuId,
        event: e,
        props: { mediaItem },
      });
    }
  }, [
    showMenu,
    mediaItem,
    contextMenuId,
  ]);

  return (
    <RouterLink
      role="row"
      tabIndex={0}
      exact
      to={routerLink}
      className={cx('collection-tile', 'app-nav-link', {
        playing: isMediaPlaying,
      })}
      onContextMenu={handleOnContextMenu}
    >
      <div className={cx('collection-tile-content')}>
        <div className={cx('collection-tile-cover')}>
          <MediaCoverPicture
            mediaPicture={mediaItem.picture}
            mediaPictureAltText={mediaItem.name}
            mediaCoverPlaceholderIcon={coverPlaceholderIcon}
            className={cx('collection-tile-cover-picture')}
          />
          <div className={cx('collection-tile-cover-overlay')}>
            <div className={cx('collection-tile-cover-action')}>
              <MediaPlaybackButton
                isPlaying={isMediaPlaying}
                onPlay={play}
                onPause={pause}
                variant={['rounded', 'primary']}
                tabIndex={-1}
                className={cx('collection-tile-cover-action-button')}
              />
            </div>
          </div>
        </div>
        <div className={cx('collection-tile-info')}>
          <div className={cx('collection-tile-title')}>
            {mediaItem.name}
          </div>
          {subtitle && (
            <div className={cx('collection-tile-subtitle')}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </RouterLink>
  );
}
