import React from 'react';
import {useSelector} from 'react-redux';
import classNames from 'classnames/bind';

import {MediaEnums} from '../../enums';
import {IMediaTrack} from '../../interfaces';
import {RootState} from '../../reducers';
import {MediaPlayerService} from '../../services';
import {DateTimeUtils} from '../../utils';

import {MediaTrackInfoComponent} from '..';

import styles from './media-track.component.css';

const cx = classNames.bind(styles);

export function MediaTrackComponent(props: {
  mediaTrack: IMediaTrack,
}) {
  const {
    mediaTrack,
  } = props;

  const {
    mediaPlaybackState,
    mediaPlaybackCurrentMediaTrack,
  } = useSelector((state: RootState) => state.mediaPlayer);

  const isMediaTrackPlaying = mediaPlaybackState === MediaEnums.MediaPlayerPlaybackState.Playing
    && mediaPlaybackCurrentMediaTrack
    && mediaPlaybackCurrentMediaTrack.id === mediaTrack.id;

  return (
    <div className={cx('col-12')}>
      <div className={cx('media-track')}>
        <div className="row">
          <div className={cx('col-1', 'media-track-action-column')}>
            {
              isMediaTrackPlaying
                ? (
                  <button
                    type="submit"
                    className={cx('media-track-play-button')}
                    onClick={() => MediaPlayerService.pauseMediaPlayer()}
                  >
                    <i className="fas fa-pause"/>
                  </button>
                )
                : (
                  <button
                    type="submit"
                    className={cx('media-track-pause-button')}
                    onClick={() => MediaPlayerService.playMediaTrack(mediaTrack)}
                  >
                    <i className="fas fa-play"/>
                  </button>
                )
            }
          </div>
          <div className={cx('col-10', 'media-track-info-column')}>
            <MediaTrackInfoComponent
              mediaTrack={mediaTrack}
              className={cx('media-track-info')}
            />
          </div>
          <div className={cx('col-1', 'media-track-duration-column')}>
            <div className={cx('media-track-duration')}>
              {DateTimeUtils.formatSecondsToMinutes(mediaTrack.track_duration)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
