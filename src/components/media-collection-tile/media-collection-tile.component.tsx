import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import classNames from 'classnames/bind';
import { useContextMenu } from 'react-contexify';

import { Icons, Layout } from '../../constants';
import { MediaEnums } from '../../enums';
import { IMediaCollectionItem } from '../../interfaces';
import { RootState } from '../../reducers';
import { MediaLibraryService, MediaPlayerService } from '../../services';

import { Icon } from '../icon/icon.component';
import { MediaButtonComponent } from '../media-button/media-button.component';
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

  const { show } = useContextMenu();

  const {
    mediaPlaybackState,
    mediaPlaybackCurrentTrackList,
  } = useSelector((state: RootState) => state.mediaPlayer);

  const isMediaPlaying = mediaPlaybackState === MediaEnums.MediaPlaybackState.Playing
    && mediaPlaybackCurrentTrackList
    && mediaPlaybackCurrentTrackList.id === mediaItem.id;

  const handleOnPlayButtonClick = useCallback((e: Event) => {
    MediaLibraryService
      .getMediaCollectionTracks(mediaItem)
      .then((mediaTracks) => {
        MediaPlayerService.playMediaTracks(mediaTracks, {
          id: mediaItem.id,
        });
      });

    // this action button resides within a link
    // stop propagation to prevent that
    e.preventDefault();
    e.stopPropagation();
  }, [
    mediaItem.id,
  ]);

  const handleOnPauseButtonClick = useCallback((e: Event) => {
    MediaPlayerService.pauseMediaPlayer();

    // this action button resides within a link
    // stop propagation to prevent that
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleOnContextMenu = useCallback((e: React.MouseEvent) => {
    if (mediaContextMenuId) {
      show(e, {
        id: mediaContextMenuId,
        props: {
          mediaItem,
        },
      });
    }
  }, [
    show,
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
                className={cx('collection-tile-cover-picture')}
              />
              <div className={cx('collection-tile-cover-overlay')}>
                <div className={cx('collection-tile-cover-action')}>
                  {
                    isMediaPlaying
                      ? (
                        <MediaButtonComponent
                          className={cx('collection-tile-action-button')}
                          onButtonSubmit={handleOnPauseButtonClick}
                        >
                          <Icon name={Icons.MediaPause}/>
                        </MediaButtonComponent>
                      )
                      : (
                        <MediaButtonComponent
                          className={cx('collection-tile-action-button')}
                          onButtonSubmit={handleOnPlayButtonClick}
                        >
                          <Icon name={Icons.MediaPlay}/>
                        </MediaButtonComponent>
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
