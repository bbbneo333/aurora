import React, {useEffect} from 'react';
import classNames from 'classnames/bind';
import {useParams} from 'react-router-dom';
import {useSelector} from 'react-redux';

import {MediaCoverPictureComponent, MediaTrackComponent} from '../../components';
import {IMediaTrack} from '../../interfaces';
import {RootState} from '../../reducers';
import {I18nService, MediaLibraryService} from '../../services';

import styles from './library-album.component.css';

const cx = classNames.bind(styles);

function LibraryAlbumTrackComponent(props: {mediaTrack: IMediaTrack}) {
  const {
    mediaTrack,
  } = props;

  return (
    <MediaTrackComponent mediaTrack={mediaTrack}/>
  );
}

export function LibraryAlbumComponent() {
  const {
    albumId,
  } = useParams() as {albumId: string};

  const {
    mediaSelectedAlbum,
    mediaSelectedAlbumTracks,
  } = useSelector((state: RootState) => state.mediaLibrary);

  useEffect(() => {
    MediaLibraryService.loadMediaAlbum(albumId);
  }, [
    albumId,
  ]);

  if (!mediaSelectedAlbum || !mediaSelectedAlbumTracks) {
    return (<></>);
  }

  return (
    <div className={cx('library-album')}>
      <div className="container-fluid">
        <div className={cx('library-album-header')}>
          <div className="row">
            <div className={cx('col-3', 'library-album-header-cover-column')}>
              {mediaSelectedAlbum.album_cover_picture && (
                <MediaCoverPictureComponent
                  mediaPicture={mediaSelectedAlbum.album_cover_picture}
                  mediaPictureAltText={mediaSelectedAlbum.album_name}
                  className={cx('library-album-cover-picture')}
                />
              )}
            </div>
            <div className={cx('col-8', 'library-album-header-info-column')}>
              <div className={cx('library-album-header-label')}>
                {I18nService.getString('label_library_album_header')}
              </div>
              <div className={cx('library-album-header-name')}>
                {mediaSelectedAlbum.album_name}
              </div>
            </div>
          </div>
        </div>
        <div className={cx('library-album-actions')}/>
        <div className={cx('library-album-tracklist')}>
          <div className="row">
            {mediaSelectedAlbumTracks.map(mediaTrack => (
              <LibraryAlbumTrackComponent
                key={mediaTrack.id}
                mediaTrack={mediaTrack}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
