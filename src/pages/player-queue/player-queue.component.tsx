import React from 'react';
import classNames from 'classnames/bind';
import {useSelector} from 'react-redux';

import {MediaTrackComponent} from '../../components';
import {MediaEnums} from '../../enums';
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

  return (
    <div>
      <div className={cx('player-queue')}>
        <div className="container-fluid">
          <div className={cx('player-queue-header')}>
            <div className="row">
              <div className="col-12">
                <div className={cx('player-queue-header-label')}>
                  {I18nService.getString('label_player_queue_header')}
                </div>
              </div>
            </div>
          </div>
          <div className={cx('player-queue-tracklist')}>
            <div className="row">
              {mediaTracks.map(mediaTrack => (
                <MediaTrackComponent
                  key={mediaTrack.id}
                  mediaTrack={mediaTrack}
                  handleOnPlayButtonClick={() => {
                    MediaPlayerService.playMediaTrackFromQueue(mediaTrack);
                  }}
                  isPlaying={
                    mediaPlaybackState === MediaEnums.MediaPlaybackState.Playing
                    && mediaPlaybackCurrentMediaTrack
                    && mediaPlaybackCurrentMediaTrack.queue_entry_id === mediaTrack.queue_entry_id
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
