import React, { useEffect } from 'react';
import classNames from 'classnames/bind';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import {
  MediaCoverPicture,
  MediaArtistLinkComponent,
  MediaTrackContextMenu,
  MediaTrackListComponent,
  MediaTrackContextMenuItem,
} from '../../components';

import { Layout } from '../../constants';
import { RootState } from '../../reducers';
import { I18nService, MediaLibraryService } from '../../services';

import styles from './library-album.component.css';

const cx = classNames.bind(styles);

enum MediaContextMenus {
  AlbumTrack = 'media_album_track_context_menu',
}

export function LibraryAlbumComponent() {
  const {
    albumId,
  } = useParams() as { albumId: string };

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
    <div className="container-fluid">
      <div className={cx('library-album-header')}>
        <div className="row">
          <div className={cx(Layout.Grid.LibraryAlbumHeaderCoverColumn, 'library-album-header-cover-column')}>
            <MediaCoverPicture
              mediaPicture={mediaSelectedAlbum.album_cover_picture}
              mediaPictureAltText={mediaSelectedAlbum.album_name}
              className={cx('library-album-cover-picture')}
            />
          </div>
          <div className={cx(Layout.Grid.LibraryAlbumHeaderInfoColumn, 'library-album-header-info-column')}>
            <div className={cx('library-album-header-label')}>
              {I18nService.getString('label_library_album_header')}
            </div>
            <div className={cx('library-album-header-name')}>
              {mediaSelectedAlbum.album_name}
            </div>
            <div className={cx('library-album-header-info')}>
              <MediaArtistLinkComponent mediaArtist={mediaSelectedAlbum.album_artist}/>
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
          mediaTrackContextMenuId={MediaContextMenus.AlbumTrack}
          disableCovers
          disableAlbumLinks
        />
        <MediaTrackContextMenu
          id={MediaContextMenus.AlbumTrack}
          menuItems={[
            MediaTrackContextMenuItem.AddToQueue,
            MediaTrackContextMenuItem.Separator,
            MediaTrackContextMenuItem.AddToLikedSongs,
            MediaTrackContextMenuItem.AddToPlaylist,
          ]}
        />
      </div>
    </div>
  );
}
