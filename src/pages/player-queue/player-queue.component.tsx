import React from 'react';
import classNames from 'classnames/bind';
import { useSelector } from 'react-redux';
import _ from 'lodash';

import {
  MediaTrack,
  MediaTrackContextMenu,
  MediaTrackContextMenuItem,
  MediaTracks,
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
  } = useSelector((state: RootState) => state.mediaPlayer);

  let mediaPlaybackUpcomingTracks: IMediaQueueTrack[] = [];
  if (mediaPlaybackCurrentMediaTrack) {
    const mediaPlaybackCurrentMediaTrackPointer = _.findIndex(mediaTracks, mediaTrack => mediaTrack.queue_entry_id === mediaPlaybackCurrentMediaTrack.queue_entry_id);
    mediaPlaybackUpcomingTracks = _.slice(mediaTracks, mediaPlaybackCurrentMediaTrackPointer + 1);
  }

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
                  handleOnPlayButtonClick={() => {
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
      {!_.isEmpty(mediaPlaybackUpcomingTracks) && (
        <div className={cx('player-queue-section')}>
          <div className="row">
            <div className="col-12">
              <div className={cx('player-queue-section-header')}>
                {I18nService.getString('label_player_queue_upcoming_tracks')}
              </div>
              <div className={cx('player-queue-section-content')}>
                <MediaTracks
                  mediaTracks={mediaPlaybackUpcomingTracks}
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
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
