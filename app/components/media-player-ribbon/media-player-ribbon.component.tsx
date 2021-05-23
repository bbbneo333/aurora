import React, {useCallback, useRef, useState} from 'react';
import {useSelector} from 'react-redux';
import classNames from 'classnames/bind';
import {Col, Container, Row} from 'react-bootstrap';

import {MediaEnums} from '../../enums';
import {RootState} from '../../reducers';
import {MediaPlayerService} from '../../services';
import {DateTimeUtils} from '../../utils';

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
  }, [
    setMediaProgressDragValue,
  ]);
  const handleOnMediaProgressDragEnd = useCallback((value) => {
    MediaPlayerService.seekMediaTrack(value);
    setMediaProgressDragValue(undefined);
    // we are returning with the value that needs to be set on the progress bar
    return value;
  }, [
    setMediaProgressDragValue,
  ]);
  const handleOnVolumeChangeDrag = useCallback(value => (MediaPlayerService.changeMediaPlayerVolume(value) ? value : undefined), []);
  const handleOnVolumeButtonClick = useCallback(() => {
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

  return mediaPlayer.mediaPlaybackCurrentMediaTrack
    ? (
      <div className={cx('media-player-container')}>
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
                      // TODO: Fix eslint warnings
                      // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
                      <div
                        className={cx('media-player-control', 'media-player-control-lg')}
                        onClick={() => {
                          MediaPlayerService.pauseMediaPlayer();
                        }}
                      >
                        <i className="fas fa-pause-circle"/>
                      </div>
                    )
                    : (
                      // TODO: Fix eslint warnings
                      // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
                      <div
                        className={cx('media-player-control', 'media-player-control-lg')}
                        onClick={() => {
                          MediaPlayerService.resumeMediaPlayer();
                        }}
                      >
                        <i className="fas fa-play-circle"/>
                      </div>
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
                  <div className={cx('media-player-progress-counter')}>
                    {DateTimeUtils.formatSecondsToMinutes(mediaProgressDragValue !== undefined
                      ? mediaProgressDragValue
                      : (mediaPlayer.mediaPlaybackCurrentMediaProgress || 0))}
                  </div>
                  <div className={cx('media-player-progress-bar-container')}>
                    <MediaProgressBarComponent
                      disabled={mediaPlayer.mediaPlaybackState === MediaEnums.MediaPlayerPlaybackState.Loading}
                      value={mediaPlayer.mediaPlaybackCurrentMediaProgress}
                      maxValue={mediaPlayer.mediaPlaybackCurrentMediaDuration}
                      onDragUpdate={handleOnMediaProgressDragUpdate}
                      onDragEnd={handleOnMediaProgressDragEnd}
                    />
                  </div>
                  <div className={cx('media-player-progress-counter')}>
                    {mediaPlayer.mediaPlaybackCurrentMediaDuration
                      ? DateTimeUtils.formatSecondsToMinutes(mediaPlayer.mediaPlaybackCurrentMediaDuration)
                      : '--:--'}
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
                  {/* in order to have a consistent width for various volume indicators, we are setting a min-width */}
                  {/* so that it doesn't affects further items in the row */}
                  {/* TODO: Fix eslint warnings */}
                  {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
                  <div
                    className={cx('media-player-control', 'media-player-control-sm')}
                    style={{
                      minWidth: '34px',
                    }}
                    onClick={handleOnVolumeButtonClick}
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
                  </div>
                  <div className={cx('media-player-volume-bar-container')}>
                    <MediaProgressBarComponent
                      value={mediaPlayer.mediaPlaybackVolumeMuted
                        ? 0
                        : mediaPlayer.mediaPlaybackVolumeCurrent}
                      maxValue={mediaPlayer.mediaPlaybackVolumeMaxLimit}
                      onDragUpdate={handleOnVolumeChangeDrag}
                      onDragEnd={handleOnVolumeChangeDrag}
                    />
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </div>
    )
    : (
      <div className={cx('media-player-no-content')}/>
    );
}
