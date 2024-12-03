import React, { useEffect } from 'react';
import classNames from 'classnames/bind';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isEmpty } from 'lodash';

import { I18nService, MediaLibraryService } from '../../services';
import { Layout } from '../../constants';

import {
  MediaCoverPicture,
  MediaTrackContextMenu,
  MediaTrackContextMenuItem,
  MediaTrackListComponent,
} from '../../components';

import styles from './playlist.component.css';
import { RootState } from '../../reducers';

const cx = classNames.bind(styles);

enum MediaContextMenus {
  PlaylistTrack = 'media_playlist_track_context_menu',
}

export function PlaylistPage() {
  const { playlistId } = useParams() as { playlistId: string };

  const {
    mediaSelectedPlaylist,
  } = useSelector((state: RootState) => state.mediaLibrary);

  useEffect(() => {
    MediaLibraryService.loadMediaPlaylist(playlistId);
  }, [
    playlistId,
  ]);

  if (!mediaSelectedPlaylist) {
    return (<></>);
  }

  return (
    <div className="container-fluid">
      <div className={cx('playlist-header')}>
        <div className="row">
          <div className={cx(Layout.Grid.AlbumHeaderCoverColumn, 'playlist-header-cover-column')}>
            <MediaCoverPicture
              mediaPicture={mediaSelectedPlaylist.cover_picture}
              mediaPictureAltText={mediaSelectedPlaylist.name}
              className={cx('playlist-cover-picture')}
            />
          </div>
          <div className={cx(Layout.Grid.AlbumHeaderInfoColumn, 'playlist-header-info-column')}>
            <div className={cx('playlist-header-label')}>
              {I18nService.getString('label_album_header')}
            </div>
            <div className={cx('playlist-header-name')}>
              {mediaSelectedPlaylist.name}
            </div>
          </div>
        </div>
      </div>
      <div className={cx('playlist-actions')}/>
      {isEmpty(mediaSelectedPlaylist.tracks) && (
        <div className="row">
          <div className="col-12">
            <div className={cx('playlist-empty-section')}>
              <div className={cx('playlist-empty-label')}>
                {I18nService.getString('label_playlist_empty')}
              </div>
            </div>
          </div>
        </div>
      )}
      {!isEmpty(mediaSelectedPlaylist.tracks) && (
        <div className={cx('playlist-tracklist')}>
          <MediaTrackListComponent
            mediaTracks={mediaSelectedPlaylist.tracks}
            mediaTrackList={{
              id: mediaSelectedPlaylist.id,
            }}
            mediaTrackContextMenuId={MediaContextMenus.PlaylistTrack}
            disableCovers
            disableAlbumLinks
          />
          <MediaTrackContextMenu
            id={MediaContextMenus.PlaylistTrack}
            menuItems={[
              MediaTrackContextMenuItem.AddToQueue,
              MediaTrackContextMenuItem.Separator,
              MediaTrackContextMenuItem.RemoveFromPlaylist,
            ]}
          />
        </div>
      )}
    </div>
  );
}
