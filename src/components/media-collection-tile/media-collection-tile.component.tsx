import React, { useCallback } from 'react';
import classNames from 'classnames/bind';
import { capitalize } from 'lodash';

import { Icons, Layout } from '../../constants';
import { useContextMenu } from '../../contexts';
import { useMediaPlayback } from '../../hooks';
import { IMediaCollectionItem } from '../../interfaces';

import { Icon } from '../icon/icon.component';
import { Button } from '../button/button.component';
import { MediaCoverPicture } from '../media-cover-picture/media-cover-picture.component';
import { RouterLink } from '../router-link/router-link.component';

import styles from './media-collection-tile.component.css';

const cx = classNames.bind(styles);

export function MediaCollectionTile(props: {
  mediaItem: IMediaCollectionItem,
  mediaRouterLink: string,
  mediaSubtitle?: string,
  mediaContextMenuId?: string,
}) {
  const {
    mediaItem,
    mediaRouterLink,
    mediaSubtitle,
    mediaContextMenuId,
  } = props;

  const { showMenu } = useContextMenu();
  const { isMediaPlaying, handleOnPlayButtonClick, handleOnPauseButtonClick } = useMediaPlayback({
    mediaItem,
  });

  const handleOnContextMenu = useCallback((e: React.MouseEvent) => {
    if (mediaContextMenuId) {
      showMenu({
        id: mediaContextMenuId,
        event: e,
        props: { mediaItem },
      });
    }
  }, [
    showMenu,
    mediaItem,
    mediaContextMenuId,
  ]);

  return (
    <div className={cx(Layout.Grid.CollectionTile, 'mb-3')} onContextMenu={handleOnContextMenu}>
      <div className={cx('collection-tile', {
        playing: isMediaPlaying,
      })}
      >
        <RouterLink
          exact
          to={mediaRouterLink}
          className={cx('collection-tile-link', 'app-nav-link')}
        >
          <div className={cx('collection-tile-body')}>
            <div className={cx('collection-tile-cover')}>
              <MediaCoverPicture
                mediaPicture={mediaItem.picture}
                mediaPictureAltText={mediaItem.name}
                // @ts-ignore
                mediaCoverPlaceholderIcon={Icons[`${capitalize(mediaItem.type)}TilePlaceholder`]}
                className={cx('collection-tile-cover-picture')}
              />
              <div className={cx('collection-tile-cover-overlay')}>
                <div className={cx('collection-tile-cover-action')}>
                  {
                    isMediaPlaying
                      ? (
                        <Button
                          className={cx('collection-tile-action-button')}
                          onButtonSubmit={handleOnPauseButtonClick}
                        >
                          <Icon name={Icons.MediaPause}/>
                        </Button>
                      )
                      : (
                        <Button
                          className={cx('collection-tile-action-button')}
                          onButtonSubmit={handleOnPlayButtonClick}
                        >
                          <Icon name={Icons.MediaPlay}/>
                        </Button>
                      )
                  }
                </div>
              </div>
            </div>
            <div className={cx('collection-tile-info')}>
              <div className={cx('collection-tile-title')}>
                {mediaItem.name}
              </div>
              {mediaSubtitle && (
                <div className={cx('collection-tile-subtitle')}>
                  {mediaSubtitle}
                </div>
              )}
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
  );
}
