import React from 'react';
import classNames from 'classnames/bind';
import {useSelector} from 'react-redux';
import * as _ from 'lodash';

import {MediaTrackComponent} from '../../components';
import {MediaEnums} from '../../enums';
import {IMediaQueueTrack} from '../../interfaces';
import {RootState} from '../../reducers';
import {I18nService, MediaPlayerService} from '../../services';

import styles from './player-queue.component.css';

const cx = classNames.bind(styles);

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
    <div>
      <div className={cx('player-queue')}>
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
                    <MediaTrackComponent
                      mediaTrack={mediaPlaybackCurrentMediaTrack}
                      isPlaying={mediaPlaybackState === MediaEnums.MediaPlaybackState.Playing}
                      handleOnPlayButtonClick={() => {
                        MediaPlayerService.playMediaTrackFromQueue(mediaPlaybackCurrentMediaTrack);
                      }}
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
                    {mediaPlaybackUpcomingTracks.map(mediaTrack => (
                      <MediaTrackComponent
                        key={mediaTrack.id}
                        mediaTrack={mediaTrack}
                        handleOnPlayButtonClick={() => {
                          MediaPlayerService.playMediaTrackFromQueue(mediaTrack);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
