import React, {useCallback} from 'react';
import {Col, Row} from 'react-bootstrap';
import {useSelector} from 'react-redux';
import classNames from 'classnames/bind';

import {RootState} from '../../reducers';
import {MediaPlayerService} from '../../services';
import {MediaEnums} from '../../enums';

import {MediaButtonComponent} from '../media-button/media-button.component';

import styles from './media-player-ribbon.component.css';

const cx = classNames.bind(styles);

export function MediaPlayerControls() {
  const {
    mediaPlaybackState,
    mediaPlaybackCurrentMediaTrack,
    mediaPlaybackCurrentMediaProgress,
    mediaPlaybackQueueOnShuffle,
  } = useSelector((state: RootState) => state.mediaPlayer);

  const handleOnMediaPlayPreviousButtonSubmit = useCallback(() => {
    // if the track has progressed for more than 30% of it's duration
    // or if we don't have any previous track in the queue
    // we will be seeking current track to 0
    // otherwise, we will be playing the next track
    if ((mediaPlaybackCurrentMediaTrack
        && mediaPlaybackCurrentMediaProgress
        && ((mediaPlaybackCurrentMediaProgress / mediaPlaybackCurrentMediaTrack.track_duration) * 100) > 30)
      || !MediaPlayerService.hasPreviousTrack()) {
      MediaPlayerService.seekMediaTrack(0);
    } else {
      MediaPlayerService.playPreviousTrack();
    }
  }, [
    mediaPlaybackCurrentMediaTrack,
    mediaPlaybackCurrentMediaProgress,
  ]);

  return (
    <Row className={cx('media-player-controls-container')}>
      <Col className={cx('col-12', 'media-player-controls-column')}>
        <MediaButtonComponent
          className={cx('media-player-control', 'media-player-control-sm', 'media-player-toggle', {
            active: mediaPlaybackQueueOnShuffle,
          })}
          onButtonSubmit={() => {
            MediaPlayerService.toggleShuffle();
          }}
        >
          <i className="fas fa-random"/>
        </MediaButtonComponent>
        <MediaButtonComponent
          className={cx('media-player-control', 'media-player-control-md')}
          onButtonSubmit={handleOnMediaPlayPreviousButtonSubmit}
        >
          <i className="fas fa-step-backward"/>
        </MediaButtonComponent>
        {mediaPlaybackState === MediaEnums.MediaPlaybackState.Playing
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
              disabled={mediaPlaybackState === MediaEnums.MediaPlaybackState.Loading}
              className={cx('media-player-control', 'media-player-control-lg')}
              onButtonSubmit={() => {
                MediaPlayerService.resumeMediaPlayer();
              }}
            >
              <i className="fas fa-play-circle"/>
            </MediaButtonComponent>
          )}
        <MediaButtonComponent
          className={cx('media-player-control', 'media-player-control-md')}
          disabled={!MediaPlayerService.hasNextTrack()}
          onButtonSubmit={() => {
            MediaPlayerService.playNextTrack();
          }}
        >
          <i className="fas fa-step-forward"/>
        </MediaButtonComponent>
        <MediaButtonComponent
          disabled
          className={cx('media-player-control', 'media-player-control-sm')}
        >
          <i className="fas fa-redo-alt"/>
        </MediaButtonComponent>
      </Col>
    </Row>
  );
}
