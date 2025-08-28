import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { useSelector } from 'react-redux';
import _ from 'lodash';

import {
  MediaTrack,
  MediaTrackList,
  MediaTrackContextMenu,
  MediaTrackContextMenuItem,
} from '../../components';

import { MediaEnums } from '../../enums';
import { IMediaQueueTrack } from '../../interfaces';
import { RootState } from '../../reducers';
import { I18nService, MediaPlayerService } from '../../services';

import styles from './player-queue.component.css';

const cx = classNames.bind(styles);

enum MediaContextMenus {
  PlayingTrack = 'media_queue_playing_track_context_menu',
}

export function PlayerQueueComponent() {
  const {
    mediaTracks,
    mediaPlaybackState,
    mediaPlaybackCurrentMediaTrack,
    mediaPlaybackQueueOnShuffle,
  } = useSelector((state: RootState) => state.mediaPlayer);

  const [mediaQueueTracks, setMediaQueueTracks] = useState<IMediaQueueTrack[]>([]);

  const onMediaTracksSorted = useCallback((mediaQueueTracksUpdated: IMediaQueueTrack[]) => {
    setMediaQueueTracks(mediaQueueTracksUpdated);
    MediaPlayerService.updateMediaQueueTracks(mediaQueueTracksUpdated);
  }, []);

  useEffect(() => {
    const mediaQueueTracksUpdated = MediaPlayerService.getMediaQueueTracks();
    setMediaQueueTracks(mediaQueueTracksUpdated);
  }, [
    mediaTracks.length,
    mediaPlaybackCurrentMediaTrack?.queue_entry_id,
    mediaPlaybackQueueOnShuffle,
  ]);

  return (
    <div className="container-fluid">
      {!mediaPlaybackCurrentMediaTrack && _.isEmpty(mediaTracks) && (
        <div className={cx('player-queue-section')}>
          <div className="row">
            <div className="col-12">
              <div className={cx('player-queue-section-header', 'player-queue-empty')}>
                {I18nService.getString('label_player_queue_empty')}
              </div>
            </div>
          </div>
        </div>
      )}
      {mediaPlaybackCurrentMediaTrack && (
        <div className={cx('player-queue-section')}>
          <div className="row">
            <div className="col-12">
              <div className={cx('player-queue-section-header')}>
                {I18nService.getString('label_player_queue_current_track')}
              </div>
              <div className={cx('player-queue-section-content')}>
                <MediaTrack
                  mediaTrack={mediaPlaybackCurrentMediaTrack}
                  mediaTrackContextMenuId={MediaContextMenus.PlayingTrack}
                  isPlaying={mediaPlaybackState === MediaEnums.MediaPlaybackState.Playing}
                  onMediaTrackPlay={() => {
                    MediaPlayerService.playMediaTrackFromQueue(mediaPlaybackCurrentMediaTrack);
                  }}
                />
                <MediaTrackContextMenu
                  id={MediaContextMenus.PlayingTrack}
                  menuItems={[
                    MediaTrackContextMenuItem.AddToQueue,
                    MediaTrackContextMenuItem.Separator,
                    MediaTrackContextMenuItem.AddToPlaylist,
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {!_.isEmpty(mediaQueueTracks) && (
        <div className={cx('player-queue-section')}>
          <div className="row">
            <div className="col-12">
              <div className={cx('player-queue-section-header')}>
                {I18nService.getString('label_player_queue_upcoming_tracks')}
              </div>
              <div className={cx('player-queue-section-content')}>
                <MediaTrackList
                  sortable
                  mediaTracks={mediaQueueTracks}
                  getMediaTrackKey={(mediaTrack: IMediaQueueTrack) => mediaTrack.queue_entry_id}
                  contextMenuItems={[
                    MediaTrackContextMenuItem.AddToQueue,
                    MediaTrackContextMenuItem.RemoveFromQueue,
                    MediaTrackContextMenuItem.Separator,
                    MediaTrackContextMenuItem.AddToPlaylist,
                  ]}
                  onMediaTrackPlay={(mediaTrack) => {
                    MediaPlayerService.playMediaTrackFromQueue(mediaTrack);
                  }}
                  onMediaTracksSorted={onMediaTracksSorted}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
