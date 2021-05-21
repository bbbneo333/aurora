import React, {useCallback, useRef, useState} from 'react';
import {useSelector} from 'react-redux';
import classNames from 'classnames/bind';
import {Col, Container, Row} from 'react-bootstrap';

import {MediaEnums} from '../../enums';
import {RootState} from '../../reducers';
import {MediaPlayerService} from '../../services';
import {DateTimeUtils} from '../../utils';

import {MediaProgressBarComponent} from '../media-progress-bar/media-progress-bar.component';

import styles from './media-player-ribbon.component.css';

const cx = classNames.bind(styles);

export function MediaPlayerRibbonComponent() {
  const mediaPlayer = useSelector((state: RootState) => state.mediaPlayer);

  const mediaPlaybackVolumeMidThreshold = useRef<number>(mediaPlayer.mediaPlaybackVolumeMaxLimit / 2);

  const [mediaProgressIsDragging, setMediaProgressAsDragging] = useState<boolean>(false);
  const [mediaProgressDragValue, setMediaProgressDragValue] = useState<number | undefined>(undefined);

  // TODO: Add implementation for setMediaVolumeDragStartValue
  const [mediaVolumeDragStartValue] = useState<number | undefined>(undefined);

  const handleOnMediaProgressDragUpdate = useCallback((value) => {
    setMediaProgressAsDragging(true);
    setMediaProgressDragValue(value);
  }, [
    setMediaProgressDragValue,
    setMediaProgressAsDragging,
  ]);
  const handleOnMediaProgressDragEnd = useCallback((value) => {
    MediaPlayerService.seekMediaTrack(value);

    setMediaProgressDragValue(undefined);
    setMediaProgressAsDragging(false);

    // we are returning with the value that needs to be set on the progress bar
    return value;
  }, [
    setMediaProgressDragValue,
    setMediaProgressAsDragging,
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
            <Col className={cx('col-3')}>
              <Row className={cx('media-player-info-container')}>
                <Col className={cx('col-4', 'media-track-album-artwork-column')}>
                  <div className={cx('media-track-album-artwork-container')}/>
                </Col>
                <Col className={cx('col-8', 'media-track-info-column')}>
                  <span className={cx('media-track-info-name')}>
                    {mediaPlayer.mediaPlaybackCurrentMediaTrack.track_name}
                  </span>
                  <span className={cx('media-track-info-album')}>
                    {mediaPlayer.mediaPlaybackCurrentMediaTrack.track_album_name}
                  </span>
                </Col>
                {/* TODO: Fix the layout issue and add this back */}
                {/* <Col className={cx('col-1', 'media-track-like-column')}> */}
                {/*  <i className="far fa-heart"/> */}
                {/* </Col> */}
              </Row>
            </Col>
            <Col className={cx('col-6')}>
              <Row className={cx('media-player-controls-container')}>
                <Col className={cx('media-player-controls-column')}>
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
                <Col className={cx('col-1', 'p-0', 'media-player-progress-counter-column', 'start', {
                  updating: mediaProgressIsDragging,
                })}
                >
                  {DateTimeUtils.formatSecondsToMinutes(mediaProgressDragValue !== undefined
                    ? mediaProgressDragValue
                    : (mediaPlayer.mediaPlaybackCurrentMediaProgress || 0))}
                </Col>
                <Col className={cx('col-10', 'media-player-progress-bar-column')}>
                  <MediaProgressBarComponent
                    value={mediaPlayer.mediaPlaybackCurrentMediaProgress}
                    maxValue={mediaPlayer.mediaPlaybackCurrentMediaDuration}
                    onDragUpdate={handleOnMediaProgressDragUpdate}
                    onDragEnd={handleOnMediaProgressDragEnd}
                  />
                </Col>
                <Col className={cx('col-1', 'p-0', 'media-player-progress-counter-column', 'end')}>
                  {mediaPlayer.mediaPlaybackCurrentMediaDuration
                    ? DateTimeUtils.formatSecondsToMinutes(mediaPlayer.mediaPlaybackCurrentMediaDuration)
                    : '--:--'}
                </Col>
              </Row>
            </Col>
            <Col className={cx('col-3')}>
              <Row className={cx('media-player-side-container')}>
                <Col className={cx('col-12 col-lg-8 col-xl-6', 'media-player-side-column')}>
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
                  <div className={cx('media-player-control', 'w-100')}>
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
