import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { useHistory, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isEmpty } from 'lodash';

import { useModal } from '../../contexts';
import { Layout, Routes } from '../../constants';
import { useEntityMissing } from '../../hooks';
import { IMediaPicture, IMediaPlaylistTrack } from '../../interfaces';
import { RootState } from '../../reducers';
import { I18nService, MediaCollectionService, MediaPlaylistService } from '../../services';

import {
  MediaCollectionActions,
  MediaCoverPictureUploadable,
  MediaPlaylistDeleteTracksModal,
  MediaTrackContextMenuItem,
  MediaTrackList,
} from '../../components';

import styles from './playlist.component.css';

const cx = classNames.bind(styles);

export function PlaylistPage() {
  const { playlistId } = useParams() as { playlistId: string };
  const history = useHistory();
  const mediaSelectedPlaylist = useSelector((state: RootState) => state.mediaLibrary.mediaSelectedPlaylist);
  const [mediaPlaylistTracks, setMediaPlaylistTracks] = useState<IMediaPlaylistTrack[]>([]);
  const isPlaylistRemoved = useEntityMissing(mediaSelectedPlaylist);
  const { showModal } = useModal();

  useEffect(() => {
    MediaPlaylistService.loadMediaPlaylist(playlistId);
  }, [
    playlistId,
  ]);

  useEffect(() => {
    if (!mediaSelectedPlaylist) {
      return;
    }

    MediaPlaylistService.getMediaPlaylistTracks(mediaSelectedPlaylist.id)
      .then((tracks) => {
        setMediaPlaylistTracks(tracks);
      });
  }, [
    playlistId,
    mediaSelectedPlaylist,
  ]);

  useEffect(() => {
    if (isPlaylistRemoved) {
      history.replace(Routes.LibraryPlaylists);
    }
  }, [isPlaylistRemoved, history]);

  const handleMediaTracksSorted = useCallback(async (mediaTracks: IMediaPlaylistTrack[]) => {
    if (!mediaSelectedPlaylist) {
      return;
    }

    await MediaPlaylistService.updateMediaPlaylist(mediaSelectedPlaylist.id, {
      tracks: mediaTracks,
    });

    setMediaPlaylistTracks(mediaTracks);
  }, [
    mediaSelectedPlaylist,
  ]);

  const handleSelectionDelete = useCallback((mediaPlaylistId: string, mediaPlaylistTrackIds: string[]) => new Promise<boolean>((resolve) => {
    showModal(MediaPlaylistDeleteTracksModal, {
      mediaPlaylistId,
      mediaPlaylistTrackIds,
    }, {
      onComplete: (res) => {
        // success signal if selected were deleted
        resolve(!isEmpty(res?.deletedPlaylistTrackIds));
      },
    });
  }), [
    showModal,
  ]);

  const handleOnPictureUpdate = useCallback(async (picture: IMediaPicture) => {
    if (!mediaSelectedPlaylist) {
      return;
    }

    await MediaPlaylistService.updateMediaPlaylist(mediaSelectedPlaylist.id, {
      cover_picture: picture,
    });
  }, [
    mediaSelectedPlaylist,
  ]);

  if (!mediaSelectedPlaylist || isPlaylistRemoved) {
    return null;
  }

  return (
    <div className="container-fluid">
      <div className={cx('playlist-header')}>
        <div className="row">
          <div className={cx(Layout.Grid.CollectionHeaderCoverColumn, 'playlist-header-cover-column')}>
            <MediaCoverPictureUploadable
              mediaPicture={mediaSelectedPlaylist.cover_picture}
              mediaPictureAltText={mediaSelectedPlaylist.name}
              className={cx('playlist-cover-picture')}
              onPictureUpdate={handleOnPictureUpdate}
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
        <MediaCollectionActions
          mediaItem={MediaCollectionService.getMediaItemFromPlaylist(mediaSelectedPlaylist)}
          hasTracks={!isEmpty(mediaPlaylistTracks)}
        />
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
            mediaTracks={mediaPlaylistTracks}
            mediaTrackList={{
              id: mediaSelectedPlaylist.id,
            }}
            getMediaTrackId={mediaPlaylistTrack => mediaPlaylistTrack.playlist_track_id}
            contextMenuItems={[
              MediaTrackContextMenuItem.Like,
              MediaTrackContextMenuItem.AddToQueue,
              MediaTrackContextMenuItem.Separator,
              MediaTrackContextMenuItem.RemoveFromPlaylist,
            ]}
            onMediaTracksSorted={handleMediaTracksSorted}
            onSelectionDelete={mediaTrackIds => handleSelectionDelete(mediaSelectedPlaylist.id, mediaTrackIds)}
          />
        </div>
      )}
    </div>
  );
}
