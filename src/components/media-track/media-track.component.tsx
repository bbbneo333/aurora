import React, {useCallback} from 'react';
import {useSelector} from 'react-redux';
import classNames from 'classnames/bind';
import * as _ from 'lodash';

import {Icons} from '../../constants';
import {useMediaTrackList} from '../../contexts';
import {MediaEnums} from '../../enums';
import {IMediaTrack} from '../../interfaces';
import {RootState} from '../../reducers';
import {MediaPlayerService} from '../../services';
import {DateTimeUtils} from '../../utils';

import {Icon} from '../icon/icon.component';
import {MediaCoverPictureComponent} from '../media-cover-picture/media-cover-picture.component';
import {MediaTrackInfoComponent} from '../media-track-info/media-track-info.component';

import styles from './media-track.component.css';

const cx = classNames.bind(styles);

function MediaTrackActionButton(props: {
  mediaTrack: IMediaTrack,
  handleOnPlayButtonClick?: () => void,
  isPlaying?: boolean,
}) {
  const {
    mediaTrack,
    handleOnPlayButtonClick,
    isPlaying,
  } = props;

  const {
    mediaPlaybackState,
    mediaPlaybackCurrentMediaTrack,
  } = useSelector((state: RootState) => state.mediaPlayer);

  const {
    mediaTracks,
    mediaTrackList,
  } = useMediaTrackList();

  const handleOnMediaTrackPlayButtonClick = useCallback(() => {
    if (handleOnPlayButtonClick) {
      handleOnPlayButtonClick();
    } else if (!_.isEmpty(mediaTracks)) {
      MediaPlayerService.playMediaTrackFromList(mediaTracks, mediaTrack.id, mediaTrackList);
    } else {
      MediaPlayerService.playMediaTrack(mediaTrack);
    }
  }, [
    handleOnPlayButtonClick,
    mediaTrack,
    mediaTracks,
    mediaTrackList,
  ]);

  const handleOnMediaTrackPauseButtonClick = useCallback(() => {
    MediaPlayerService.pauseMediaPlayer();
  }, []);

  const isMediaTrackPlaying = isPlaying || (mediaPlaybackState === MediaEnums.MediaPlaybackState.Playing
    && mediaPlaybackCurrentMediaTrack
    && mediaPlaybackCurrentMediaTrack.tracklist_id === mediaTrackList?.id
    && mediaPlaybackCurrentMediaTrack.id === mediaTrack.id);

  return (
    isMediaTrackPlaying
      ? (
        <button
          type="submit"
          className={cx('media-track-action-button')}
          onClick={handleOnMediaTrackPauseButtonClick}
        >
          <Icon name={Icons.MediaPause}/>
        </button>
      )
      : (
        <button
          type="submit"
          className={cx('media-track-action-button')}
          onClick={handleOnMediaTrackPlayButtonClick}
        >
          <Icon name={Icons.MediaPlay}/>
        </button>
      )
  );
}

export function MediaTrackComponent(props: {
  mediaTrack: IMediaTrack,
  handleOnPlayButtonClick?: () => void,
  isPlaying?: boolean,
  showCover?: boolean,
}) {
  const {
    mediaTrack,
    handleOnPlayButtonClick,
    isPlaying,
    showCover = true,
  } = props;

  return (
    <div className={cx('col-12 mb-3')}>
      <div className={cx('media-track')}>
        <div className="row">
          <div className={cx('col-10', 'media-track-main-column')}>
            <div className={cx('media-track-section')}>
              <MediaTrackActionButton
                mediaTrack={mediaTrack}
                isPlaying={isPlaying}
                handleOnPlayButtonClick={handleOnPlayButtonClick}
              />
            </div>
            {showCover && (
              <div className={cx('media-track-section')}>
                <MediaCoverPictureComponent
                  mediaPicture={mediaTrack.track_cover_picture}
                  mediaPictureAltText={mediaTrack.track_name}
                  className={cx('media-track-cover')}
                />
              </div>
            )}
            <div className={cx('media-track-section')}>
              <MediaTrackInfoComponent
                mediaTrack={mediaTrack}
                className={cx('media-track-info')}
              />
            </div>
          </div>
          <div className={cx('col-2', 'media-track-side-column')}>
            <div className={cx('media-track-duration')}>
              {DateTimeUtils.formatSecondsToDuration(mediaTrack.track_duration)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
