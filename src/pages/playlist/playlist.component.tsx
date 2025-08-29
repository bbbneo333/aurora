import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { useHistory, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isEmpty } from 'lodash';

import { I18nService, MediaLibraryService } from '../../services';
import { Layout, Routes } from '../../constants';
import { RootState } from '../../reducers';
import { IMediaPlaylistTrack } from '../../interfaces';
import { useEntityMissing } from '../../hooks';

import {
  MediaCoverPicture,
  MediaTrackContextMenuItem,
  MediaTrackList,
} from '../../components';

import styles from './playlist.component.css';
import { PlaylistActions } from './playlist-actions.component';

const cx = classNames.bind(styles);

export function PlaylistPage() {
  const { playlistId } = useParams() as { playlistId: string };
  const history = useHistory();
  const { mediaSelectedPlaylist } = useSelector((state: RootState) => state.mediaLibrary);
  const [mediaPlaylistTracks, setMediaPlaylistTracks] = useState<IMediaPlaylistTrack[]>([]);
  const isPlaylistRemoved = useEntityMissing(mediaSelectedPlaylist);

  useEffect(() => {
    MediaLibraryService.loadMediaPlaylist(playlistId);
  }, [
    playlistId,
  ]);

  useEffect(() => {
    if (!mediaSelectedPlaylist) {
      return;
    }

    MediaLibraryService.getMediaPlaylistTracks(mediaSelectedPlaylist.id)
      .then((tracks) => {
        setMediaPlaylistTracks(tracks);
      });
  }, [
    playlistId,
    mediaSelectedPlaylist,
  ]);

  const onMediaTracksSorted = useCallback((mediaTracks: IMediaPlaylistTrack[]) => {
    if (!mediaSelectedPlaylist) {
      return;
    }

    // TODO: Improve this experience
    // ideally, tracks in playlist should freeze and remain to their updated position
    // make the update call and let it take time
    // unfreeze tracks with updated position if call succeeds
    // revert back to old position if call fails

    setMediaPlaylistTracks(mediaTracks);

    MediaLibraryService.updateMediaPlaylist(mediaSelectedPlaylist.id, {
      tracks: mediaTracks,
    })
      .then(() => {
      });
  }, [
    mediaSelectedPlaylist,
  ]);

  if (isPlaylistRemoved) {
    return history.replace(Routes.LibraryPlaylists);
  }

  if (!mediaSelectedPlaylist) {
    return (<></>);
  }

  return (
    <div className="container-fluid">
      <div className={cx('playlist-header')}>
        <div className="row">
          <div className={cx(Layout.Grid.CollectionHeaderCoverColumn, 'playlist-header-cover-column')}>
            <MediaCoverPicture
              mediaPicture={mediaSelectedPlaylist.cover_picture}
              mediaPictureAltText={mediaSelectedPlaylist.name}
              className={cx('playlist-cover-picture')}
            />
          </div>
          <div className={cx(Layout.Grid.CollectionHeaderInfoColumn, 'playlist-header-info-column')}>
            <div className={cx('playlist-header-label')}>
              {I18nService.getString('label_playlist_header')}
            </div>
            <div className={cx('playlist-header-name')}>
              {mediaSelectedPlaylist.name}
            </div>
          </div>
        </div>
      </div>
      <div className={cx('playlist-actions')}>
        <PlaylistActions mediaPlaylist={mediaSelectedPlaylist}/>
      </div>
      {isEmpty(mediaPlaylistTracks) && (
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
      {!isEmpty(mediaPlaylistTracks) && (
        <div className={cx('playlist-tracklist')}>
          <MediaTrackList
            sortable
            disableCovers
            disableAlbumLinks
            mediaTracks={mediaPlaylistTracks}
            mediaTrackList={{
              id: mediaSelectedPlaylist.id,
            }}
            getMediaTrackKey={mediaPlaylistTrack => mediaPlaylistTrack.playlist_track_id}
            contextMenuItems={[
              MediaTrackContextMenuItem.AddToQueue,
              MediaTrackContextMenuItem.Separator,
              MediaTrackContextMenuItem.RemoveFromPlaylist,
            ]}
            onMediaTracksSorted={onMediaTracksSorted}
          />
        </div>
      )}
    </div>
  );
}
