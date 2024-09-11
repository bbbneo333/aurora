import React, { useCallback, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { useSelector } from 'react-redux';

import { DateTimeUtils } from '../../utils';
import { MediaEnums } from '../../enums';
import { RootState } from '../../reducers';
import { MediaPlayerService } from '../../services';

import { MediaProgressBarComponent } from '../media-progress-bar/media-progress-bar.component';

import styles from './media-player-ribbon.component.css';

const cx = classNames.bind(styles);

export function MediaPlayerProgress() {
  const {
    mediaPlaybackState,
    mediaPlaybackCurrentMediaTrack,
    mediaPlaybackCurrentMediaProgress,
  } = useSelector((state: RootState) => state.mediaPlayer);

  const [mediaProgressDragValue, setMediaProgressDragValue] = useState<number | undefined>(undefined);

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

  if (!mediaPlaybackCurrentMediaTrack) {
    return (<></>);
  }

  return (
    <Row className={cx('media-player-progress-container')}>
      <Col className={cx('col-12', 'media-player-progress-column')}>
        <div className={cx('media-player-progress-counter', 'start')}>
          {DateTimeUtils.formatSecondsToDuration(mediaProgressDragValue !== undefined
            ? mediaProgressDragValue
            : (mediaPlaybackCurrentMediaProgress || 0))}
        </div>
        <div className={cx('media-player-progress-bar-container')}>
          <MediaProgressBarComponent
            disabled={mediaPlaybackState === MediaEnums.MediaPlaybackState.Loading}
            value={mediaPlaybackCurrentMediaProgress}
            maxValue={mediaPlaybackCurrentMediaTrack.track_duration}
            onDragUpdate={handleOnMediaProgressDragUpdate}
            onDragCommit={handleOnMediaProgressDragCommit}
          />
        </div>
        <div className={cx('media-player-progress-counter', 'end')}>
          {DateTimeUtils.formatSecondsToDuration(mediaPlaybackCurrentMediaTrack.track_duration)}
        </div>
      </Col>
    </Row>
  );
}
