import React, { HTMLAttributes, useCallback, useMemo } from 'react';
import classNames from 'classnames/bind';

import { useContextMenu } from '../../contexts';
import { useMediaCollectionPlayback } from '../../hooks';
import { IMediaCollectionItem } from '../../interfaces';

import { RouterLink } from '../router-link/router-link.component';
import { MediaPlaybackButton } from '../media-playback-button/media-playback-button.component';
import { MediaCoverPicture } from '../media-cover-picture/media-cover-picture.component';
import { Text } from '../text/text.component';

import styles from './media-collection-item.component.css';

const cx = classNames.bind(styles);

export type MediaCollectionItemProps = {
  mediaItem: IMediaCollectionItem;
  routerLink: string;
  coverPlaceholderIcon?: string;
  contextMenuId?: string;
  subtitle?: string;
  disablePlayback?: boolean;
  disableCover?: boolean;
  className?: string;
  variant?: 'default' | 'compact';
} & HTMLAttributes<HTMLAnchorElement>;

export function MediaCollectionItem(props: MediaCollectionItemProps) {
  const {
    mediaItem,
    routerLink,
    coverPlaceholderIcon,
    subtitle,
    contextMenuId,
    disablePlayback = false,
    disableCover = false,
    className,
    variant = 'default',
    ...rest
  } = props;

  const { showMenu } = useContextMenu();

  const {
    isMediaActive,
    isMediaPlaying,
    play,
    pause,
    toggle,
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

  const PlaybackButton = useMemo(() => (() => (
    <MediaPlaybackButton
      isPlaying={isMediaPlaying}
      disabled={disablePlayback}
      className={cx('collection-item-playback-button')}
      onPlay={play}
      onPause={pause}
      tabIndex={-1}
    />
  )), [
    disablePlayback,
    isMediaPlaying,
    pause,
    play,
  ]);

  return (
    <RouterLink
      {...rest}
      role="row"
      tabIndex={0}
      exact
      to={routerLink}
      activeClassName={cx('active')}
      className={cx('collection-item', 'app-nav-link', variant, {
        current: isMediaActive,
        selected: rest['aria-selected'],
      }, className)}
      onContextMenu={handleOnContextMenu}
      onDoubleClick={toggle}
    >
      <div className={cx('collection-item-content')}>
        {variant !== 'compact' && (
          <div className={cx('collection-item-section')}>
            <PlaybackButton/>
          </div>
        )}
        {!disableCover && (
          <div className={cx('collection-item-section')}>
            <MediaCoverPicture
              mediaPicture={mediaItem.picture}
              mediaPictureAltText={mediaItem.name}
              mediaCoverPlaceholderIcon={coverPlaceholderIcon}
              className={cx('collection-item-cover')}
              contentClassName={cx('collection-item-cover-content')}
            >
              {variant === 'compact' && (
                <PlaybackButton/>
              )}
            </MediaCoverPicture>
          </div>
        )}
        <div className={cx('collection-item-section', 'collection-item-info')}>
          <div className={cx('collection-item-info-title')}>
            <Text>
              {mediaItem.name}
            </Text>
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
