import React, {useCallback} from 'react';
import {useSelector} from 'react-redux';
import classNames from 'classnames/bind';
import {useContextMenu} from 'react-contexify';

import {Icons, Layout, Routes} from '../../constants';
import {MediaEnums} from '../../enums';
import {IMediaAlbum} from '../../interfaces';
import {RootState} from '../../reducers';
import {MediaLibraryService, MediaPlayerService} from '../../services';
import {StringUtils} from '../../utils';

import {Icon} from '../icon/icon.component';
import {MediaButtonComponent} from '../media-button/media-button.component';
import {MediaCoverPictureComponent} from '../media-cover-picture/media-cover-picture.component';
import {RouterLink} from '../router-link/router-link.component';

import styles from './media-album-tile.component.css';

const cx = classNames.bind(styles);

export function MediaAlbumTile(props: {
  mediaAlbum: IMediaAlbum,
  mediaAlbumContextMenuId?: string,
}) {
  const {
    mediaAlbum,
    mediaAlbumContextMenuId,
  } = props;

  const {show} = useContextMenu();

  const {
    mediaPlaybackState,
    mediaPlaybackCurrentTrackList,
  } = useSelector((state: RootState) => state.mediaPlayer);

  const isMediaAlbumPlaying = mediaPlaybackState === MediaEnums.MediaPlaybackState.Playing
    && mediaPlaybackCurrentTrackList
    && mediaPlaybackCurrentTrackList.id === mediaAlbum.id;

  const handleOnLibraryAlbumPlayButtonClick = useCallback((e: Event) => {
    MediaLibraryService
      .getMediaAlbumTracks(mediaAlbum.id)
      .then((mediaAlbumTracks) => {
        MediaPlayerService.playMediaTracks(mediaAlbumTracks, {
          id: mediaAlbum.id,
        });
      });

    // this action button resides within a link which opens up an album
    // stop propagation to prevent that
    e.preventDefault();
    e.stopPropagation();
  }, [
    mediaAlbum,
  ]);

  const handleOnLibraryAlbumPauseButtonClick = useCallback((e: Event) => {
    MediaPlayerService.pauseMediaPlayer();

    // this action button resides within a link which opens up an album
    // stop propagation to prevent that
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleOnContextMenu = useCallback((e: React.MouseEvent) => {
    if (mediaAlbumContextMenuId) {
      show(e, {
        id: mediaAlbumContextMenuId,
        props: {
          mediaAlbum,
        },
      });
    }
  }, [
    show,
    mediaAlbum,
    mediaAlbumContextMenuId,
  ]);

  return (
    <div className={cx(Layout.Grid.LibraryAlbumTile, 'mb-3')} onContextMenu={handleOnContextMenu}>
      <div className={cx('album-tile', {
        playing: isMediaAlbumPlaying,
      })}
      >
        <RouterLink
          exact
          to={StringUtils.buildRouteFromMappings(Routes.LibraryAlbum, {
            albumId: mediaAlbum.id,
          })}
          className={cx('album-tile-link', 'app-nav-link')}
        >
          <div className={cx('album-tile-body')}>
            <div className={cx('album-tile-cover')}>
              <MediaCoverPictureComponent
                mediaPicture={mediaAlbum.album_cover_picture}
                mediaPictureAltText={mediaAlbum.album_name}
                className={cx('album-tile-cover-picture')}
              />
              <div className={cx('album-tile-cover-overlay')}>
                <div className={cx('album-tile-cover-action')}>
                  {
                    isMediaAlbumPlaying
                      ? (
                        <MediaButtonComponent
                          className={cx('album-tile-action-button')}
                          onButtonSubmit={handleOnLibraryAlbumPauseButtonClick}
                        >
                          <Icon name={Icons.MediaPause}/>
                        </MediaButtonComponent>
                      )
                      : (
                        <MediaButtonComponent
                          className={cx('album-tile-action-button')}
                          onButtonSubmit={handleOnLibraryAlbumPlayButtonClick}
                        >
                          <Icon name={Icons.MediaPlay}/>
                        </MediaButtonComponent>
                      )
                  }
                </div>
              </div>
            </div>
            <div className={cx('album-tile-info')}>
              <div className={cx('album-tile-title')}>
                {mediaAlbum.album_name}
              </div>
              <div className={cx('album-tile-subtitle')}>
                {mediaAlbum.album_artist.artist_name}
              </div>
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
  );
}
