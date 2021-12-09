import React, {useEffect} from 'react';
import classNames from 'classnames/bind';
import {useParams} from 'react-router-dom';
import {useSelector} from 'react-redux';
import * as _ from 'lodash';

import {
  MediaAlbumTrackContextMenu,
  MediaCoverPictureComponent,
  MediaTrackArtistLinkComponent,
  MediaTrackListComponent,
} from '../../components';

import {Layout} from '../../constants';
import {RootState} from '../../reducers';
import {I18nService, MediaLibraryService} from '../../services';

import styles from './library-album.component.css';

const cx = classNames.bind(styles);

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

  const mediaAlbumHasCover = !_.isNil(mediaSelectedAlbum.album_cover_picture);

  return (
    <div className={cx('library-album')}>
      <div className="container-fluid">
        <div className={cx('library-album-header')}>
          <div className="row">
            {mediaAlbumHasCover && (
              <div className={cx(Layout.Grid.LibraryAlbumHeaderCoverColumn, 'library-album-header-cover-column')}>
                <MediaCoverPictureComponent
                  mediaPicture={mediaSelectedAlbum.album_cover_picture}
                  mediaPictureAltText={mediaSelectedAlbum.album_name}
                  className={cx('library-album-cover-picture')}
                />
              </div>
            )}
            <div className={cx(
              mediaAlbumHasCover ? Layout.Grid.LibraryAlbumHeaderInfoColumn : 'col-12',
              'library-album-header-info-column',
            )}
            >
              <div className={cx('library-album-header-label')}>
                {I18nService.getString('label_library_album_header')}
              </div>
              <div className={cx('library-album-header-name')}>
                {mediaSelectedAlbum.album_name}
              </div>
              <div className={cx('library-album-header-info')}>
                <MediaTrackArtistLinkComponent mediaArtist={mediaSelectedAlbum.album_artist}/>
              </div>
            </div>
          </div>
        </div>
        <div className={cx('library-album-actions')}/>
        <div className={cx('library-album-tracklist')}>
          <MediaTrackListComponent
            mediaTracks={mediaSelectedAlbumTracks}
            mediaTrackList={{
              id: mediaSelectedAlbum.id,
            }}
            showCovers={false}
          />
          <MediaAlbumTrackContextMenu mediaAlbum={mediaSelectedAlbum}/>
        </div>
      </div>
    </div>
  );
}
