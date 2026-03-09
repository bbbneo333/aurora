import React, { useCallback, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { useSelector } from 'react-redux';

import { MediaUtils } from '../../utils';
import { MediaEnums } from '../../enums';
import { RootState } from '../../reducers';
import { MediaPlayerService } from '../../services';

import { Slider } from '../slider/slider.component';

import styles from './media-player.component.css';

const cx = classNames.bind(styles);

export function MediaPlayerProgress() {
  const {
    mediaPlaybackState,
    mediaPlaybackCurrentMediaTrack,
    mediaPlaybackCurrentMediaProgress,
    mediaPlaybackPreparationStatus,
  } = useSelector((state: RootState) => state.mediaPlayer);

  const [mediaProgressDragValue, setMediaProgressDragValue] = useState<number | undefined>(undefined);

  const handleProgressDragUpdate = useCallback((value: number) => {
    setMediaProgressDragValue(value);
    // we don't want updated value to be committed
    return false;
  }, [
    setMediaProgressDragValue,
  ]);

  const handleProgressDragCommit = useCallback((value: number) => {
    MediaPlayerService.seekMediaTrack(value);
    setMediaProgressDragValue(undefined);
  }, [
    setMediaProgressDragValue,
  ]);

  if (!mediaPlaybackCurrentMediaTrack) {
    return (<></>);
  }

  const preparationProgress = Math.max(0, Math.min(100, mediaPlaybackPreparationStatus?.progress || 0));
  const isPreparingPlayback = !!mediaPlaybackPreparationStatus;
  const startCounter = isPreparingPlayback
    ? `${mediaPlaybackPreparationStatus?.phase === 'converting' ? 'Converting' : 'Preparing'} ${preparationProgress}%`
    : MediaUtils.formatMediaTrackDuration(mediaProgressDragValue !== undefined
      ? mediaProgressDragValue
      : (mediaPlaybackCurrentMediaProgress || 0));
  const endCounter = isPreparingPlayback
    ? '100%'
    : MediaUtils.formatMediaTrackDuration(mediaPlaybackCurrentMediaTrack.track_duration);
  const sliderValue = isPreparingPlayback
    ? preparationProgress
    : mediaPlaybackCurrentMediaProgress;
  const sliderMaxValue = isPreparingPlayback
    ? 100
    : mediaPlaybackCurrentMediaTrack.track_duration;

  return (
    <Row className={cx('media-player-progress-container')}>
      <Col className={cx('col-12', 'media-player-progress-column')}>
        <div className={cx('media-player-progress-counter', 'start')}>
          {startCounter}
        </div>
        <div className={cx('media-player-progress-bar-container')}>
          <Slider
            disabled={isPreparingPlayback || mediaPlaybackState === MediaEnums.MediaPlaybackState.Loading}
            value={sliderValue}
            maxValue={sliderMaxValue}
            onDragUpdate={handleProgressDragUpdate}
            onDragCommit={handleProgressDragCommit}
          />
        </div>
        <div className={cx('media-player-progress-counter', 'end')}>
          {endCounter}
        </div>
      </Col>
    </Row>
  );
}
