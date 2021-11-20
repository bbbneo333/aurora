import React, {useCallback, useRef, useState} from 'react';
import {Col, Row} from 'react-bootstrap';
import {useSelector} from 'react-redux';
import classNames from 'classnames/bind';

import {Routes} from '../../constants';
import {RootState} from '../../reducers';
import {MediaPlayerService} from '../../services';

import {RouterLinkToggle} from '../router-link-toggle/router-link-toggle.component';
import {MediaButtonComponent} from '../media-button/media-button.component';
import {MediaProgressBarComponent} from '../media-progress-bar/media-progress-bar.component';

import styles from './media-player-ribbon.component.css';

const cx = classNames.bind(styles);

export function MediaPlayerSide() {
  const {
    mediaPlaybackCurrentPlayingInstance,
    mediaPlaybackVolumeCurrent,
    mediaPlaybackVolumeMaxLimit,
    mediaPlaybackVolumeMuted,
  } = useSelector((state: RootState) => state.mediaPlayer);

  const mediaPlaybackVolumeMidThreshold = useRef<number>(mediaPlaybackVolumeMaxLimit / 2);

  // TODO: Add implementation for setMediaVolumeDragStartValue
  const [mediaVolumeDragStartValue] = useState<number | undefined>(undefined);

  const handleOnVolumeChangeDragCommit = useCallback((value) => {
    MediaPlayerService.changeMediaPlayerVolume(value);
  }, []);

  const handleOnVolumeButtonSubmit = useCallback(() => {
    // in case the drag brought down the volume all the way to 0, we will try to raise the volume to either:
    // (a) maximum value from where the first drag started originally started, or
    // (b) maximum volume
    // otherwise in case we already have a volume > 0, simply unmute
    if (mediaPlaybackVolumeCurrent === 0) {
      MediaPlayerService.changeMediaPlayerVolume(mediaVolumeDragStartValue || mediaPlaybackVolumeMaxLimit);
    } else if (!mediaPlaybackVolumeMuted) {
      MediaPlayerService.muteMediaPlayerVolume();
    } else {
      MediaPlayerService.unmuteMediaPlayerVolume();
    }
  }, [
    mediaVolumeDragStartValue,
    mediaPlaybackVolumeCurrent,
    mediaPlaybackVolumeMaxLimit,
    mediaPlaybackVolumeMuted,
  ]);

  if (!mediaPlaybackCurrentPlayingInstance) {
    return (<></>);
  }

  return (
    <Row className={cx('media-player-side-container')}>
      <Col className={cx('col-md-10 col-lg-8', 'media-player-side-controls-column')}>
        <RouterLinkToggle
          to={Routes.PlayerQueue}
          activeClassName={cx('active')}
          className={cx('media-player-control', 'media-player-control-sm', 'media-player-toggle', 'app-nav-link')}
        >
          <i className="fas fa-list"/>
        </RouterLinkToggle>
        <MediaButtonComponent
          className={cx('media-player-control', 'media-player-control-sm', 'media-player-volume-button')}
          onButtonSubmit={handleOnVolumeButtonSubmit}
        >
          <i className={cx('fas', {
            'fa-volume-up': !mediaPlaybackVolumeMuted
              && mediaPlaybackVolumeCurrent !== 0
              && mediaPlaybackVolumeCurrent > mediaPlaybackVolumeMidThreshold.current,
            'fa-volume-down': !mediaPlaybackVolumeMuted
              && mediaPlaybackVolumeCurrent !== 0
              && mediaPlaybackVolumeCurrent <= mediaPlaybackVolumeMidThreshold.current,
            'fa-volume-mute': mediaPlaybackVolumeMuted
              || mediaPlaybackVolumeCurrent === 0,
          })}
          />
        </MediaButtonComponent>
        <div className={cx('media-player-volume-bar-container')}>
          <MediaProgressBarComponent
            autoCommitOnUpdate
            value={mediaPlaybackVolumeMuted
              ? 0
              : mediaPlaybackVolumeCurrent}
            maxValue={mediaPlaybackVolumeMaxLimit}
            onDragCommit={handleOnVolumeChangeDragCommit}
          />
        </div>
      </Col>
    </Row>
  );
}
