import React, {useCallback} from 'react';
import {useSelector} from 'react-redux';
import classNames from 'classnames/bind';
import {NavLink} from 'react-router-dom';

import {MediaButtonComponent, MediaCoverPictureComponent} from '../../components';
import {Layout, Routes} from '../../constants';
import {MediaEnums} from '../../enums';
import {IMediaAlbum} from '../../interfaces';
import {RootState} from '../../reducers';
import {MediaLibraryService, MediaPlayerService} from '../../services';
import {MediaUtils, StringUtils} from '../../utils';

import styles from './library-albums.component.css';

const cx = classNames.bind(styles);

function LibraryAlbumTile(props: {mediaAlbum: IMediaAlbum}) {
  const {mediaAlbum} = props;

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
        const mediaAlbumTracksSorted = MediaUtils.mediaAlbumTrackSort(mediaAlbumTracks);

        MediaPlayerService.playMediaTracks(mediaAlbumTracksSorted, {
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

  return (
    <div className={cx(Layout.Grid.LibraryAlbumTile, 'mb-3')}>
      <div className={cx('library-album-tile', {
        playing: isMediaAlbumPlaying,
      })}
      >
        <NavLink
          exact
          to={StringUtils.buildRouteFromMappings(Routes.LibraryAlbum, {
            albumId: mediaAlbum.id,
          })}
          className={cx('library-album-tile-link', 'app-nav-link')}
        >
          <div className={cx('library-album-tile-body')}>
            <div className={cx('library-album-tile-cover')}>
              <MediaCoverPictureComponent
                mediaPicture={mediaAlbum.album_cover_picture}
                mediaPictureAltText={mediaAlbum.album_name}
                className={cx('library-album-tile-cover-picture')}
              />
              <div className={cx('library-album-tile-cover-action')}>
                {
                  isMediaAlbumPlaying
                    ? (
                      <MediaButtonComponent
                        className={cx('library-album-tile-action-button')}
                        onButtonSubmit={handleOnLibraryAlbumPauseButtonClick}
                      >
                        <i className="fas fa-pause"/>
                      </MediaButtonComponent>
                    )
                    : (
                      <MediaButtonComponent
                        className={cx('library-album-tile-action-button')}
                        onButtonSubmit={handleOnLibraryAlbumPlayButtonClick}
                      >
                        <i className="fas fa-play"/>
                      </MediaButtonComponent>
                    )
                }
              </div>
            </div>
            <div className={cx('library-album-tile-info')}>
              <div className={cx('library-album-tile-title')}>
                {mediaAlbum.album_name}
              </div>
              <div className={cx('library-album-tile-subtitle')}>
                {mediaAlbum.album_artist.artist_name}
              </div>
            </div>
          </div>
        </NavLink>
      </div>
    </div>
  );
}

export function LibraryAlbumsComponent() {
  const {mediaAlbums} = useSelector((state: RootState) => state.mediaLibrary);

  return (
    <div className="container">
      <div className="row library-album-row">
        {mediaAlbums.map(mediaAlbum => (
          <LibraryAlbumTile
            key={mediaAlbum.id}
            mediaAlbum={mediaAlbum}
          />
        ))}
      </div>
    </div>
  );
}
