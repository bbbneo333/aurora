import React, {useCallback, useRef, useState} from 'react';
import {useSelector} from 'react-redux';
import classNames from 'classnames/bind';
import {Col, Container, Row} from 'react-bootstrap';

import {MediaEnums} from '../../enums';
import {RootState} from '../../reducers';
import {MediaPlayerService} from '../../services';
import {DateTimeUtils} from '../../utils';

import {MediaButtonComponent} from '../media-button/media-button.component';
import {MediaProgressBarComponent} from '../media-progress-bar/media-progress-bar.component';
import {MediaTrackInfoComponent} from '../media-track-info/media-track-info.component';
import {MediaTrackCoverPictureComponent} from '../media-track-cover-picture/media-track-cover-picture.component';

import styles from './media-player-ribbon.component.css';

const cx = classNames.bind(styles);

export function MediaPlayerRibbonComponent() {
  const mediaPlayer = useSelector((state: RootState) => state.mediaPlayer);

  const mediaPlaybackVolumeMidThreshold = useRef<number>(mediaPlayer.mediaPlaybackVolumeMaxLimit / 2);
  const [mediaProgressDragValue, setMediaProgressDragValue] = useState<number | undefined>(undefined);

  // TODO: Add implementation for setMediaVolumeDragStartValue
  const [mediaVolumeDragStartValue] = useState<number | undefined>(undefined);

  const handleOnMediaProgressDragUpdate = useCallback((value) => {
    setMediaProgressDragValue(value);
    // we don't want updated value to be committed
    return false;
  }, [
    setMediaProgressDragValue,
  ]);
  const handleOnMediaProgressDragCommit = useCallback((value) => {
    MediaPlayerService.seekMediaTrack(value);
    setMediaProgressDragValue(undefined);
  }, [
    setMediaProgressDragValue,
  ]);
  const handleOnVolumeChangeDragCommit = useCallback((value) => {
    MediaPlayerService.changeMediaPlayerVolume(value);
  }, []);
  const handleOnVolumeButtonSubmit = useCallback(() => {
    // in case the drag brought down the volume all the way to 0, we will try to raise the volume to either:
    // (a) maximum value from where the first drag started originally started, or
    // (b) maximum volume
    // otherwise in case we already have a volume > 0, simply unmute
    if (mediaPlayer.mediaPlaybackVolumeCurrent === 0) {
      MediaPlayerService.changeMediaPlayerVolume(mediaVolumeDragStartValue || mediaPlayer.mediaPlaybackVolumeMaxLimit);
    } else if (!mediaPlayer.mediaPlaybackVolumeMuted) {
      MediaPlayerService.muteMediaPlayerVolume();
    } else {
      MediaPlayerService.unmuteMediaPlayerVolume();
    }
  }, [
    mediaVolumeDragStartValue,
    mediaPlayer.mediaPlaybackVolumeCurrent,
    mediaPlayer.mediaPlaybackVolumeMaxLimit,
    mediaPlayer.mediaPlaybackVolumeMuted,
  ]);

  return (
    <div className={cx('media-player-container', {
      active: mediaPlayer.mediaPlaybackCurrentMediaTrack,
    })}
    >
      {mediaPlayer.mediaPlaybackCurrentMediaTrack && (
        <Container fluid>
          <Row className={cx('media-player-content')}>
            <Col className={cx('col-md-4 col-xl-3')}>
              <Row className={cx('media-player-info-container')}>
                <Col className={cx('col-12', 'media-player-info-column')}>
                  <MediaTrackCoverPictureComponent
                    mediaTrack={mediaPlayer.mediaPlaybackCurrentMediaTrack}
                  />
                  <MediaTrackInfoComponent
                    mediaTrack={mediaPlayer.mediaPlaybackCurrentMediaTrack}
                    infoContainerClassName={cx('media-player-track-info-container')}
                  />
                  <div className={cx('media-player-control', 'media-player-control-sm')}>
                    <i className="far fa-heart"/>
                  </div>
                </Col>
              </Row>
            </Col>
            <Col className={cx('col-md-4 col-xl-6')}>
              <Row className={cx('media-player-controls-container')}>
                <Col className={cx('col-12', 'media-player-controls-column')}>
                  <div className={cx('media-player-control', 'media-player-control-sm')}>
                    <i className="fas fa-random"/>
                  </div>
                  <div className={cx('media-player-control', 'media-player-control-md')}>
                    <i className="fas fa-step-backward"/>
                  </div>
                  {mediaPlayer.mediaPlaybackState === MediaEnums.MediaPlayerPlaybackState.Playing
                    ? (
                      <MediaButtonComponent
                        className={cx('media-player-control', 'media-player-control-lg')}
                        onButtonSubmit={() => {
                          MediaPlayerService.pauseMediaPlayer();
                        }}
                      >
                        <i className="fas fa-pause-circle"/>
                      </MediaButtonComponent>
                    )
                    : (
                      <MediaButtonComponent
                        disabled={mediaPlayer.mediaPlaybackState === MediaEnums.MediaPlayerPlaybackState.Loading}
                        className={cx('media-player-control', 'media-player-control-lg')}
                        onButtonSubmit={() => {
                          MediaPlayerService.resumeMediaPlayer();
                        }}
                      >
                        <i className="fas fa-play-circle"/>
                      </MediaButtonComponent>
                    )}
                  <div className={cx('media-player-control', 'media-player-control-md')}>
                    <i className="fas fa-step-forward"/>
                  </div>
                  <div className={cx('media-player-control', 'media-player-control-sm')}>
                    <i className="fas fa-redo-alt"/>
                  </div>
                </Col>
              </Row>
              <Row className={cx('media-player-progress-container')}>
                <Col className={cx('col-12', 'media-player-progress-column')}>
                  <div className={cx('media-player-progress-counter', 'start')}>
                    {DateTimeUtils.formatSecondsToMinutes(mediaProgressDragValue !== undefined
                      ? mediaProgressDragValue
                      : (mediaPlayer.mediaPlaybackCurrentMediaProgress || 0))}
                  </div>
                  <div className={cx('media-player-progress-bar-container')}>
                    <MediaProgressBarComponent
                      disabled={mediaPlayer.mediaPlaybackState === MediaEnums.MediaPlayerPlaybackState.Loading}
                      value={mediaPlayer.mediaPlaybackCurrentMediaProgress}
                      maxValue={mediaPlayer.mediaPlaybackCurrentMediaTrack.track_duration}
                      onDragUpdate={handleOnMediaProgressDragUpdate}
                      onDragCommit={handleOnMediaProgressDragCommit}
                    />
                  </div>
                  <div className={cx('media-player-progress-counter', 'end')}>
                    {DateTimeUtils.formatSecondsToMinutes(mediaPlayer.mediaPlaybackCurrentMediaTrack.track_duration)}
                  </div>
                </Col>
              </Row>
            </Col>
            <Col className={cx('col-md-4 col-xl-3')}>
              <Row className={cx('media-player-side-container')}>
                <Col className={cx('col-md-10 col-lg-8', 'media-player-side-controls-column')}>
                  <div className={cx('media-player-control', 'media-player-control-sm')}>
                    <i className="fas fa-list"/>
                  </div>
                  <MediaButtonComponent
                    className={cx('media-player-control', 'media-player-control-sm', 'media-player-volume-button')}
                    onButtonSubmit={handleOnVolumeButtonSubmit}
                  >
                    <i className={cx('fas', {
                      'fa-volume-up': !mediaPlayer.mediaPlaybackVolumeMuted
                        && mediaPlayer.mediaPlaybackVolumeCurrent !== 0
                        && mediaPlayer.mediaPlaybackVolumeCurrent > mediaPlaybackVolumeMidThreshold.current,
                      'fa-volume-down': !mediaPlayer.mediaPlaybackVolumeMuted
                        && mediaPlayer.mediaPlaybackVolumeCurrent !== 0
                        && mediaPlayer.mediaPlaybackVolumeCurrent <= mediaPlaybackVolumeMidThreshold.current,
                      'fa-volume-mute': mediaPlayer.mediaPlaybackVolumeMuted
                        || mediaPlayer.mediaPlaybackVolumeCurrent === 0,
                    })}
                    />
                  </MediaButtonComponent>
                  <div className={cx('media-player-volume-bar-container')}>
                    <MediaProgressBarComponent
                      autoCommitOnUpdate
                      value={mediaPlayer.mediaPlaybackVolumeMuted
                        ? 0
                        : mediaPlayer.mediaPlaybackVolumeCurrent}
                      maxValue={mediaPlayer.mediaPlaybackVolumeMaxLimit}
                      onDragCommit={handleOnVolumeChangeDragCommit}
                    />
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      )}
    </div>
  );
}
