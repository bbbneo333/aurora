import React from 'react';
import {useSelector} from 'react-redux';
import classNames from 'classnames/bind';
import {NavLink} from 'react-router-dom';

import {MediaCoverPictureComponent} from '../../components';
import {Routes} from '../../constants';
import {IMediaAlbum} from '../../interfaces';
import {RootState} from '../../reducers';
import {StringUtils} from '../../utils';

import styles from './library-albums.component.css';

const cx = classNames.bind(styles);

function LibraryAlbumTile(props: {mediaAlbum: IMediaAlbum}) {
  const {mediaAlbum} = props;

  return (
    <div className={cx('library-album-tile')}>
      <NavLink
        exact
        to={StringUtils.buildFromMappings(Routes.LibraryAlbum, {
          albumId: mediaAlbum.id,
        })}
        className={cx('library-album-tile-link', 'app-nav-link')}
      >
        <div className={cx('library-album-tile-body')}>
          {mediaAlbum.album_cover_picture && (
            <div className={cx('library-album-tile-cover')}>
              <MediaCoverPictureComponent
                mediaPicture={mediaAlbum.album_cover_picture}
                mediaPictureAltText={mediaAlbum.album_name}
                className={cx('library-album-tile-cover-picture')}
              />
            </div>
          )}
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
  );
}

export function LibraryAlbumsComponent() {
  const {mediaAlbums} = useSelector((state: RootState) => state.mediaLibrary);

  return (
    <div className="container">
      <div className="row library-album-row">
        {mediaAlbums.map(mediaAlbum => (
          <div className="col-sm-3">
            <LibraryAlbumTile key={mediaAlbum.id} mediaAlbum={mediaAlbum}/>
          </div>
        ))}
      </div>
    </div>
  );
}
