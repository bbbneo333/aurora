import React, { useCallback } from 'react';
import classNames from 'classnames/bind';

import { useMediaCollectionPlayback } from '../../hooks';
import { IMediaCollectionItem } from '../../interfaces';
import { useContextMenu } from '../../contexts';

import { RouterLink } from '../router-link/router-link.component';
import { MediaPlaybackButton } from '../media-playback-button/media-playback-button.component';
import { MediaCoverPicture } from '../media-cover-picture/media-cover-picture.component';

import styles from './media-collection-item.component.css';

const cx = classNames.bind(styles);

export type MediaCollectionItemProps = {
  mediaItem: IMediaCollectionItem;
  routerLink: string;
  contextMenuId?: string;
  subtitle?: string;
  disablePlayback?: boolean;
  disableCover?: boolean;
};

export function MediaCollectionItem(props: MediaCollectionItemProps) {
  const {
    mediaItem,
    routerLink,
    subtitle,
    contextMenuId,
    disablePlayback = false,
    disableCover = false,
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
      className={cx('collection-item', 'app-nav-link')}
      onContextMenu={handleOnContextMenu}
    >
      <div className={cx('collection-item-content')}>
        <div className={cx('collection-item-section')}>
          <MediaPlaybackButton
            isPlaying={isMediaPlaying}
            disabled={disablePlayback}
            className={cx('collection-item-playback-button')}
            onPlay={play}
            onPause={pause}
            tabIndex={-1}
          />
        </div>
        {!disableCover && (
          <div className={cx('collection-item-section')}>
            <MediaCoverPicture
              mediaPicture={mediaItem.picture}
              mediaPictureAltText={mediaItem.name}
              className={cx('collection-item-cover')}
            />
          </div>
        )}
        <div className={cx('collection-item-section', 'collection-item-info')}>
          <div className={cx('collection-item-info-title')}>
            {mediaItem.name}
          </div>
          {subtitle && (
            <div className={cx('collection-item-info-subtitle')}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </RouterLink>
  );
}
