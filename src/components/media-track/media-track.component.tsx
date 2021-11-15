import React, {useCallback} from 'react';
import {useSelector} from 'react-redux';
import classNames from 'classnames/bind';
import * as _ from 'lodash';

import {useMediaTrackList} from '../../contexts';
import {MediaEnums} from '../../enums';
import {IMediaTrack} from '../../interfaces';
import {RootState} from '../../reducers';
import {MediaPlayerService} from '../../services';
import {DateTimeUtils} from '../../utils';

import {MediaTrackInfoComponent} from '../media-track-info/media-track-info.component';

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
    mediaPlaybackCurrentTrackList,
  } = useSelector((state: RootState) => state.mediaPlayer);

  const {
    mediaTracks,
    mediaTrackList,
  } = useMediaTrackList();

  const handleOnMediaTrackPlayButtonClick = useCallback(() => {
    if (!_.isEmpty(mediaTracks)) {
      MediaPlayerService.playMediaTrackFromList(mediaTracks, mediaTrack.id, mediaTrackList);
    } else {
      MediaPlayerService.playMediaTrack(mediaTrack);
    }
  }, [
    mediaTrack,
    mediaTracks,
    mediaTrackList,
  ]);

  const handleOnMediaTrackPauseButtonClick = useCallback(() => {
    MediaPlayerService.pauseMediaPlayer();
  }, []);

  const isMediaTrackPlaying = mediaPlaybackState === MediaEnums.MediaPlaybackState.Playing
    && (mediaTrackList?.id === mediaPlaybackCurrentTrackList?.id)
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
                    onClick={handleOnMediaTrackPauseButtonClick}
                  >
                    <i className="fas fa-pause"/>
                  </button>
                )
                : (
                  <button
                    type="submit"
                    className={cx('media-track-pause-button')}
                    onClick={handleOnMediaTrackPlayButtonClick}
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
              {DateTimeUtils.formatSecondsToDuration(mediaTrack.track_duration)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
